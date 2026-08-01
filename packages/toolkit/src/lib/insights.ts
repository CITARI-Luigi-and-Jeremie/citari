import { getDb, unwrap } from "@geo/core";

/**
 * Transforme un scan en munitions commerciales : les faits précis qui rendent
 * une relance ou une proposition crédibles. Tout est extrait de la base —
 * aucun chiffre n'est inventé, ce qui est impératif dans un email de prospection.
 *
 * Le schéma est celui du front Citari. Deux pièges qu'il faut garder en tête :
 *
 *  1. `responses.engine` et `mentions.engine` stockent les LIBELLÉS des moteurs
 *     (« ChatGPT », « Claude »…), pas des identifiants techniques.
 *  2. Une ligne de `mentions` EST une mention. Il n'existe pas de colonne
 *     `mentioned` : l'absence de ligne vaut absence de citation. La marque
 *     suivie s'identifie par `is_target`, jamais par comparaison de chaînes.
 */

/** Libellés tels que stockés en base, et colonne de score correspondante. */
const ENGINE_SCORE_COLUMN = {
  ChatGPT: "score_chatgpt",
  Claude: "score_claude",
  Gemini: "score_gemini",
  Perplexity: "score_perplexity",
  Grok: "score_grok",
  // « Le Chat » et non « Mistral » : on nomme l'assistant que le public
  // utilise, comme pour les autres moteurs. La colonne garde le nom de
  // l'éditeur, plus stable qu'un nom de produit.
  "Le Chat": "score_mistral",
} as const;

type EngineLabel = keyof typeof ENGINE_SCORE_COLUMN;

export interface EngineScore {
  engine: EngineLabel;
  label: EngineLabel;
  score: number;
}

export interface ScanInsights {
  brand: string;
  url: string | null;
  sector: string | null;
  score: number;
  scoreLabel: string;
  reportUrl: string | null;
  competitors: string[];
  /** Concurrent le plus cité, et sa part de voix. */
  topCompetitor: { name: string; share: number } | null;
  brandShare: number;
  /** Moteur où la marque est la plus faible (angle d'attaque). */
  weakestEngine: EngineScore | null;
  bestEngine: EngineScore | null;
  /** Requêtes d'achat où la marque est totalement absente. */
  missedQueries: string[];
  missedCount: number;
  totalQueries: number;
  /** Domaines cités par Perplexity dans les réponses où un concurrent apparaît. */
  competitorSources: string[];
  /**
   * Vrai quand aucune réponse ne porte de sources exploitables. Le chantier
   * « citations » doit alors s'appuyer sur l'annuaire sectoriel plutôt que sur
   * les sources observées — et la proposition ne doit pas promettre le contraire.
   */
  sourcesUnavailable: boolean;
  /** Verbatim où un concurrent est cité et pas la marque. */
  killerQuote: { query: string; engine: string; excerpt: string; competitor: string } | null;
}

type ScanDb = {
  brand_name: string;
  website_url: string | null;
  sector: string | null;
  score_global: number | null;
  report_token: string | null;
  competitors: unknown;
  share_of_voice: unknown;
} & Partial<Record<(typeof ENGINE_SCORE_COLUMN)[EngineLabel], number | null>>;

type PdvItem = { name: string; count: number; share: number; target: boolean };

function scoreLabel(score: number): string {
  if (score < 20) return "quasi invisible";
  if (score < 40) return "très peu visible";
  if (score < 60) return "visibilité partielle";
  if (score < 80) return "bien positionnée";
  return "très bien positionnée";
}

function readSourceUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => (typeof s === "string" ? s : ((s as { url?: string })?.url ?? "")))
    .filter((u): u is string => Boolean(u));
}

