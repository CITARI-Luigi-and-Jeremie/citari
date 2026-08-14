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

  // La réponse la plus dure : un concurrent recommandé (ou le mieux placé)
  // sur une question où la marque n'apparaît sur aucun moteur — la même
  // sélection que l'aguiche par email, pour que tous les écrans racontent la
  // même histoire. On garde ici la question d'origine et le rang exact.
  const questionsCitees = new Set(mentions.filter((m) => m.is_target).map((m) => m.query_id));
  const candidates = mentions
    .filter(
      (m) => !m.is_target && m.verbatim && m.verbatim.length > 60 && !questionsCitees.has(m.query_id),
    )
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || (a.position ?? 99) - (b.position ?? 99));
  const dure = candidates[0] ?? null;
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
          votreStatut: `${marque} : absent de cette réponse`,
        }
      : null;

  const voix = partDeVoix(mentions, alias).map((l) => ({
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
