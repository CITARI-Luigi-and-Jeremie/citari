/**
 * Lecture de l'annuaire officiel des entreprises françaises.
 *
 * Source : l'API Recherche d'entreprises (recherche-entreprises.api.gouv.fr),
 * données INSEE et RNE. Gratuite, sans clé, sans compte, et exhaustive par
 * construction : toute entreprise française y figure, ce qu'aucune base
 * commerciale ne peut promettre. C'est l'étage « univers » de la prospection ;
 * les étages suivants (sites web, contacts) viennent d'ailleurs.
 *
 * Ce module ne contient QUE des fonctions pures : le tri, les filtres et les
 * formats de sortie se testent sans réseau. L'appel HTTP vit dans la commande.
 *
 * Deux pièges de l'API, appris en la sondant :
 *
 *  1. Les filtres géographiques (`departement`, `code_postal`) matchent les
 *     entreprises ayant UN ÉTABLISSEMENT dans la zone, pas leur siège. Une
 *     recherche « Rhône » renvoie des sièges à Montluçon ou Paris. Le filtre
 *     par siège se fait donc ici, côté client.
 *  2. `tranche_effectif_salarie` existe au niveau entreprise ET au niveau
 *     siège, et les deux divergent (le siège d'un groupe peut être « NN »).
 *     On lit toujours celle de l'entreprise.
 */

/** Tranches d'effectif salarié INSEE : code → bornes et libellé. */
export const TRANCHES_EFFECTIF: Record<string, { min: number; max: number | null; libelle: string }> = {
  "00": { min: 0, max: 0, libelle: "0 salarié" },
  "01": { min: 1, max: 2, libelle: "1 ou 2" },
  "02": { min: 3, max: 5, libelle: "3 à 5" },
  "03": { min: 6, max: 9, libelle: "6 à 9" },
  "11": { min: 10, max: 19, libelle: "10 à 19" },
  "12": { min: 20, max: 49, libelle: "20 à 49" },
  "21": { min: 50, max: 99, libelle: "50 à 99" },
  "22": { min: 100, max: 199, libelle: "100 à 199" },
  "31": { min: 200, max: 249, libelle: "200 à 249" },
  "32": { min: 250, max: 499, libelle: "250 à 499" },
  "41": { min: 500, max: 999, libelle: "500 à 999" },
  "42": { min: 1000, max: 1999, libelle: "1 000 à 1 999" },
  "51": { min: 2000, max: 4999, libelle: "2 000 à 4 999" },
  "52": { min: 5000, max: 9999, libelle: "5 000 à 9 999" },
  "53": { min: 10000, max: null, libelle: "10 000 et plus" },
};

/**
 * Traduit une plage lisible (« 10-249 ») en codes de tranche INSEE.
 *
 * Une tranche est retenue si elle CHEVAUCHE la plage demandée : demander
 * 10-100 retient « 50 à 99 » et « 100 à 199 », parce qu'exclure la seconde
 * écarterait des entreprises de 100 salariés que la demande couvre. Le tri
 * fin, s'il importe, se fait à la lecture du CSV.
 */
export function codesEffectif(plage: string): string[] {
  const m = plage.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) throw new Error(`Plage d'effectif illisible : « ${plage} ». Format attendu : 10-249.`);
  const min = Number(m[1]);
  const max = Number(m[2]);
  if (min > max) throw new Error(`Plage d'effectif inversée : ${min} > ${max}.`);
  const codes = Object.entries(TRANCHES_EFFECTIF)
    .filter(([, t]) => t.min <= max && (t.max === null || t.max >= min))
    .map(([code]) => code);
  if (codes.length === 0) throw new Error(`Aucune tranche INSEE ne couvre ${plage}.`);
  return codes;
}

/** Normalise un code NAF : « 6920Z » et « 69.20Z » désignent la même activité. */
export function normaliserNaf(code: string): string {
  const brut = code.trim().toUpperCase().replace(/\./g, "");
  const m = brut.match(/^(\d{2})(\d{2})([A-Z])$/);
  if (!m) throw new Error(`Code NAF illisible : « ${code} ». Format attendu : 69.20Z ou 6920Z.`);
  return `${m[1]}.${m[2]}${m[3]}`;
}

