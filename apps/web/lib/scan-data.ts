import { getDb, unwrap, type EngineId, type ScanScoreDetail, type ShareOfVoice, type PriorityAction } from "@geo/core";

export interface ScanRow {
  id: string;
  brand: string;
  url: string;
  sector: string;
  competitors: { name: string; url?: string }[];
  lang: string;
  status: string;
  progress: number;
  error: string | null;
  score: number | null;
  score_detail: ScanScoreDetail | null;
  share_of_voice: ShareOfVoice | null;
  actions: PriorityAction[] | null;
  email: string | null;
  report_token: string | null;
  previous_scan_id: string | null;
  cost_cents: number;
  created_at: string;
  completed_at: string | null;
}

export interface MentionRow {
  response_id: string;
  brand: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  is_recommended: boolean;
}

export interface ResponseRow {
  id: string;
  query_id: string;
  engine: EngineId;
  text: string;
  citations: string[];
}

export interface QueryRow {
  id: string;
  text: string;
  category: string;
  position: number;
}

export async function getScan(id: string): Promise<ScanRow | null> {
  const { data } = await getDb().from("scans").select("*").eq("id", id).maybeSingle();
  return (data as ScanRow) ?? null;
}

export interface Verbatim {
  query: string;
  engine: EngineId;
  excerpt: string;
  brands: string[]; // marques mentionnées, pour surlignage
  competitorOnly: boolean;
}

/** Un verbatim où un concurrent est cité et pas la marque — l'électrochoc du teaser. */
export async function findVerbatims(scan: ScanRow, limit: number): Promise<Verbatim[]> {
  const db = getDb();
  const responses = unwrap(await db.from("responses").select("id,query_id,engine,text,citations").eq("scan_id", scan.id)) as ResponseRow[];
  const mentions = unwrap(await db.from("mentions").select("response_id,brand,mentioned,position,sentiment,is_recommended").eq("scan_id", scan.id)) as MentionRow[];
  const queries = unwrap(await db.from("queries").select("id,text,category,position").eq("scan_id", scan.id)) as QueryRow[];
  const queryText = new Map(queries.map((q) => [q.id, q.text]));

  const byResponse = new Map<string, MentionRow[]>();
  for (const m of mentions) {
    const arr = byResponse.get(m.response_id) ?? [];
    arr.push(m);
    byResponse.set(m.response_id, arr);
  }

  const scored = responses
    .map((r) => {
      const ms = byResponse.get(r.id) ?? [];
      const brandMentioned = ms.some((m) => m.brand === scan.brand && m.mentioned);
      const competitorsMentioned = ms.filter((m) => m.brand !== scan.brand && m.mentioned).map((m) => m.brand);
      return { r, brandMentioned, competitorsMentioned };
    })
    .filter((x) => x.competitorsMentioned.length > 0)
    // priorité aux réponses où le concurrent est cité et PAS la marque
    .sort((a, b) => Number(a.brandMentioned) - Number(b.brandMentioned));

  return scored.slice(0, limit).map(({ r, brandMentioned, competitorsMentioned }) => ({
    query: queryText.get(r.query_id) ?? "",
    engine: r.engine,
    excerpt: r.text.length > 600 ? r.text.slice(0, 600) + "…" : r.text,
    brands: brandMentioned ? [scan.brand, ...competitorsMentioned] : competitorsMentioned,
    competitorOnly: !brandMentioned,
  }));
}

export interface QueryTableRow {
  query: string;
  category: string;
  engines: Partial<Record<EngineId, string[]>>; // marques citées, dans l'ordre
}

export interface ReportData {
  scan: ScanRow;
  queryTable: QueryTableRow[];
  verbatims: Verbatim[];
  perplexitySources: { url: string; competitors: string[]; count: number }[];
  previous: ScanRow | null;
}

export async function getReportData(scan: ScanRow): Promise<ReportData> {
  const db = getDb();
  const responses = unwrap(await db.from("responses").select("id,query_id,engine,text,citations").eq("scan_id", scan.id)) as ResponseRow[];
  const mentions = unwrap(await db.from("mentions").select("response_id,brand,mentioned,position,sentiment,is_recommended").eq("scan_id", scan.id)) as MentionRow[];
  const queries = unwrap(await db.from("queries").select("id,text,category,position").eq("scan_id", scan.id).order("position")) as QueryRow[];

  const byResponse = new Map<string, MentionRow[]>();
  for (const m of mentions) {
    const arr = byResponse.get(m.response_id) ?? [];
    arr.push(m);
    byResponse.set(m.response_id, arr);
  }

  // Tableau requête par requête : qui est cité, dans quel ordre, par moteur
  const queryTable: QueryTableRow[] = queries.map((q) => {
    const engines: QueryTableRow["engines"] = {};
    for (const r of responses.filter((r) => r.query_id === q.id)) {
      engines[r.engine] = (byResponse.get(r.id) ?? [])
        .filter((m) => m.mentioned)
        .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
        .map((m) => m.brand);
    }
    return { query: q.text, category: q.category, engines };
  });

  // Sources Perplexity citées quand un concurrent apparaît — l'argument n°1
  const sourceMap = new Map<string, { competitors: Set<string>; count: number }>();
  for (const r of responses.filter((r) => r.engine === "perplexity")) {
    const comps = (byResponse.get(r.id) ?? []).filter((m) => m.brand !== scan.brand && m.mentioned).map((m) => m.brand);
    if (comps.length === 0) continue;
    for (const url of r.citations ?? []) {
      const entry = sourceMap.get(url) ?? { competitors: new Set(), count: 0 };
      comps.forEach((c) => entry.competitors.add(c));
      entry.count++;
      sourceMap.set(url, entry);
    }
  }
  const perplexitySources = [...sourceMap.entries()]
    .map(([url, v]) => ({ url, competitors: [...v.competitors], count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const verbatims = await findVerbatims(scan, 5);
  const previous = scan.previous_scan_id ? await getScan(scan.previous_scan_id) : null;

  return { scan, queryTable, verbatims, perplexitySources, previous };
}