export async function buildScanInsights(scanId: string): Promise<ScanInsights> {
  const db = getDb();
  const scan = unwrap(await db.from("scans").select("*").eq("id", scanId).single()) as ScanDb;
  const queries = unwrap(
    await db.from("queries").select("id,text,intent").eq("scan_id", scanId).order("rank")
  ) as { id: string; text: string; intent: string | null }[];
  const responses = unwrap(
    await db.from("responses").select("id,query_id,engine,raw_text,sources").eq("scan_id", scanId)
  ) as { id: string; query_id: string; engine: string; raw_text: string | null; sources: unknown }[];
  const mentions = unwrap(
    await db.from("mentions").select("response_id,brand,is_target,position").eq("scan_id", scanId)
  ) as { response_id: string; brand: string; is_target: boolean; position: number | null }[];

  const brand = scan.brand_name;

  const competitors = Array.isArray(scan.competitors)
    ? (scan.competitors as unknown[])
        .map((c) => (typeof c === "string" ? c : ((c as { name?: string })?.name ?? "")))
        .filter((n): n is string => Boolean(n))
    : [];

  const byResponse = new Map<string, typeof mentions>();
  for (const m of mentions) {
    const arr = byResponse.get(m.response_id) ?? [];
    arr.push(m);
    byResponse.set(m.response_id, arr);
  }
  const targetCited = (responseId: string) => (byResponse.get(responseId) ?? []).some((m) => m.is_target);

  // Requêtes où la marque n'apparaît dans aucune réponse, tous moteurs confondus.
  // `some` et non `every` : une requête sans aucune réponse collectée n'est pas
  // une requête manquée, elle n'a simplement pas été mesurée.
  const missed = queries.filter((q) => {
    const rs = responses.filter((r) => r.query_id === q.id);
    return rs.length > 0 && !rs.some((r) => targetCited(r.id));
  });

  // `share_of_voice` est un tableau [{name, count, share, target}], pas un dictionnaire.
  const pdv: PdvItem[] = Array.isArray(scan.share_of_voice) ? (scan.share_of_voice as PdvItem[]) : [];
  const competitorShares = pdv.filter((p) => !p.target).sort((a, b) => b.share - a.share);
  const topCompetitor = competitorShares[0]
    ? { name: competitorShares[0].name, share: competitorShares[0].share }
    : null;
  const brandShare = pdv.find((p) => p.target)?.share ?? 0;

  // Un moteur ne compte que s'il a réellement produit un score.
  const engineScores: EngineScore[] = (Object.keys(ENGINE_SCORE_COLUMN) as EngineLabel[])
    .map((label) => ({ engine: label, label, score: Number(scan[ENGINE_SCORE_COLUMN[label]] ?? NaN) }))
    .filter((e) => Number.isFinite(e.score));
  const sorted = [...engineScores].sort((a, b) => a.score - b.score);

  // Domaines cités par Perplexity quand un concurrent apparaît et pas la marque.
  const sources = new Set<string>();
  let anySources = false;
  for (const r of responses) {
    const urls = readSourceUrls(r.sources);
    if (urls.length) anySources = true;
    if (r.engine !== "Perplexity") continue;
    const ms = byResponse.get(r.id) ?? [];
    if (!ms.some((m) => !m.is_target)) continue;
    for (const url of urls) {
      try {
        sources.add(new URL(url).hostname.replace(/^www\./, ""));
      } catch {
        /* URL invalide : on ignore plutôt que de faire échouer la relance */
      }
    }
  }

  // Le verbatim qui fait mal : concurrent cité en tête, marque absente.
  let killerQuote: ScanInsights["killerQuote"] = null;
  for (const r of responses) {
    if (!r.raw_text) continue;
    const ms = byResponse.get(r.id) ?? [];
    if (targetCited(r.id)) continue;
    const firstCompetitor = ms
      .filter((m) => !m.is_target)
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0];
    if (!firstCompetitor) continue;
    const q = queries.find((x) => x.id === r.query_id);
    killerQuote = {
      query: q?.text ?? "",
      engine: r.engine,
      excerpt: r.raw_text.length > 400 ? r.raw_text.slice(0, 400) + "…" : r.raw_text,
      competitor: firstCompetitor.brand,
    };
    break;
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const score = Math.round(Number(scan.score_global ?? 0));
  return {
    brand,
    url: scan.website_url,
    sector: scan.sector,
    score,
    scoreLabel: scoreLabel(score),
    reportUrl: scan.report_token ? `${base}/rapport/${scan.report_token}` : null,
    competitors,
    topCompetitor,
    brandShare,
    weakestEngine: sorted[0] ?? null,
    bestEngine: sorted[sorted.length - 1] ?? null,
    missedQueries: missed.map((q) => q.text),
    missedCount: missed.length,
    totalQueries: queries.length,
    competitorSources: [...sources],
    sourcesUnavailable: !anySources,
    killerQuote,
  };
}

export const pct = (v: number) => `${Math.round(v * 100)} %`;
