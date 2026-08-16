import { MOTEURS } from "@/lib/typo";

/**
 * Dérivations partagées des pages de rapport.
 *
 * Deux règles s'appliquent partout ici, et elles ont chacune coûté un bug :
 *
 * 1. On ne compte jamais sur `share_of_voice`, qui est tronqué aux dix
 *    premières lignes et compte en citations. On compte sur `mentions`, en
 *    RÉPONSES distinctes : c'est l'unité de tout le parcours.
 * 2. Le concurrent mis en avant est un RIVAL atteignable, jamais le plus cité
 *    dans l'absolu : annoncer KPMG à un cabinet de quinze personnes est exact
 *    et décourageant. `concurrent_classes` vide signifie « tout est rival ».
 *
 * Réduit le 14/08/2026 : la maquette « page longue » (RapportApercu) a été
 * remplacée par la séquence de pop-ups, qui ne consomme plus que ces
 * fonctions-ci. Voir `rapport-sequence.ts` pour l'assemblage.
 */

export type LigneMention = {
  id: string;
  query_id: string;
  response_id: string;
  engine: string;
  brand: string;
  is_target: boolean;
  position: number | null;
  recommended: boolean;
  sentiment: string | null;
  verbatim: string | null;
};

export type LigneReponse = {
  id: string;
  query_id: string;
  engine: string;
  raw_text: string | null;
  error: string | null;
};

export type LigneQuestion = { id: string; rank: number; text: string; intent: string };

export type Adversaire = { nom: string; reponses: number; total: number; geant: boolean };

export function adversairePrincipal(
  mentions: LigneMention[],
  reponsesRetenues: number,
  classes: Record<string, string> = {},
  alias: Record<string, string> = {},
): Adversaire | null {
  const classeDe = (marque: string) => classes[alias[marque] ?? marque] ?? "rival";

  const parMarque = new Map<string, Set<string>>();
  for (const m of mentions) {
    if (m.is_target) continue;
    // Les institutions (ordres, chambres) sont citées comme références, jamais
    // comme prestataires à choisir : elles ne prennent la place de personne.
    if (classeDe(m.brand) === "institution") continue;
    // Regroupé par ALIAS, comme `partDeVoix` : sans quoi « Exco » et « Exco
    // Lyon » restent deux adversaires aux comptages disjoints, et le duel
    // annonce un nombre plus petit que la barre de part de voix affichée
    // juste en dessous. C'est le bug du 14/08/2026 (« 14 d'un côté, 13 de
    // l'autre », scan Airbnb), qui n'avait été corrigé que pour la cible.
    const nom = alias[m.brand] ?? m.brand;
    const vu = parMarque.get(nom) ?? new Set<string>();
    vu.add(m.response_id);
    parMarque.set(nom, vu);
  }

  const tri = [...parMarque.entries()]
    .map(([nom, reponses]) => ({ nom, reponses: reponses.size, classe: classeDe(nom) }))
    // Départage par nom : `mentions` arrive sans ORDER BY, deux ex æquo
    // sortiraient donc dans l'ordre du moment et le rapport pourrait nommer
    // un adversaire différent d'une ouverture à l'autre.
    .sort((a, b) => b.reponses - a.reponses || a.nom.localeCompare(b.nom));

  const rival = tri.find((c) => c.classe === "rival") ?? tri[0];
  if (!rival) return null;

  return {
    nom: rival.nom,
    reponses: rival.reponses,
    total: reponsesRetenues,
    geant: rival.classe === "geant",
  };
}

/** Réponses dans lesquelles la marque suivie apparaît, et non nombre de citations. */
export function reponsesAvecLaMarque(mentions: LigneMention[]): number {
  return new Set(mentions.filter((m) => m.is_target).map((m) => m.response_id)).size;
}

/** Réponses réellement obtenues : une panne ne compte pas au dénominateur. */
export function reponsesRetenues(reponses: LigneReponse[]): number {
  return reponses.filter((r) => !r.error && r.raw_text).length;
}

export type LignePdv = { nom: string; reponses: number; cible: boolean };

/**
 * La part de voix, comptée en RÉPONSES. Les variantes d'écriture sont
 * regroupées avec `brand_aliases`, sans quoi « Exco » et « Exco Lyon »
 * feraient deux barres. La ligne du client est garantie présente, même hors
 * du haut de tableau : sans elle, un client classé onzième apparaissait à
 * zéro.
 *
 * `marqueCible` regroupe TOUTES les mentions de la marque suivie sous un
 * seul nom : les moteurs l'écrivent parfois de plusieurs façons, et deux
 * lignes « cible » faisaient diverger ce comptage de celui de la carte
 * concurrent (14 d'un côté, 13 de l'autre, scan Airbnb du 14/08/2026).
 */
export function partDeVoix(
  mentions: LigneMention[],
  alias: Record<string, string> = {},
  max = 5,
  marqueCible?: string,
): LignePdv[] {
  const parNom = new Map<string, { reponses: Set<string>; cible: boolean }>();
  for (const m of mentions) {
    const nom = m.is_target ? (marqueCible ?? m.brand) : (alias[m.brand] ?? m.brand);
    const entree = parNom.get(nom) ?? { reponses: new Set<string>(), cible: m.is_target };
    entree.reponses.add(m.response_id);
    entree.cible = entree.cible || m.is_target;
    parNom.set(nom, entree);
  }

  const toutes = [...parNom.entries()]
    .map(([nom, v]) => ({ nom, reponses: v.reponses.size, cible: v.cible }))
    // Départage par nom : `mentions` arrive sans ordre garanti, et le
    // classement affiché ne doit pas changer d'une ouverture à l'autre.
    .sort((a, b) => b.reponses - a.reponses || a.nom.localeCompare(b.nom));

  const tete = toutes.slice(0, max);
  const cible = toutes.find((l) => l.cible);
  if (cible && !tete.some((l) => l.cible)) tete.push(cible);
  return tete;
}

/** Les moteurs réellement présents dans les réponses, dans l'ordre canonique. */
export function moteursDesReponses(reponses: LigneReponse[]): string[] {
  const vus = new Set(reponses.map((r) => r.engine));
  return MOTEURS.filter((m) => vus.has(m));
}
