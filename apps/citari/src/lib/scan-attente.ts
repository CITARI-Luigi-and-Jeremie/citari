/**
 * Dérivations pures de l'écran d'attente.
 *
 * Portées du projet Lovable de Jérémie (`src/lib/scan-loading.ts`) le
 * 08/08/2026, réécrites pour nos identifiants : chez nous un moteur EST son
 * libellé (`ChatGPT`, `Le Chat`), il n'y a donc pas de table de correspondance
 * à traverser.
 *
 * Aucune valeur n'est inventée ici : tout se calcule depuis l'état renvoyé par
 * `etatScan`. C'est la règle de l'écran d'attente — pas de compteur simulé, pas
 * de faux moteur qui clignote pour meubler.
 */

export const LIBELLES_PHASE: Record<string, string> = {
  init: "PRÉPARATION DE LA MESURE",
  questions: "GÉNÉRATION DES QUESTIONS DE VOS ACHETEURS",
  interrogation: "INTERROGATION DES MOTEURS",
  analyse: "ANALYSE DES RÉPONSES",
};

export const ETAPES_ANALYSE = [
  "DÉTECTION DES MARQUES",
  "CLASSIFICATION DES RECOMMANDATIONS",
] as const;

/** Rappels de méthode, montrés seulement quand l'attente dépasse deux minutes. */
export const POINTS_METHODE = [
  "Les questions sont scellées : le re-scan à J+90 rejoue exactement les mêmes.",
  "Les moteurs sont interrogés par leurs API officielles. Aucune réponse simulée.",
  "Formule du score publiée : présence 50 %, rang 20 %, recommandation 20 %, tonalité 10 %.",
  "Une réponse en erreur ne compte pas au dénominateur : une panne d'éditeur ne fait pas baisser votre note.",
] as const;

export function libelleQuestion(rang: number) {
  return `Q${String(rang).padStart(2, "0")}`;
}

/** Temps réellement écoulé, format 01:47. */
export function formaterDuree(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const secondes = String(total % 60).padStart(2, "0");
  return `${minutes}:${secondes}`;
}

/** 2340 → « 2 340 MS ». */
export function formaterLatence(ms: number | null) {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "—";
  // `toLocaleString` sépare les milliers par une espace fine insécable, trop
  // serrée en mono : on la ramène à une espace ordinaire.
  const groupe = Math.round(ms).toLocaleString("fr-FR").replace(/[  ]/g, " ");
  return `${groupe} MS`;
}

export function cleCellule(queryId: string, moteur: string) {
  return `${queryId}|${moteur}`;
}
