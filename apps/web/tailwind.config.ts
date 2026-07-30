import type { Config } from "tailwindcss";

/**
 * Les couleurs pointent toutes vers les variables de globals.css (DESIGN.md §4).
 * Aucune valeur chromatique ne doit apparaître ici en dur.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    // Échelle d'espacement stricte (DESIGN.md §5) — pas de valeurs arbitraires
    spacing: {
      0: "0px",
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      6: "24px",
      8: "32px",
      12: "48px",
      16: "64px",
      24: "96px",
      32: "128px",
      px: "1px",
    },
    borderRadius: {
      none: "0px",
      DEFAULT: "0px", // angles nets : l'arrondi mou est proscrit
      full: "9999px",
    },
    extend: {
      colors: {
        // Fonds
        paper: {
          DEFAULT: "var(--paper)",
          raised: "var(--paper-raised)",
          sunken: "var(--paper-sunken)",
        },
        // Filets
        rule: {
          DEFAULT: "var(--rule)",
          strong: "var(--rule-strong)",
        },
        track: "var(--track)",
        // Encres
        ink: {
          DEFAULT: "var(--ink)",
          dim: "var(--ink-dim)",
          faint: "var(--ink-faint)",
        },
        // Sémantique
        signal: "var(--signal)",
        valid: "var(--valid)",
      },
      fontFamily: {
        editorial: ["var(--font-editorial)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Échelle à fort contraste (DESIGN.md §3)
        micro: ["11px", { lineHeight: "16px", letterSpacing: "0.14em" }],
        xs: ["12px", { lineHeight: "18px" }],
        sm: ["14px", { lineHeight: "22px" }],
        base: ["16px", { lineHeight: "27px" }],
        lg: ["19px", { lineHeight: "30px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["32px", { lineHeight: "38px" }],
        "3xl": ["44px", { lineHeight: "48px" }],
        "4xl": ["64px", { lineHeight: "64px" }],
        "5xl": ["80px", { lineHeight: "76px" }],
        // Assez grand pour porter la page, assez contenu pour que la preuve
        // reste visible au premier écran (mesuré à 1440×900).
        hero: ["clamp(38px, 4.4vw, 62px)", { lineHeight: "1.02", letterSpacing: "-0.015em" }],
        score: ["clamp(96px, 18vw, 200px)", { lineHeight: "0.82", letterSpacing: "-0.04em" }],
      },
      maxWidth: {
        prose: "68ch",
        shell: "1240px",
      },
      transitionTimingFunction: {
        sharp: "var(--ease-sharp)",
      },
    },
  },
  plugins: [],
} satisfies Config;
