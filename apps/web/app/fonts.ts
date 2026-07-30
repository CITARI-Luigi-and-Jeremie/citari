import { Instrument_Serif, Public_Sans, IBM_Plex_Mono } from "next/font/google";

/** Titres : serif éditoriale à fort caractère. Un seul poids, assumé. */
export const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

/** Corps : grotesque lisible, non générique. */
export const body = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Données : toute valeur mesurée passe par cette monospace — signature du produit.
 * IBM Plex Mono plutôt qu'une mono d'éditeur de code : sur papier, elle évoque
 * la machine à écrire et le relevé, pas le terminal.
 */
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = `${editorial.variable} ${body.variable} ${mono.variable}`;
