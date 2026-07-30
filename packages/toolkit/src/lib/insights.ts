import { getDb, unwrap, ENGINE_LABELS, type EngineId } from "@geo/core";

/**
 * Transforme un scan en munitions commerciales : les faits précis qui rendent
 * une relance ou une proposition crédibles. Tout est extrait de la base —
 * aucun chiffre n'est inventé, ce qui est impératif dans un email de prospection.
 */
export interface ScanInsights {
  brand: string;
  url: string;
  sector: string;
  score: number;
  scoreLabel: string;
  reportUrl: string | null;
  competitors: string[];
  /** Concurrent le plus cité, et son écart avec la marque. */
  topCompetitor: { name: string; share: number } | null;
  brandShare: number;
  /** Moteur où la marque est la plus faible (angle d'attaque). */
  weakestEngine: { engine: EngineId; label: string; score: number } | null;
  bestEngine: { engine: EngineId; label: string; score: number } | null;
  /** Requêtes d'achat où la marque est totalement absente. */
  missedQueries: string[];
  missedCount: number;
  totalQueries: number;
  /** Sources citées par Perplexity pour les concurrents. */
  competitorSources: string[];
  /** Verbatim où un concurrent est cité et pas la marque. */
  killerQuote: { query: string; engine: string; excerpt: string; competitor: string } | null;
}

function scoreLabel(score: number): string {
  if (score < 20) return "quasi invisible";
  if (score < 40) return "très peu visible";
  if (score < 60) return "visibilité partielle";
  if (score < 80) return "bien positionnée";
  return "très bien positionnée";
}

export async function buildScanInsights(scanId: string): Promise<ScanInsights> {
  const db = getDb();
  const scan = unwrap(await db.from("scans").select("*").eq("id", scanId).single()) as any;
  const queries = unwrap(await db.from("queries").select("id,text,category").eq("scan_id", scanId)) as any[];
  const responses = unwrap(await db.from("responses").select("id,query_id,engine,text,citations").eq("scan_id", scanId)) as any[];
  const mentions = unwrap(
    await db.from("mentions").select("response_id,brand,mentioned,position").eq("scan_id", scanId)
  ) as any[];

  const brand: string = scan.brand;
  const competitors: string[] = (scan.competitors ?? []).map((c: any) => c.name);

  const byResponse = new Map<string, any[]>();
  for (const m of mentions) {
    const arr = byResponse.get(m.response_id) ?? [];
    arr.push(m);
    byResponse.set(m.response_id, arr);
  }

  // Requêtes où la marque n'apparaît dans aucune des 4 réponses
  const missed = queries.filter((q) =>
    responses
      .filter((r) => r.query_id === q.id)
      .every((r) => !(byResponse.get(r.id) ?? []).some((m) => m.brand === brand && m.mentioned))
  );

  const share: Record<string, number> = scan.share_of_voice?.share ?? {};
  const competitorShares = Object.entries(share)
    .filter(([b]) => b !== brand)
    .sort((a, b) => (b[1] as number) - (a[1] as number));
  const topCompetitor = competitorShares[0]
    ? { name: competitorShares[0][0], share: competitorShares[0][1] as number }
    : null;

  const engineScores = Object.entries(scan.score_detail?.byEngine ?? {}).map(([engine, s]: [string, any]) => ({
    engine: engine as EngineId,
    label: ENGINE_LABELS[engine as EngineId] ?? engine,
    score: s.score as number,
  }));
  const sorted = [...engineScores].sort((a, b) => a.score - b.score);

  // Sources Perplexity présentes quand un concurrent est cité
  const sources = new Set<string>();
  for (const r of responses.filter((r) => r.engine === "perplexity")) {
    const hasCompetitor = (byResponse.get(r.id) ?? []).some((m) => m.brand !== brand && m.mentioned);
    if (!hasCompetitor) continue;
    for (const url of r.citations ?? []) {
      try {
        sources.add(new URL(url).hostname.replace(/^www\./, ""));
      } catch { /* URL invalide */ }
    }
  }

  // Le verbatim qui fait mal : concurrent recommandé, marque absente
  let killerQuote: ScanInsights["killerQuote"] = null;
  for (const r of responses) {
    const ms = byResponse.get(r.id) ?? [];
    const brandCited = ms.some((m) => m.brand === brand && m.mentioned);
    const firstCompetitor = ms
      .filter((m) => m.brand !== brand && m.mentioned)
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0];
    if (!brandCited && firstCompetitor) {
      const q = queries.find((x) => x.id === r.query_id);
      killerQuote = {
        query: q?.text ?? "",
        engine: ENGINE_LABELS[r.engine as EngineId] ?? r.engine,
        excerpt: r.text.length > 400 ? r.text.slice(0, 400) + "…" : r.text,
        competitor: firstCompetitor.brand,
      };
      break;
    }
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    brand,
    url: scan.url,
    sector: scan.sector,
    score: scan.score ?? 0,
    scoreLabel: scoreLabel(scan.score ?? 0),
    reportUrl: scan.report_token ? `${base}/rapport/${scan.report_token}` : null,
    competitors,
    topCompetitor,
    brandShare: share[brand] ?? 0,
    weakestEngine: sorted[0] ?? null,
    bestEngine: sorted[sorted.length - 1] ?? null,
    missedQueries: missed.map((q) => q.text),
    missedCount: missed.length,
    totalQueries: queries.length,
    competitorSources: [...sources],
    killerQuote,
  };
}

export const pct = (v: number) => `${Math.round(v * 100)} %`;