export interface Entreprise {
  siren: string;
  nom: string;
  commune: string;
  codePostal: string;
  departement: string;
  /** Libellé de la tranche d'effectif (« 20 à 49 »), jamais le code brut. */
  effectif: string;
  /** PME, ETI ou GE, posé par l'INSEE. */
  categorie: string | null;
  natureJuridique: string | null;
  creation: string | null;
  /** Dirigeants tels que publiés au RNE : « Prénom Nom (qualité) » ou « Société (qualité) ». */
  dirigeants: string[];
}

type ResultatBrut = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  tranche_effectif_salarie?: string | null;
  categorie_entreprise?: string | null;
  nature_juridique?: string | null;
  date_creation?: string | null;
  dirigeants?: {
    type_dirigeant?: string;
    nom?: string;
    prenoms?: string;
    denomination?: string;
    qualite?: string;
  }[];
  siege?: {
    libelle_commune?: string | null;
    code_postal?: string | null;
    departement?: string | null;
  };
};

/** Aplatit un résultat de l'API en ligne exploitable. Null si inexploitable. */
export function extraireEntreprise(brut: ResultatBrut): Entreprise | null {
  const nom = (brut.nom_complet ?? brut.nom_raison_sociale ?? "").trim();
  if (!nom || !brut.siren) return null;
  const tranche = TRANCHES_EFFECTIF[brut.tranche_effectif_salarie ?? ""];
  return {
    siren: brut.siren,
    nom,
    commune: brut.siege?.libelle_commune ?? "",
    codePostal: brut.siege?.code_postal ?? "",
    departement: brut.siege?.departement ?? "",
    effectif: tranche?.libelle ?? "inconnu",
    categorie: brut.categorie_entreprise ?? null,
    natureJuridique: brut.nature_juridique ?? null,
    creation: brut.date_creation ?? null,
    dirigeants: (brut.dirigeants ?? [])
      .map((d) =>
        d.type_dirigeant === "personne physique"
          ? `${[d.prenoms, d.nom].filter(Boolean).join(" ")}${d.qualite ? ` (${d.qualite})` : ""}`
          : `${d.denomination ?? ""}${d.qualite ? ` (${d.qualite})` : ""}`,
      )
      .map((s) => s.trim())
      .filter((s) => s.length > 1),
  };
}

/** Le siège est-il réellement dans la zone demandée ? (voir piège n° 1) */
export function siegeDansZone(
  e: Entreprise,
  zone: { departements?: string[]; codesPostaux?: string[] },
): boolean {
  const parDept = zone.departements?.length ? zone.departements.includes(e.departement) : null;
  const parCp = zone.codesPostaux?.length ? zone.codesPostaux.includes(e.codePostal) : null;
  // Aucune zone demandée : tout passe. Sinon, un seul critère satisfait suffit.
  if (parDept === null && parCp === null) return true;
  return parDept === true || parCp === true;
}

/**
 * Écarte les personnes morales de droit public (catégories juridiques 7xxx) :
 * mairies, chambres consulaires, administrations. Elles ont des NAF de
 * services et des salariés, mais n'achèteront jamais un sprint.
 *
 * On n'écarte volontairement rien d'autre : des acteurs bien réels d'un
 * marché sont des associations (Cerfrance) ou des coopératives, et la liste
 * produite est faite pour être relue à la main de toute façon.
 */
export function estHorsCible(e: Entreprise): boolean {
  return (e.natureJuridique ?? "").startsWith("7");
}

/** La ligne que `scan-lot` attend : « Nom, site ». Le site reste à compléter. */
export function ligneScanLot(e: Entreprise): string {
  return `${e.nom},`;
}

const champCsv = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * Le CSV de travail : tout ce que l'annuaire sait, pour compléter les sites et
 * trouver les contacts. Séparateur point-virgule, celui qu'Excel français
 * ouvre sans assistant.
 */
export function enCsv(entreprises: Entreprise[]): string {
  const lignes = [
    ["nom", "site_web", "siren", "commune", "code_postal", "effectif", "categorie", "creation", "dirigeants"].join(";"),
  ];
  for (const e of entreprises) {
    lignes.push(
      [e.nom, "", e.siren, e.commune, e.codePostal, e.effectif, e.categorie ?? "", e.creation ?? "", e.dirigeants.join(" · ")]
        .map(champCsv)
        .join(";"),
    );
  }
  return lignes.join("\n") + "\n";
}

/** Tri de lecture : par commune puis par nom, pour travailler la liste zone par zone. */
export function trier(entreprises: Entreprise[]): Entreprise[] {
  return [...entreprises].sort(
    (a, b) => a.commune.localeCompare(b.commune, "fr") || a.nom.localeCompare(b.nom, "fr"),
  );
}
