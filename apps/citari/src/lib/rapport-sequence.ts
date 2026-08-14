import { dateFr } from "@/lib/typo";
import {
  adversairePrincipal,
  partDeVoix,
  reponsesAvecLaMarque,
  reponsesRetenues,
  type LigneMention,
  type LigneQuestion,
  type LigneReponse,
} from "@/lib/rapport-apercu";

/**
 * Adaptateur de la séquence de résultat (les pop-ups de Jérémie).
 *
 * Sa maquette tournait sur un jeu d'exemple (« Ledgio, 9 fois sur 36 ») ;
 * chaque champ est ici dérivé des lignes réelles du scan, avec les règles de
 * la maison : les comptages viennent de `mentions` (jamais de
 * `share_of_voice`, tronqué), l'unité est la RÉPONSE, l'adversaire mis en
 * avant est un rival atteignable, et une réponse en panne ne compte nulle
 * part.
 */

export interface DonneesSequence {
  marque: string;
  domaine: string;
  date: string;
  score: number;
  moteurs: number;
  totalQuestions: number;
  adversaire: { nom: string; reponses: number; total: number } | null;
  vosReponses: number;
  laPlusDure: {
    question: string;
    rangQuestion: number;
    totalQuestions: number;
    moteur: string;
    texte: string;
    concurrent: string | null;
    rangConcurrent: string | null;
    votreStatut: string;
  } | null;
  voix: { nom: string; reponses: number; vous: boolean }[];
  voixMeta: {
    questions: number;
    moteurs: number;
    marquesTotal: number;
    reponsesPerdues: number;
    termeSecteur: string;
  };
}

/** « Cabinet comptable » → « cabinet » : le mot qu'on glisse dans une phrase. */
export function termeSecteur(secteur: string | null): string {
  const s = (secteur ?? "").toLowerCase();
  if (s.includes("cabinet")) return "cabinet";
  if (s.includes("agence")) return "agence";
  if (s.includes("artisan")) return "artisan";
  if (s.includes("commerce")) return "commerce";
  return "prestataire";
}

const ordinal = (n: number) =>
  n === 1 ? "citée en premier" : n === 2 ? "citée en deuxième" : `citée en position ${n}`;

/**
 * Le titre et l'accroche de la carte « concurrent », en fonction du rapport
 * de forces RÉEL. Fonction pure, testée : la première version n'avait pas de
 * branche « vous menez » et titrait « Abritel est nommé plus souvent que
 * vous » au-dessus de barres qui montraient 5 contre 14 (scan Airbnb du
 * 14/08/2026). Un titre qui contredit ses propres chiffres coûte toute la
 * crédibilité de la mesure.
 */
export function carteConcurrent(
  nom: string,
  reponsesAdversaire: number,
  vosReponses: number,
): { kicker: string; titre: string; regime: "jamais" | "derriere" | "egal" | "devant" } {
  if (vosReponses === 0) {
    return { kicker: "QUI PREND VOTRE PLACE", titre: `${nom} est nommé. Vous, jamais.`, regime: "jamais" };
  }
  if (reponsesAdversaire > vosReponses) {
    const multiple = reponsesAdversaire / vosReponses;
    const titre =
      multiple >= 2
        ? `${nom} est nommé ${Math.floor(multiple) === 2 ? "deux" : Math.floor(multiple) === 3 ? "trois" : Math.floor(multiple)} fois plus souvent que vous.`
        : `${nom} est nommé plus souvent que vous.`;
    return { kicker: "QUI PREND VOTRE PLACE", titre, regime: "derriere" };
  }
  if (reponsesAdversaire === vosReponses) {
    return { kicker: "QUI VISE VOTRE PLACE", titre: `${nom} fait jeu égal avec vous.`, regime: "egal" };
  }
  return {
    kicker: "QUI VISE VOTRE PLACE",
    titre: `Vous menez. ${nom} reste dans la conversation.`,
    regime: "devant",
  };
}

