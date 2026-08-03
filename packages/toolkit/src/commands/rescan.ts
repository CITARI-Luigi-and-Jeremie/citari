import { getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient } from "../lib/context.js";
import { executerPilote } from "../lib/pilote.js";

/**
 * Re-scan J+90 : ouvre un scan rattaché au scan initial.
 *
 * Le scan lui-même est exécuté par le moteur du site, jamais réimplémenté ici.
 * C'est délibéré : l'intérêt du J+90 est l'écart avec le J0, et un écart n'a
 * de sens que si les deux mesures sortent de la MÊME implémentation du score.
 * Deux moteurs qui dérivent l'un de l'autre produiraient une progression (ou
 * une régression) purement artificielle, indéfendable devant un client.
 *
 * Pour la même raison, l'écart n'est calculé que si le scan de référence est
 * un diagnostic complet. Le re-scan interroge six moteurs ; un aperçu n'en
 * interroge que deux et sa note porte sur une base différente. Annoncer cet
 * écart-là au client reviendrait à lui vendre un artefact.
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
      .select("id, brand_name, website_url, sector, city, language, competitors, score_global, mode")
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
    mode: string | null;
  };

  if (initial.mode !== "complet") {
    throw new Error(
      `Le scan de référence de ${client.brand} est un scan « ${initial.mode ?? "?"} », pas un diagnostic complet.\n` +
        `Le re-scan interroge 6 moteurs, l'aperçu 2 : l'écart J+90 serait un artefact, pas une progression.\n` +
        `Rattachez le diagnostic complet au client avant de lancer le re-scan.`
    );
  }

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

  const depart = Math.round(Number(initial.score_global ?? 0));
  console.log(`\nRe-scan J+90 pour ${client.brand} — mêmes questions que le scan initial.`);
  console.log(`Score de départ : ${depart}/100`);
  console.log(`Collecte des 6 moteurs en cours, une dizaine de minutes…\n`);

  const [r] = await executerPilote({ scanIds: [created.id], parallele: 1 }, () => {});
  if (!r || r.erreur) throw new Error(`Collecte interrompue : ${r?.erreur ?? "scan non terminé"}`);

  const ecart = r.score - depart;
  const scanUrl = `${webUrl}/scan/${created.id}`;
  await recordDeliverable(client.id, "rescan_report", `Re-scan J+90 — ${client.brand}`, null, {
    rescanId: created.id,
    previousScanId: initial.id,
    scoreInitial: depart,
    scoreFinal: r.score,
    ecart,
    scanUrl,
  });

  console.log(`Score à J+90    : ${r.score}/100  (${ecart >= 0 ? "+" : ""}${ecart})`);
  console.log(`Cité ${r.cite} fois contre ${r.concurrents} pour ses concurrents · ${r.perdues} questions sans mention.`);
  console.log(`\n→ ${scanUrl}`);
}
