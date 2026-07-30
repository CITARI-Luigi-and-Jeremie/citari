import { Instrument_Serif, Public_Sans, JetBrains_Mono } from "next/font/google";

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

/** Données : toute valeur mesurée passe par cette monospace. Signature du produit. */
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = `${editorial.variable} ${body.variable} ${mono.variable}`;
