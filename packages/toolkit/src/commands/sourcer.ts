import { writeDeliverableFile } from "../lib/context.js";
import {
  codesEffectif,
  enCsv,
  estHorsCible,
  extraireEntreprise,
  ligneScanLot,
  normaliserNaf,
  siegeDansZone,
  trier,
  type Entreprise,
} from "../lib/sirene.js";

/**
 * Construit une liste d'entreprises depuis l'annuaire officiel, prête pour
 * `scan-lot`.
 *
 * C'est l'étage « univers » de la prospection : exhaustif, officiel, gratuit.
 * La commande ne décide d'aucune stratégie — elle prend un métier (NAF), une
 * zone et une taille, et rend deux fichiers dans deliverables/prospection/ :
 *
 *   <nom>.txt   la liste « Nom, site » que scan-lot attend, sites à compléter
 *   <nom>.csv   la fiche de travail : SIREN, commune, effectif, dirigeants
 *
 * Ce qu'elle ne fait PAS, volontairement : trouver les sites web (l'annuaire
 * ne les connaît pas), inventer des emails, ou écrire en base. La liste se
 * relit à la main avant de dépenser le moindre centime de scan — c'est le
 * moment où l'œil humain écarte les homonymes et les cas bizarres.
 */

const API = "https://recherche-entreprises.api.gouv.fr/search";
/** L'API sert 25 résultats par page, et se réserve le droit de limiter le débit. */
const PAR_PAGE = 25;
const MAX_PAGES = 40;

type Options = {
  naf: string;
  dept?: string;
  cp?: string;
  effectif?: string;
  nom?: string;
  etablissements?: boolean;
  max?: number;
};

export async function sourcer(opts: Options): Promise<void> {
  const nafs = opts.naf.split(",").map(normaliserNaf);
  const departements = (opts.dept ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const codesPostaux = (opts.cp ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!departements.length && !codesPostaux.length) {
    throw new Error("Précisez une zone : --dept 69 et/ou --cp 69001,69002.");
  }
  const tranches = codesEffectif(opts.effectif ?? "10-249");
  const plafond = Math.max(1, Math.min(1000, opts.max ?? 500));

  const params = new URLSearchParams({
    activite_principale: nafs.join(","),
    tranche_effectif_salarie: tranches.join(","),
    etat_administratif: "A",
    per_page: String(PAR_PAGE),
  });
  if (departements.length) params.set("departement", departements.join(","));
  if (codesPostaux.length) params.set("code_postal", codesPostaux.join(","));

  console.log(`Annuaire officiel · NAF ${nafs.join(", ")} · effectif ${opts.effectif ?? "10-249"} · zone ${[...departements, ...codesPostaux].join(", ")}\n`);

  const vues = new Set<string>();
  const retenues: Entreprise[] = [];
  let horsZone = 0;
  let horsCible = 0;
  let totalApi = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    params.set("page", String(page));
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error(`API gouv [${res.status}] ${(await res.text()).slice(0, 150)}`);
    const json = (await res.json()) as { total_results?: number; results?: unknown[] };
    totalApi = json.total_results ?? 0;

    for (const brut of json.results ?? []) {
      const e = extraireEntreprise(brut as Parameters<typeof extraireEntreprise>[0]);
      if (!e || vues.has(e.siren)) continue;
      vues.add(e.siren);
      // Le filtre géographique de l'API matche les ÉTABLISSEMENTS : une
      // recherche « Rhône » renvoie des sièges parisiens qui y ont une
      // antenne. Par défaut on garde les sièges de la zone, ceux dont le
      // dirigeant est joignable localement ; --etablissements désactive.
      if (!opts.etablissements && !siegeDansZone(e, { departements, codesPostaux })) {
        horsZone++;
        continue;
      }
      if (estHorsCible(e)) {
        horsCible++;
        continue;
      }
      retenues.push(e);
    }

    if (page * PAR_PAGE >= totalApi || retenues.length >= plafond) break;
    await new Promise((r) => setTimeout(r, 250));
  }

  if (totalApi > MAX_PAGES * PAR_PAGE) {
    console.log(`⚠ ${totalApi} résultats côté API, seuls les ${MAX_PAGES * PAR_PAGE} premiers ont été lus. Resserrez la zone ou l'effectif.\n`);
  }

  const finales = trier(retenues.slice(0, plafond));
  if (!finales.length) {
    console.log("Aucune entreprise retenue. Élargissez l'effectif ou la zone.");
    return;
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const slug = opts.nom ?? `${nafs[0]!.replace(/\./g, "").toLowerCase()}-${(departements[0] ?? codesPostaux[0] ?? "zone")}-${date}`;
  const txt = writeDeliverableFile("prospection", `${slug}.txt`, finales.map(ligneScanLot).join("\n") + "\n");
  const csv = writeDeliverableFile("prospection", `${slug}.csv`, enCsv(finales));

  const parEffectif = new Map<string, number>();
  for (const e of finales) parEffectif.set(e.effectif, (parEffectif.get(e.effectif) ?? 0) + 1);

  console.log(`${totalApi} entreprises côté API · ${horsZone} sièges hors zone écartés · ${horsCible} de droit public écartées`);
  console.log(`→ ${finales.length} retenues\n`);
  for (const [effectif, n] of [...parEffectif.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${effectif}`);
  }
  console.log(`\nFichiers :\n  ${txt}\n  ${csv}\n`);
  console.log(`La suite, dans l'ordre :`);
  console.log(`  1. Compléter la colonne site_web du CSV (et reporter dans le .txt), relire les noms.`);
  console.log(`  2. pnpm toolkit scan-lot ${txt} --secteur "…" --ville "…"   (~${(finales.length * 0.14).toFixed(2)} € en aperçu)`);
}
