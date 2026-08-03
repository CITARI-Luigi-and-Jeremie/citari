import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { selectVerbatims, type ResponseRow, type Verbatim } from "./scan-result";

/**
 * Le texte des réponses n'est lisible qu'ici, côté serveur, avec la clé de service.
 * Aucun accès anonyme n'existe sur les tables responses / mentions.
 */
async function loadRows(scanId: string): Promise<{ brand: string; rows: ResponseRow[] }> {
  const { data: scan, error: scanError } = await supabaseAdmin
    .from("scans")
    .select("brand")
    .eq("id", scanId)
    .maybeSingle();
  if (scanError) throw new Error(scanError.message);
  if (!scan) return { brand: "", rows: [] };

  const { data, error } = await supabaseAdmin
    .from("responses")
    .select("engine, text, created_at, mentions(brand, is_recommended)")
    .eq("scan_id", scanId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return { brand: scan.brand, rows: (data ?? []) as unknown as ResponseRow[] };
}

export async function buildVerbatims(scanId: string): Promise<Verbatim[]> {
  const { brand, rows } = await loadRows(scanId);
  return selectVerbatims(brand, rows);
}

/** Nombre de verbatims compromettants — pas leur contenu. */
export async function countVerbatims(scanId: string): Promise<number> {
  const { brand, rows } = await loadRows(scanId);
  return selectVerbatims(brand, rows, Number.MAX_SAFE_INTEGER).length;
}
