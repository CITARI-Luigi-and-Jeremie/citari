import { describe, expect, it } from "vitest";
import { emailImmediat, situationDuScan } from "../src/lib/emails.js";
import type { ScanInsights } from "../src/lib/insights.js";

/** Un scan plausible, que chaque test déforme sur le seul point qui l'intéresse. */
const scan = (patch: Partial<ScanInsights> = {}): ScanInsights =>
  ({
    brand: "Cabinet Vaurel",
    url: "https://cabinet-vaurel.fr",
    sector: "Expertise comptable",
    score: 30,
    scoreLabel: "",
    reportUrl: "https://citari.fr/rapport/tok",
    competitors: [],
    topCompetitor: { name: "In Extenso", share: 0.2, count: 30 },
    brandShare: 0.1,
    citationsCible: 12,
    citationsConcurrents: 108,
    botsBloques: [],
    auditFait: true,
    llmstxtAbsent: false,
    weakestEngine: null,
    bestEngine: null,
    missedQueries: ["Quel cabinet comptable a Lyon ?"],
    missedCount: 8,
    totalQueries: 20,
    competitorSources: [],
    sourcesUnavailable: false,
    killerQuote: null,
    ...patch,
  }) as ScanInsights;

describe("situationDuScan", () => {
  it("place le blocage technique avant tout, même sur un bon score", () => {
    // Un robot bloqué est une CAUSE : la dire d'abord vaut mieux que commenter
    // un score qu'elle explique.
    expect(situationDuScan(scan({ score: 72, botsBloques: ["GPTBot"] }))).toBe("bloque");
  });

  it("ne vend rien au-dessus de 55", () => {
    expect(situationDuScan(scan({ score: 55 }))).toBe("solide");
  });

  it("juge la présence, pas le score : cité 20 fois n'est pas invisible", () => {
    // Le vrai cas qui a motivé la règle : Dougs, 21/100 mais cité 20 fois.
    // Le score composite l'écrasait sous 25, et l'email lui aurait affirmé
    // qu'il n'existait pas, ce que son propre rapport contredisait.
    expect(situationDuScan(scan({ score: 21, citationsCible: 20, brandShare: 0.12 }))).toBe("marginal");
  });

  it("traite en invisible une part de voix résiduelle", () => {
    expect(situationDuScan(scan({ score: 31, citationsCible: 13, brandShare: 0.046 }))).toBe("invisible");
  });

  it("traite en invisible une marque jamais citée", () => {
    expect(situationDuScan(scan({ citationsCible: 0, brandShare: 0 }))).toBe("invisible");
  });
});

describe("emailImmediat", () => {
  it("n'affiche jamais le markdown brut des moteurs", () => {
    const e = emailImmediat(
      scan({
        killerQuote: {
          query: "Quel cabinet ?",
          engine: "ChatGPT",
          excerpt: "**In Extenso** et *Fiducial* sont les plus cites.",
          competitor: "In Extenso",
        },
      })
    );
    expect(e.body).toContain("In Extenso et Fiducial sont les plus cites.");
    expect(e.body).not.toContain("**");
  });

  it("porte toujours une mention de désinscription", () => {
    for (const s of [
      scan(),
      scan({ score: 72 }),
      scan({ botsBloques: ["GPTBot"] }),
      scan({ citationsCible: 0, brandShare: 0 }),
    ]) {
      expect(emailImmediat(s).body).toMatch(/STOP/);
    }
  });

  it("ne promet pas de rendez-vous quand le score est bon", () => {
    const e = emailImmediat(scan({ score: 72 }));
    expect(e.subject).toContain("rien à vous vendre");
    expect(e.body).toContain("rien ne presse");
  });

  it("écrit « sans exception » quand toutes les questions sont manquées", () => {
    const e = emailImmediat(scan({ citationsCible: 0, brandShare: 0, missedCount: 20, totalQueries: 20 }));
    expect(e.body).toContain("sans exception");
    expect(e.body).not.toContain("Sur 20 de ces 20");
  });
});
