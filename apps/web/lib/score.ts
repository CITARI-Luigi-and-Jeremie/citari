/**
 * Sémantique chromatique des scores (DESIGN.md §4).
 * Deux pôles seulement — un score intermédiaire est neutre, ni alarme ni félicitation.
 * La couleur n'est jamais seule : le chiffre en monospace l'accompagne toujours.
 */
export type ScoreTone = "signal" | "neutral" | "valid";

export function scoreTone(score: number): ScoreTone {
  if (score < 40) return "signal";
  if (score < 70) return "neutral";
  return "valid";
}

export const TONE_VAR: Record<ScoreTone, string> = {
  signal: "var(--signal)",
  neutral: "var(--ink)",
  valid: "var(--valid)",
};

export const TONE_TEXT: Record<ScoreTone, string> = {
  signal: "text-signal",
  neutral: "text-ink",
  valid: "text-valid",
};

/** Verdict court, affiché sous le score. Sans euphémisme quand c'est mauvais. */
export function scoreVerdict(score: number): string {
  if (score < 15) return "Absente des réponses";
  if (score < 40) return "Quasi invisible";
  if (score < 55) return "Marginalement citée";
  if (score < 70) return "Présence partielle";
  if (score < 85) return "Bien positionnée";
  return "Dominante";
}
