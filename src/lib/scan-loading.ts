/**
 * Dérivations pures pour l'écran de chargement.
 * Aucune valeur n'est inventée : tout est calculé depuis l'état serveur.
 */

export const PHASE_LABELS = {
  generating_queries: "GÉNÉRATION DES QUESTIONS DE VOS ACHETEURS",
  running: "INTERROGATION DES SIX MOTEURS",
  scoring: "ANALYSE DES RÉPONSES",
} as const;

export const SCORING_STEPS = [
  "DÉTECTION DES MARQUES",
  "CLASSIFICATION DES RECOMMANDATIONS",
] as const;

export const METHOD_POINTS = [
  "Les questions sont scellées : le re-scan à J+90 rejoue exactement les mêmes.",
  "Six moteurs interrogés par leurs API officielles. Aucune réponse simulée.",
  "Formule du score publiée : présence 50 %, rang 20 %, recommandation 20 %, tonalité 10 %.",
] as const;

export function queryLabel(position: number) {
  return `Q${String(position).padStart(2, "0")}`;
}

/** Temps réellement écoulé, format 01:47. */
export function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** 2340 -> "2 340 MS" */
export function formatLatency(ms: number | null) {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "—";
  return `${Math.round(ms).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")} MS`;
}

export function cellKey(queryId: string, engine: string) {
  return `${queryId}|${engine}`;
}
