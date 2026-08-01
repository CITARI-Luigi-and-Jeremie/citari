// Typographie française.
// NNBSP = espace fine insécable (U+202F) ; NBSP = espace insécable (U+00A0).
export const NNBSP = "\u202F";
export const NBSP = "\u00A0";

/** Applique les règles françaises : fine insécable avant ? ! ; : et dans « ». */
export function fr(input: string, space: string = NNBSP): string {
  return input
    .replace(/\s*([?!;:])/g, `${space}$1`)
    .replace(/«\s*/g, `«${space}`)
    .replace(/\s*»/g, `${space}»`)
    .replace(/'/g, "\u2019");
}

/** Variante titres : Instrument Serif n'a pas le glyphe de la fine insécable. */
export function frTitre(input: string): string {
  return fr(input, NBSP);
}

/** 2 900 € — groupes de milliers séparés par une insécable. */
export function euros(value: number): string {
  return `${groupe(value)}${NBSP}€`;
}

export function pourcent(value: number, decimales = 0): string {
  return `${value.toFixed(decimales).replace(".", ",")}${NBSP}%`;
}

export function groupe(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function dateFr(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function verdict(score: number): string {
  if (score < 15) return "Invisible";
  if (score < 30) return "Quasi invisible";
  if (score < 50) return "Marginal";
  if (score < 70) return "Présent";
  if (score < 85) return "Bien établi";
  return "Référence du secteur";
}

export const MOTEURS = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Grok", "Le Chat"] as const;
export type Moteur = (typeof MOTEURS)[number];
