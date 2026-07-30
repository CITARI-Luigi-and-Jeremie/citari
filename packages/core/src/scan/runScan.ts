import { randomUUID } from "node:crypto";
import { getDb, unwrap } from "../db";
import { getProviders } from "../providers/index";
import { generateQueries } from "../queries/generate";
import { classifyMentions } from "../scoring/classify";
import { computeScoreDetail, computeShareOfVoice, type MentionForScoring } from "../scoring/score";
import { generatePriorityActions } from "../report/actions";
import { costCents, MAX_SCAN_COST_CENTS } from "../cost";
import { ENGINES, type BrandRef, type EngineId, type Lang, type MentionResult } from "../types";

const CONCURRENCY = 8;

interface ScanRow {
  id: string;
  brand: string;
  url: string;
  sector: string;
  competitors: BrandRef[];
  lang: Lang;
  previous_scan_id: string | null;
}

/** Petit limiteur de concurrence sans dépendance. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T, i);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Exécute un scan de bout en bout : génération de requêtes (sauf rescan : requêtes
 * pré-copiées), interrogation des 4 moteurs, détection + classification des mentions,
 * scoring, part de voix, 10 actions. Statut/progression écrits en base pour le polling.
 */
export async function runScan(scanId: string): Promise<void> {
  const db = getDb();
  const setScan = (patch: Record<string, unknown>) => db.from("scans").update(patch).eq("id", scanId);

  try {
    const scan = unwrap(await db.from("scans").select("*").eq("id", scanId).single()) as ScanRow;
    const brand: BrandRef = { name: scan.brand, url: scan.url };
    const competitors: BrandRef[] = (scan.competitors ?? []).slice(0, 3);
    const allBrands = [brand, ...competitors];
    let totalCost = 0;
    const trackCost = async (engine: EngineId | "anthropic-internal", inTok: number, outTok: number) => {
      const c = costCents(engine, inTok, outTok);
      totalCost += c;
      await db.from("cost_log").insert({ scan_id: scanId, engine, input_tokens: inTok, output_tokens: outTok, cost_cents: c });
    };
    const onUsage = (u: { inputTokens: number; outputTokens: number }) =>
      void trackCost("anthropic-internal", u.inputTokens, u.outputTokens);

    // 1. Requêtes — un rescan réutilise les requêtes déjà copiées (comparabilité stricte)
    await setScan({ status: "generating_queries", progress: 5 });
    let queryRows = unwrap(await db.from("queries").select("*").eq("scan_id", scanId).order("position")) as {
      id: string; text: string; category: string;
    }[];
    if (queryRows.length === 0) {
      const generated = await generateQueries(
        { brand, sector: scan.sector, competitors, lang: scan.lang ?? "fr" },
        onUsage
      );
      queryRows = unwrap(
        await db
          .from("queries")
          .insert(generated.map((q, i) => ({ scan_id: scanId, text: q.text, category: q.category, position: i })))
          .select("*")
      ) as typeof queryRows;
    }

    // 2. Interrogation des 4 moteurs
    await setScan({ status: "running", progress: 10 });
    const providers = getProviders(allBrands);
    const jobs = queryRows.flatMap((q) => ENGINES.map((engine) => ({ query: q, engine })));
    let done = 0;
    let aborted = false;

    await mapLimit(jobs, CONCURRENCY, async ({ query, engine }) => {
      if (aborted || totalCost >= MAX_SCAN_COST_CENTS) {
        aborted = true;
        return;
      }
      try {
        const answer = await providers[engine].ask(query.text, (scan.lang ?? "fr") as Lang);
        await trackCost(engine, answer.inputTokens, answer.outputTokens);
        unwrap(
          await db
            .from("responses")
            .insert({
              query_id: query.id,
              scan_id: scanId,
              engine,
              text: answer.text,
              citations: answer.citations,
              latency_ms: answer.latencyMs,
              cost_cents: costCents(engine, answer.inputTokens, answer.outputTokens),
            })
            .select("id")
        );
      } catch (e) {
        // Un moteur qui échoue sur une requête ne tue pas le scan.
        console.error(`[scan ${scanId}] ${engine} a échoué sur "${query.text}": ${String(e).slice(0, 200)}`);
      }
      done++;
      if (done % 8 === 0 || done === jobs.length) {
        await setScan({ progress: 10 + Math.round((done / jobs.length) * 70) });
      }
    });

    // 3. Détection + classification des mentions
    await setScan({ status: "scoring", progress: 82 });
    const responses = unwrap(await db.from("responses").select("*").eq("scan_id", scanId)) as {
      id: string; engine: EngineId; text: string; citations: string[];
    }[];
    if (responses.length === 0) throw new Error("Aucune réponse obtenue des moteurs (clés API ?)");

    const classified = await classifyMentions(responses, allBrands, onUsage);
    const mentionRows = responses.flatMap((r, i) =>
      (classified[i] ?? []).map((m) => ({
        response_id: r.id,
        scan_id: scanId,
        brand: m.brand,
        mentioned: m.mentioned,
        position: m.position,
        sentiment: m.sentiment,
        is_recommended: m.is_recommended,
        method: m.method,
      }))
    );
    unwrap(await db.from("mentions").insert(mentionRows).select("id"));

    // 4. Scores + part de voix
    const targetMentions: MentionForScoring[] = responses.flatMap((r, i) =>
      (classified[i] ?? [])
        .filter((m) => m.brand === brand.name)
        .map((m) => ({ ...m, engine: r.engine }))
    );
    const scoreDetail = computeScoreDetail(targetMentions);
    const allMentionsFlat: MentionResult[] = classified.flat();
    const sov = computeShareOfVoice(brand.name, allMentionsFlat);

    // 5. 10 actions prioritaires
    await setScan({ progress: 92 });
    const responsesByQuery = new Map<string, MentionResult[]>();
    for (let i = 0; i < responses.length; i++) {
      const qid = (unwrapQueryId(responses[i]) ?? "") as string;
      const arr = responsesByQuery.get(qid) ?? [];
      arr.push(...(classified[i] ?? []).filter((m) => m.brand === brand.name));
      responsesByQuery.set(qid, arr);
    }
    const missedQueries = queryRows
      .filter((q) => (responsesByQuery.get(q.id) ?? []).every((m) => !m.mentioned))
      .map((q) => q.text);
    const competitorSources = [
      ...new Set(
        responses.flatMap((r, i) =>
          r.engine === "perplexity" &&
          (classified[i] ?? []).some((m) => m.brand !== brand.name && m.mentioned)
            ? r.citations ?? []
            : []
        )
      ),
    ];
    let actions: unknown = null;
    try {
      actions = await generatePriorityActions(
        { brand: brand.name, sector: scan.sector, score: scoreDetail.global.score, missedQueries, competitorSources },
        onUsage
      );
    } catch (e) {
      console.error(`[scan ${scanId}] génération des actions échouée: ${String(e).slice(0, 200)}`);
    }

    await setScan({
      status: "done",
      progress: 100,
      score: scoreDetail.global.score,
      score_detail: scoreDetail,
      share_of_voice: sov,
      actions,
      cost_cents: Math.round(totalCost * 100) / 100,
      report_token: randomUUID(),
      completed_at: new Date().toISOString(),
    });
  } catch (e) {
    await setScan({ status: "error", error: String(e).slice(0, 1000) });
    throw e;
  }
}

function unwrapQueryId(r: unknown): string | undefined {
  return (r as { query_id?: string }).query_id;
}

/** Crée un rescan : même marque, mêmes requêtes copiées, lien vers le scan initial. */
export async function createRescan(initialScanId: string, clientId?: string): Promise<string> {
  const db = getDb();
  const initial = unwrap(await db.from("scans").select("*").eq("id", initialScanId).single()) as Record<string, unknown>;
  const queries = unwrap(await db.from("queries").select("*").eq("scan_id", initialScanId).order("position")) as {
    text: string; category: string; position: number;
  }[];

  const rescan = unwrap(
    await db
      .from("scans")
      .insert({
        brand: initial.brand,
        url: initial.url,
        sector: initial.sector,
        competitors: initial.competitors,
        lang: initial.lang,
        previous_scan_id: initialScanId,
        client_id: clientId ?? initial.client_id ?? null,
      })
      .select("id")
      .single()
  ) as { id: string };

  unwrap(
    await db
      .from("queries")
      .insert(queries.map((q) => ({ scan_id: rescan.id, text: q.text, category: q.category, position: q.position })))
      .select("id")
  );
  return rescan.id;
}
