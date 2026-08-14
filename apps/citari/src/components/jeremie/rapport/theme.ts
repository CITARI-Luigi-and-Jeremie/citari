/**
 * Jetons visuels de la séquence de résultat.
 *
 * Les couleurs d'identité (encre, papier, signal) référencent NOS variables
 * CSS : une seule charte sur le site, l'orange hors charte de sa maquette
 * (#E8601F) devient le signal.
 *
 * Les NEUTRES, en revanche, reprennent ses valeurs exactes (14/08/2026) :
 * le premier port les faisait passer par nos jetons hérités (--surface
 * blanc pur, --ink-3 plus pâle, filets translucides) et l'ensemble rendait
 * plus froid et moins contrasté que sa maquette. Une carte blanc chaud sur
 * fond sombre, des filets chauds pleins, des libellés profonds : c'est ce
 * qui fait tenir le design, pas un choix de charte.
 */
import type { CSSProperties } from "react";

export const INK = "var(--ink)";
export const PAPER = "var(--paper)";
export const RED = "var(--signal)";
export const ORANGE = "var(--signal)";
export const ORANGE_HOVER = "color-mix(in srgb, var(--signal) 85%, black)";

/* Neutres de sa maquette, posés en dur : voir l'en-tête. */
export const CARD = "#FFFDF9";
export const PANEL = "#F2F0E9";
export const HAIR = "#E4E1D9";
export const MUTED = "#6B665D";
export const SUFFIX = "#8F897C";
export const BODY = "#55514A";
export const TEXT = "#3A3733";

/* Décor sombre repris de l'écran de scan. */
export const DEEP = "var(--ink)";
export const ON_DEEP = "var(--paper-2)";
export const ON_DEEP_MUTED = "color-mix(in srgb, var(--paper-2) 45%, transparent)";
export const ON_DEEP_HAIR = "color-mix(in srgb, var(--paper-2) 16%, transparent)";

export const SANS = "var(--font-sans)";
export const MONO = "var(--font-mono)";
export const SERIF = "var(--font-quote)";

export const labelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 12,
  letterSpacing: "0.13em",
  color: MUTED,
};
