import { describe, expect, it } from "vitest";
import { brandVariants, detectMentions, firstMentionIndex, normalize } from "../src/scoring/detect.js";

describe("normalize", () => {
  it("retire accents et casse", () => {
    expect(normalize("Café Pérou")).toBe("cafe perou");
    expect(normalize("Chèvrefeuille")).toBe("chevrefeuille");
  });
});

describe("brandVariants", () => {
  it("génère nom, nom compacté et domaine", () => {
    const v = brandVariants({ name: "Pay Fit", url: "https://www.payfit.com" });
    expect(v).toContain("pay fit");
    expect(v).toContain("payfit");
    expect(v).toContain("payfit.com");
  });

  it("ignore les URLs invalides", () => {
    expect(() => brandVariants({ name: "Acme", url: "n'importe quoi ::" })).not.toThrow();
  });
});

describe("firstMentionIndex", () => {
  it("matche avec frontières de mot (pas de sous-chaîne)", () => {
    expect(firstMentionIndex("Scalingo est un hébergeur", { name: "Scal" })).toBe(-1);
    expect(firstMentionIndex("Essayez Scal pour cela", { name: "Scal" })).toBeGreaterThanOrEqual(0);
  });

  it("matche malgré les accents", () => {
    expect(firstMentionIndex("Je recommande Bébé Confort.", { name: "Bebe Confort" })).toBeGreaterThanOrEqual(0);
  });

  it("matche via le domaine", () => {
    expect(firstMentionIndex("Voir payfit.com pour la paie.", { name: "PayFit SAS", url: "https://payfit.com" })).toBeGreaterThanOrEqual(0);
  });
});

describe("detectMentions", () => {
  const brands = [{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }];

  it("attribue les positions dans l'ordre de citation", () => {
    const text = "Beta est le leader. Alpha est une alternative sérieuse.";
    const res = detectMentions(text, brands);
    expect(res.find((m) => m.brand === "Beta")).toMatchObject({ mentioned: true, position: 1 });
    expect(res.find((m) => m.brand === "Alpha")).toMatchObject({ mentioned: true, position: 2 });
    expect(res.find((m) => m.brand === "Gamma")).toMatchObject({ mentioned: false, position: null });
  });

  it("retourne une entrée par marque, méthode déterministe", () => {
    const res = detectMentions("Rien à voir ici.", brands);
    expect(res).toHaveLength(3);
    expect(res.every((m) => !m.mentioned && m.method === "deterministic")).toBe(true);
  });
});
