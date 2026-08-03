import { describe, expect, it } from "vitest";
import { scoreGagnabilite } from "../src/lib/gagnabilite";

const base = { texte: "q", dominantPresent: false, domainesSources: [] as string[] };

describe("gagnabilité", () => {
  it("terrain vide local = quasi maximal", () => {
    const g = scoreGagnabilite({ ...base, intent: "locale", marquesCitees: [] });
    expect(g.score).toBeGreaterThanOrEqual(60);
    expect(g.format).toContain("locale");
  });

  it("comparative encombrée au-delà de la médiane, avec forteresse = quasi nul", () => {
    const g = scoreGagnabilite({
      ...base,
      intent: "comparative",
      marquesCitees: Array.from({ length: 16 }, (_, i) => `M${i}`),
      medianeMarques: 8,
      dominantPresent: true,
      domainesSources: ["www.capterra.fr", "monblog.fr"],
    });
    expect(g.score).toBeLessThanOrEqual(10);
  });

  it("l'encombrement se juge en relatif, pas en absolu", () => {
    // Mêmes 10 concurrents : peu disputée dans un secteur saturé,
    // très disputée dans un secteur clairsemé.
    const secteurSature = scoreGagnabilite({ ...base, intent: "locale", marquesCitees: Array.from({length:10},(_,i)=>`M${i}`), medianeMarques: 20 });
    const secteurClair = scoreGagnabilite({ ...base, intent: "locale", marquesCitees: Array.from({length:10},(_,i)=>`M${i}`), medianeMarques: 4 });
    expect(secteurSature.score).toBeGreaterThan(secteurClair.score);
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

import { parseListe } from "../src/commands/scan-lot";

describe("liste d'entreprises du baromètre", () => {
  it("lit nom et site, tolère les séparateurs et les commentaires", () => {
    const l = parseListe("# Cabinets lyonnais\nDougs, dougs.fr\nPennylane;pennylane.com\n\nIn Extenso\t in-extenso.com\n");
    expect(l).toHaveLength(3);
    expect(l[0]).toEqual({ nom: "Dougs", site: "dougs.fr" });
    expect(l[2]!.nom).toBe("In Extenso");
  });
  it("accepte une entreprise sans site", () => {
    const l = parseListe("Cabinet Vaurel\n");
    expect(l[0]).toEqual({ nom: "Cabinet Vaurel", site: null });
  });
  it("ignore les lignes vides et les entrées sans nom", () => {
    expect(parseListe("\n\n  \n, site.fr\n")).toHaveLength(0);
  });
});

import { enumSouple } from "../src/lib/enum-souple";

describe("enum souple face aux libellés inventés par un modèle", () => {
  const format = enumSouple(
    ["comparatif", "alternatives", "faq", "guide"] as const,
    { comparatif: ["compar", " vs ", "versus"], alternatives: ["alternativ"], faq: ["faq"], guide: ["guide"] },
    "guide",
  );
  it("accepte la valeur exacte", () => expect(format.parse("faq")).toBe("faq"));
  it("rattrape « Client vs Concurrent »", () => expect(format.parse("Client vs Concurrent")).toBe("comparatif"));
  it("rattrape « Alternatives à [leader] »", () => expect(format.parse("Alternatives à [leader]")).toBe("alternatives"));
  it("ignore les accents et la casse", () => expect(format.parse("COMPARATIF détaillé")).toBe("comparatif"));
  it("retombe sur le défaut si rien ne correspond", () => expect(format.parse("n'importe quoi")).toBe("guide"));
});
