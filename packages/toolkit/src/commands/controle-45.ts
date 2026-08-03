import { getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient } from "../lib/context.js";
import { executerPilote } from "../lib/pilote.js";


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

  console.log(`\nContrôle J+45 pour ${client.brand} (interne, jamais montré au client).`);
  console.log(`Mêmes questions que le scan initial, moteurs : ChatGPT, Gemini, Claude, Perplexity.`);
  console.log(`Collecte en cours, quelques minutes…\n`);

  // La collecte est pilotée ici et non par un navigateur : ce contrôle est
  // interne, personne n'ouvre une page pour le déclencher. Le pilote appelle
  // exactement les mêmes fonctions que le site, donc la mesure reste unique.
  // Le point de départ n'est PAS le score global du scan initial : celui-ci
  // porte sur six moteurs, le contrôle sur quatre. On demande donc au moteur de
  // recalculer la référence sur ces quatre moteurs seulement. Sans cela,
  // l'écart mesurerait surtout un changement de méthode.
  const [r] = await executerPilote(
    { scanIds: [created.id], parallele: 1, referenceScanId: initial.id },
    () => {}
  );
  if (!r || r.erreur) throw new Error(`Collecte interrompue : ${r?.erreur ?? "scan non terminé"}`);

  const depart = r.scoreReference;

  await recordDeliverable(client.id, "controle_45", `Contrôle interne J+45`, null, {
    scanId: created.id,
    scoreControle: r.score,
    scoreDepart: depart,
    ecart: depart === null ? null : r.score - depart,
  });

  console.log(`Score à J+45 : ${r.score}/100`);
  console.log(`Cité ${r.cite} fois contre ${r.concurrents} pour ses concurrents · ${r.perdues} questions sans mention.\n`);

  if (depart === null) {
    console.log(`Aucun écart calculé : le scan de référence ne contient aucune réponse des moteurs du contrôle.`);
    return;
  }

  const ecart = r.score - depart;
  console.log(`Départ, recalculé sur les mêmes 4 moteurs : ${depart}/100 · écart ${ecart >= 0 ? "+" : ""}${ecart}\n`);
  console.log(
    ecart > 0
      ? `Ça bouge dans le bon sens. On garde le cap jusqu'au J+90.`
      : `Rien n'a bougé à mi-parcours. Réorientez l'effort vers les citations pendant qu'il reste du temps.`
  );
}
