/**
 * Jetons visuels de la séquence de résultat.
 *
 * Sa maquette codait sa palette en dur (#1A1A18, #D6301F, un orange #E8601F
 * hors charte). Ici tout référence NOS variables CSS : les styles en ligne de
 * React acceptent `var(...)`, et le site ne porte qu'une seule palette.
 * L'orange de ses boutons devient le signal, comme partout ailleurs.
 */
import type { CSSProperties } from "react";

export const INK = "var(--ink)";
export const PAPER = "var(--paper)";
export const CARD = "var(--surface)";
export const PANEL = "var(--paper-2)";
export const HAIR = "var(--rule-strong)";
export const MUTED = "var(--ink-3)";
export const SUFFIX = "var(--ink-3)";
export const BODY = "var(--ink-2)";
export const TEXT = "var(--ink)";
export const RED = "var(--signal)";
export const ORANGE = "var(--signal)";
export const ORANGE_HOVER = "color-mix(in srgb, var(--signal) 85%, black)";

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
