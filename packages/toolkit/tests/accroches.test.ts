import { describe, expect, it } from "vitest";
import { accrochesClassees, meilleureAccroche } from "../src/lib/accroches.js";
import type { ScanInsights } from "../src/lib/insights.js";

const scan = (patch: Partial<ScanInsights> = {}): ScanInsights =>
  ({
    brand: "Cabinet Vaurel", url: "https://cabinet-vaurel.fr", sector: "Expertise comptable",
    score: 20, scoreLabel: "", reportUrl: "https://citari.fr/rapport/tok", competitors: [],
    topCompetitor: { name: "Archipel", share: 0.2, count: 31 }, brandShare: 0.03,
    citationsCible: 5, citationsConcurrents: 300, citationsRivaux: 90,
    botsBloques: [], auditFait: true, llmstxtAbsent: false,
    weakestEngine: null, bestEngine: null,
    missedQueries: ["Quel cabinet comptable a Lyon ?"], missedCount: 9, totalQueries: 20,
    competitorSources: [], sourcesUnavailable: false, concurrentsSuivis: [], killerQuote: null,
    ...patch,
  }) as ScanInsights;

describe("classement des accroches", () => {
  it("place le blocage technique DERRIÈRE la menace concurrentielle", () => {
    // Le cœur de la décision. « Votre site bloque GPTBot » est un constat
    // technique qui souffle au dirigeant qu'une ligne suffit à régler le
    // problème : c'est crédible et ça éteint l'envie d'appeler.
    const a = meilleureAccroche(scan({ botsBloques: ["GPTBot"] }));
    expect(a!.type).not.toBe("technique");
  });

  it("garde quand même le blocage dans la liste, il ne se perd jamais", () => {
    const types = accrochesClassees(scan({ botsBloques: ["GPTBot"] })).map((a) => a.type);
    expect(types).toContain("technique");
  });

  it("fait gagner le concurrent que le prospect a nommé lui-même", () => {
    // Il l'a écrit avant de connaître le résultat : le chiffre confirme une
    // inquiétude, il ne révèle pas un inconnu.
    const a = meilleureAccroche(
      scan({
        killerQuote: { query: "q", engine: "ChatGPT", excerpt: "Archipel domine.", competitor: "Archipel" },
        concurrentsSuivis: [{ saisi: "Fiducial", releve: "Fiducial", citations: 42 }],
      })
    );
    expect(a!.type).toBe("concurrent-nomme");
    expect(a!.sujet).toContain("Fiducial est cité 42 fois");
  });

  it("ignore un concurrent nommé qui n'est pas cité", () => {
    const types = accrochesClassees(
      scan({ concurrentsSuivis: [{ saisi: "Cabinet Morel", releve: null, citations: 0 }] })
    ).map((a) => a.type);
    expect(types).not.toContain("concurrent-nomme");
  });

  it("pèse l'écart selon son ampleur, pas de façon fixe", () => {
    const faible = accrochesClassees(scan({ citationsCible: 40, citationsRivaux: 80 }))
      .find((a) => a.type === "ecart")!;
    const ecrasant = accrochesClassees(scan({ citationsCible: 2, citationsRivaux: 200 }))
      .find((a) => a.type === "ecart")!;
    expect(ecrasant.force).toBeGreaterThan(faible.force);
  });

  it("préfère l'absence totale au verbatim quand la marque n'existe pas", () => {
    const a = meilleureAccroche(scan({ citationsCible: 0, concurrentsSuivis: [] }));
    expect(["absence", "verbatim"]).toContain(a!.type);
  });

  it("ne propose rien quand le scan n'a rien donné", () => {
    expect(
      meilleureAccroche(scan({ citationsCible: 5, citationsRivaux: 0, missedCount: 0, botsBloques: [] }))
    ).toBeNull();
  });

  it("explique toujours pourquoi une accroche vaut ce qu'elle vaut", () => {
    for (const a of accrochesClassees(scan({ botsBloques: ["GPTBot"] }))) {
      expect(a.pourquoi.length).toBeGreaterThan(20);
      expect(a.force).toBeGreaterThanOrEqual(0);
      expect(a.force).toBeLessThanOrEqual(100);
    }
  });
});
