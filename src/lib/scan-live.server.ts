import { publicClient } from "./supabase-public.server";
import type { ScanRecord } from "./scan-result";

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

  return {
    scan: scanRes.data as unknown as ScanRecord,
    queries: (queriesRes.data ?? []) as QueryRow[],
    meta: (metaRes.data ?? []) as MetaRow[],
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
