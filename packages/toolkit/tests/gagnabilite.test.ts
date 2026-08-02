import { describe, expect, it } from "vitest";
import { scoreGagnabilite } from "../src/lib/gagnabilite";

const base = { texte: "q", dominantPresent: false, domainesSources: [] as string[] };

describe("gagnabilité", () => {
  it("terrain vide local = quasi maximal", () => {
    const g = scoreGagnabilite({ ...base, intent: "locale", marquesCitees: [] });
    expect(g.score).toBeGreaterThanOrEqual(60);
    expect(g.format).toContain("locale");
  });

  it("comparative nationale encombrée avec forteresse = quasi nul", () => {
    const g = scoreGagnabilite({
      ...base,
      intent: "comparative",
      marquesCitees: ["A", "B", "C", "D", "E", "F", "G", "H"],
      dominantPresent: true,
      domainesSources: ["www.capterra.fr", "monblog.fr"],
    });
    expect(g.score).toBeLessThanOrEqual(10);
  });

  it("le dominant absent rend la question plus gagnable que présent", () => {
    const avec = scoreGagnabilite({ ...base, intent: "probleme", marquesCitees: ["A", "B"], dominantPresent: true });
    const sans = scoreGagnabilite({ ...base, intent: "probleme", marquesCitees: ["A", "B"], dominantPresent: false });
    expect(sans.score).toBeGreaterThan(avec.score);
  });

  it("les sous-domaines de forteresses sont détectés", () => {
    const g = scoreGagnabilite({ ...base, intent: "locale", marquesCitees: ["A"], domainesSources: ["fr.trustpilot.com"] });
    expect(g.raisons.join(" ")).toContain("trustpilot");
  });

  it("borné entre 0 et 100", () => {
    const g = scoreGagnabilite({ ...base, intent: "locale", marquesCitees: [] });
    expect(g.score).toBeLessThanOrEqual(100);
  });
});

import { marquePresente } from "../src/commands/verify-citations";
import { analyserContenu } from "../src/commands/verify-contents";

describe("preuves", () => {
  it("trouve la marque malgré balises, accents et ponctuation", () => {
    const html = `<html><body><h2>Cabinet <b>Vaurel</b> &amp; Associés</h2></body></html>`;
    expect(marquePresente(html, "cabinet vaurel associes")).toBe(true);
  });
  it("ne trouve pas une marque absente, et ignore les scripts", () => {
    const html = `<script>var x = "Cabinet Vaurel";</script><body>Autre chose</body>`;
    expect(marquePresente(html, "Cabinet Vaurel")).toBe(false);
  });
  it("matche la forme compacte (NutriSmart vs nutri smart)", () => {
    expect(marquePresente("<p>Avis sur NutriSmart</p>", "nutri smart")).toBe(true);
  });
  it("détecte le JSON-LD", () => {
    expect(analyserContenu('<script type="application/ld+json">{}</script>').jsonLd).toBe(true);
    expect(analyserContenu("<p>rien</p>").jsonLd).toBe(false);
  });
});
