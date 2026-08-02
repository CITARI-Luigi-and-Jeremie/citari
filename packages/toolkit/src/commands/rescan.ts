import { getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient } from "../lib/context.js";

/**
 * Re-scan J+90 : ouvre un scan rattaché au scan initial.
 *
 * Le scan lui-même est exécuté par le moteur du front Citari, jamais ici.
 * C'est délibéré : l'intérêt du J+90 est l'écart avec le J0, et un écart n'a
 * de sens que si les deux mesures sortent de la MÊME implémentation du score.
 * Deux moteurs qui dérivent l'un de l'autre produiraient une progression (ou
 * une régression) purement artificielle, indéfendable devant un client.
 *
 * `previous_scan_id` déclenche côté front la recopie à l'identique des
 * questions du scan initial — l'échantillon reste gelé, comme promis.
 */
export async function rescan(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  if (!client.initialScanId) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);

  const db = getDb();
  const initial = unwrap(
    await db
      .from("scans")
      .select("id, brand_name, website_url, sector, city, language, competitors, score_global")
      .eq("id", client.initialScanId)
      .single()
  ) as {
    id: string;
    brand_name: string;
    website_url: string | null;
    sector: string | null;
    city: string | null;
    language: string | null;
    competitors: unknown;
    score_global: number | null;
  };

  const webUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Un re-scan par scan initial : relancer la commande ne doit pas facturer
  // une seconde collecte ni créer deux points de comparaison concurrents.
  const existing = unwrap(
    await db.from("scans").select("id, status, report_token").eq("previous_scan_id", initial.id).neq("mode", "controle").limit(1)
  ) as { id: string; status: string; report_token: string | null }[];

  if (existing[0]) {
    const e = existing[0];
    console.log(`Un re-scan existe déjà pour ${client.brand} (statut : ${e.status}).`);
    console.log(`→ ${webUrl}/scan/${e.id}`);
    if (e.report_token) console.log(`→ rapport : ${webUrl}/rapport/${e.report_token}`);
    return;
  }

  const created = unwrap(
    await db
      .from("scans")
      .insert({
        brand_name: initial.brand_name,
        website_url: initial.website_url,
        sector: initial.sector,
        city: initial.city,
        language: initial.language ?? "fr",
        competitors: initial.competitors ?? [],
        previous_scan_id: initial.id,
        mode: "complet",
        status: "running",
        phase: "init",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single()
  ) as { id: string };

  const scanUrl = `${webUrl}/scan/${created.id}`;
  await recordDeliverable(client.id, "rescan_report", `Re-scan J+90 — ${client.brand}`, null, {
    rescanId: created.id,
    previousScanId: initial.id,
    scoreInitial: initial.score_global,
    scanUrl,
  });

  console.log(`\nRe-scan ouvert pour ${client.brand} — mêmes questions que le scan initial.`);
  console.log(`Score de départ : ${Math.round(Number(initial.score_global ?? 0))}/100`);
  console.log(`\nOuvrez cette page pour lancer la collecte (elle pilote le moteur jusqu'au bout) :`);
  console.log(`→ ${scanUrl}`);
}
