import { publicClient } from "./supabase-public.server";
import type { ScanRecord } from "./scan-result";
import { deriveEngines } from "./scan-loading";

export type QueryRow = { id: string; position: number; text: string };
export type MetaRow = {
  query_id: string;
  engine: string;
  latency_ms: number | null;
  created_at: string;
};

export type ScanLive = {
  scan: ScanRecord;
  queries: QueryRow[];
  meta: MetaRow[];
  /** Moteurs réellement interrogés pour ce scan. */
  engines: string[];
  /** Moteurs absents du mode courant, affichés verrouillés. */
  locked: string[];
  /** Réponses attendues (questions × moteurs actifs). */
  total: number;
  /** Réponses déjà collectées. */
  collectees: number;
  /** Progression 0 → 1, ancrée sur les données. */
  progression: number;
};

/**
 * État serveur complet de l'écran de chargement.
 * Ne renvoie JAMAIS le texte des réponses : uniquement les métadonnées.
 */
export async function readScanLive(id: string): Promise<ScanLive | null> {
  const supabase = publicClient();

  const [scanRes, queriesRes, metaRes] = await Promise.all([
    supabase
      .from("scans_public")
      .select(
        "id, brand, domain, status, progress, started_at, score, score_detail, share_of_voice",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("queries").select("id, position, text").eq("scan_id", id).order("position"),
    supabase
      .from("responses_meta")
      .select("query_id, engine, latency_ms, created_at")
      .eq("scan_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (scanRes.error) throw new Error(scanRes.error.message);
  if (!scanRes.data) return null;
  if (queriesRes.error) throw new Error(queriesRes.error.message);
  if (metaRes.error) throw new Error(metaRes.error.message);

  const scan = scanRes.data as unknown as ScanRecord;
  const queries = (queriesRes.data ?? []) as QueryRow[];
  const meta = (metaRes.data ?? []) as MetaRow[];
  const { engines, locked } = deriveEngines(meta.map((row) => row.engine));

  const total = queries.length * engines.length;
  const collectees = meta.length;

  return {
    scan,
    queries,
    meta,
    engines,
    locked,
    total,
    collectees,
    progression: total > 0 ? Math.min(1, collectees / total) : 0,
  };
}


export async function insertScanLead(scanId: string, email: string) {
  const supabase = publicClient();
  const { error } = await supabase
    .from("scan_leads")
    .insert({ scan_id: scanId, email: email.toLowerCase() });
  if (error) throw new Error(error.message);
}

export async function insertScan(input: {
  domain: string;
  brand: string;
  sector: string;
  competitors: string[];
}) {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("scans")
    .insert({ ...input, status: "generating_queries" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}
