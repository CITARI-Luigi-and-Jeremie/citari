import { getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient } from "../lib/context.js";

/**
 * Contrôle interne J+45 : mi-parcours du délai d'intégration des moteurs.
 *
 * Ouvre un scan en mode « controle » : mêmes questions que le scan initial,
 * mais uniquement les quatre moteurs qui lisent le web au moment de répondre
 * (ChatGPT, Gemini, Claude, Perplexity) : les seuls susceptibles d'avoir déjà
 * bougé à mi-parcours. Coût ~0,84 €, déduit du premier scan réel.
 *
 * ⚠ Jamais montré au client comme un score. C'est de la télémétrie : si rien
 * ne bouge à J+45, on réoriente l'effort citations avant qu'il ne soit trop
 * tard pour le J+90.
 */
export async function controle45(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  if (!client.initialScanId) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);
  const db = getDb();

  const initial = unwrap(
    await db
      .from("scans")
      .select("id, brand_name, website_url, sector, city, language, competitors")
      .eq("id", client.initialScanId)
      .single()
  ) as Record<string, unknown> & { id: string; brand_name: string };

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
        mode: "controle",
        status: "running",
        phase: "init",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single()
  ) as { id: string };

  const webUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const scanUrl = `${webUrl}/scan/${created.id}`;
  await recordDeliverable(client.id, "controle_45", `Contrôle interne J+45`, null, {
    scanId: created.id,
    scanUrl,
  });

  console.log(`\nContrôle J+45 ouvert pour ${client.brand} (interne, jamais montré au client).`);
  console.log(`Mêmes questions que le scan initial, moteurs : ChatGPT, Gemini, Claude, Perplexity.`);
  console.log(`Ouvrez cette page pour lancer la collecte :`);
  console.log(`→ ${scanUrl}`);
}
