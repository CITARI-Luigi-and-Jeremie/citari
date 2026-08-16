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
    // Fuseau FIGÉ : sans lui, la date calendaire dépend du runtime. Le
    // serveur (Cloudflare, UTC) et le navigateur du prospect (Paris) peuvent
    // alors rendre deux dates différentes pour un scan achevé entre 22 h et
    // minuit UTC, et ce texte divergent met tout l'arbre React en erreur
    // d'hydratation. Invisible en dev, où les deux partagent le même Mac.
    timeZone: "Europe/Paris",
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

/**
 * Aperçu gratuit : ChatGPT parce que c'est le nom que tout le monde connaît,
 * Gemini parce que c'est le moins cher des six et le deuxième plus utilisé.
 * Le jeu complet des six moteurs est réservé au diagnostic en rendez-vous.
 */
export const MOTEURS_APERCU = ["ChatGPT", "Gemini"] as const satisfies readonly Moteur[];

/**
 * Contrôle interne J+45 : uniquement les moteurs qui LISENT LE WEB au moment
 * de répondre, les seuls susceptibles d'avoir bougé à mi-parcours.
 *
 * Grok en est sorti le 2026-08-03 : xAI a supprimé son API de recherche
 * (`live_search`, HTTP 410) au profit d'un format différent. Il répond
 * désormais de mémoire, comme Le Chat, donc il ne peut rien révéler à J+45.
 * ChatGPT et Gemini l'ont rejoint depuis le passage aux clés directes, qui
 * a débloqué leur recherche web.
 *
 * Jamais montré au client comme un score : c'est de la télémétrie.
 */
export const MOTEURS_CONTROLE = ["ChatGPT", "Gemini", "Claude", "Perplexity"] as const satisfies readonly Moteur[];

export type ModeScan = "apercu" | "complet" | "controle";