export function construireSequence(entree: {
  marque: string;
  domaine: string | null;
  date: string | null;
  score: number;
  secteur: string | null;
  questions: LigneQuestion[];
  reponses: LigneReponse[];
  mentions: LigneMention[];
  classes: Record<string, string>;
  alias: Record<string, string>;
}): DonneesSequence {
  const { marque, questions, reponses, mentions, classes, alias } = entree;

  const retenues = reponsesRetenues(reponses);
  const vosReponses = reponsesAvecLaMarque(mentions);
  const moteurs = new Set(reponses.map((r) => r.engine)).size;

  const adversaireBrut = adversairePrincipal(mentions, retenues, classes, alias);
  const adversaire = adversaireBrut
    ? { nom: adversaireBrut.nom, reponses: adversaireBrut.reponses, total: adversaireBrut.total }
    : null;

  // La réponse la plus dure, en deux étages, parce que la douleur n'a pas la
  // même forme selon le score. La première sélection prenait « le concurrent
  // le mieux placé sur une question sans la marque », point — et sortait
  // GeoComply (un éditeur B2B de géolocalisation, non classé donc réputé
  // rival) sur une question de dépannage : une pièce exacte, zéro douleur
  // commerciale.
  //
  //   Étage 1 — L'ABSENCE : un concurrent crédible cité sur une question où
  //   la marque n'apparaît pas. Crédible = classé rival ou géant ; un
  //   concurrent NON CLASSÉ n'est retenu que sur une question d'achat
  //   (comparative, locale) — c'est le garde-fou anti-GeoComply.
  //
  //   Étage 2 — LE DÉPASSEMENT, pour les marques bien citées qui n'ont
  //   presque aucune question d'absence : la phrase où un RIVAL est cité
  //   DEVANT la marque dans la même réponse. « PokerStars cité en premier ·
  //   vous : en position 3 » est la vraie brèche d'un score à 85.
  //
  //   Aucun étage ne fournit ? La carte sort de la séquence, comme toujours :
  //   jamais de pièce tiède présentée comme une douleur.
  const questionsCitees = new Set(mentions.filter((m) => m.is_target).map((m) => m.query_id));
  const classeDe = (marqueMention: string): string | null =>
    classes[alias[marqueMention] ?? marqueMention] ?? null;
  const intentDe = new Map(questions.map((q) => [q.id, q.intent]));
  const intentAchat = (queryId: string) =>
    ["comparative", "locale"].includes(intentDe.get(queryId) ?? "");
  const POIDS_CLASSE: Record<string, number> = { rival: 40, geant: 10 };
  const POIDS_INTENT: Record<string, number> = { comparative: 12, locale: 9, confiance: 5, probleme: 0 };
  const interet = (m: LigneMention) =>
    (POIDS_CLASSE[classeDe(m.brand) ?? "rival"] ?? 0) +
    (POIDS_INTENT[intentDe.get(m.query_id) ?? ""] ?? 0) +
    (adversaire && m.brand === adversaire.nom ? 20 : 0) +
    (m.recommended ? 6 : 0) +
    (m.position === 1 ? 2 : 0);
  const credible = (m: LigneMention) => {
    const classe = classeDe(m.brand);
    if (classe === "rival" || classe === "geant") return true;
    return classe === null && intentAchat(m.query_id);
  };

  const exploitable = (m: LigneMention) => !m.is_target && m.verbatim && m.verbatim.length > 60;

  // Étage 1 — l'absence.
  const absences = mentions
    .filter((m) => exploitable(m) && !questionsCitees.has(m.query_id) && credible(m))
    .sort((a, b) => interet(b) - interet(a) || (a.position ?? 99) - (b.position ?? 99));

  // Étage 2 — le dépassement : position de la marque par réponse, puis les
  // rivaux crédibles placés strictement devant elle.
  const positionCible = new Map<string, number>();
  for (const m of mentions) {
    if (m.is_target && typeof m.position === "number") {
      const connue = positionCible.get(m.response_id);
      if (connue === undefined || m.position < connue) positionCible.set(m.response_id, m.position);
    }
  }
  const depassements = mentions
    .filter((m) => {
      if (!exploitable(m) || !credible(m)) return false;
      const cible = positionCible.get(m.response_id);
      return (
        typeof cible === "number" && typeof m.position === "number" && m.position < cible
      );
    })
    .sort((a, b) => interet(b) - interet(a) || (a.position ?? 99) - (b.position ?? 99));

  const dure = absences[0] ?? depassements[0] ?? null;
  const enAbsence = Boolean(absences[0]);
  const questionDure = dure ? questions.find((q) => q.id === dure.query_id) : null;

  const laPlusDure =
    dure && questionDure
      ? {
          question: questionDure.text,
          rangQuestion: questionDure.rank,
          totalQuestions: questions.length,
          moteur: dure.engine,
          // La convention de marquage de sa maquette : *Concurrent* ressort en
          // signal. On marque le nom du concurrent dans le texte réel.
          texte: marquerConcurrent(dure.verbatim as string, dure.brand),
          concurrent: dure.brand,
          rangConcurrent: typeof dure.position === "number" ? ordinal(dure.position) : null,
          votreStatut: enAbsence
            ? `${marque} : absent de cette réponse`
            : `${marque} : cité en position ${positionCible.get(dure.response_id)} de cette réponse`,
        }
      : null;

  const voix = partDeVoix(mentions, alias, 5, marque).map((l) => ({
    nom: l.nom,
    reponses: l.reponses,
    vous: l.cible,
  }));

  // Réponses où un concurrent est nommé et pas la marque : « l'utilisateur
  // repart avec un nom identifié, pas le vôtre ».
  const parReponse = new Map<string, { cible: boolean; concurrent: boolean }>();
  for (const m of mentions) {
    const e = parReponse.get(m.response_id) ?? { cible: false, concurrent: false };
    if (m.is_target) e.cible = true;
    else e.concurrent = true;
    parReponse.set(m.response_id, e);
  }
  const reponsesPerdues = [...parReponse.values()].filter((e) => e.concurrent && !e.cible).length;

  // Le nombre total de marques distinctes, alias regroupés, compté sur
  // `mentions` : `share_of_voice` est tronqué et ne sait pas répondre.
  const marquesTotal = new Set(
    mentions.map((m) => (m.is_target ? marque : (alias[m.brand] ?? m.brand))),
  ).size;

  return {
    marque,
    domaine: entree.domaine ?? marque,
    date: entree.date ? dateFr(entree.date) : "",
    score: entree.score,
    moteurs,
    totalQuestions: questions.length,
    adversaire,
    vosReponses,
    laPlusDure,
    voix,
    voixMeta: {
      questions: questions.length,
      moteurs,
      marquesTotal,
      reponsesPerdues,
      termeSecteur: termeSecteur(entree.secteur),
    },
  };
}

/** Entoure la première occurrence du concurrent avec la marque `*...*`. */
export function marquerConcurrent(texte: string, concurrent: string): string {
  const propre = texte
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!concurrent) return propre;
  const index = propre.toLowerCase().indexOf(concurrent.toLowerCase());
  if (index === -1) return propre;
  const exact = propre.slice(index, index + concurrent.length);
  return `${propre.slice(0, index)}*${exact}*${propre.slice(index + concurrent.length)}`;
}
