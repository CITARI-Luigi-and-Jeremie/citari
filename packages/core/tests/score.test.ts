import { describe, expect, it } from "vitest";
import { computeScore, computeShareOfVoice } from "../src/scoring/score.js";
import type { MentionResult } from "../src/types.js";

const m = (over: Partial<MentionResult>): MentionResult => ({
  brand: "Acme",
  mentioned: false,
  position: null,
  sentiment: null,
  is_recommended: false,
  method: "deterministic",
  ...over,
});

describe("computeScore", () => {
  it("0 réponses → score 0", () => {
    expect(computeScore([]).score).toBe(0);
  });

  it("jamais mentionné → 0", () => {
    expect(computeScore([m({}), m({})]).score).toBe(0);
  });

  it("cas parfait → 100", () => {
    const perfect = m({ mentioned: true, position: 1, sentiment: "positive", is_recommended: true });
    expect(computeScore([perfect, perfect]).score).toBe(100);
  });

  it("pondération 50/20/20/10", () => {
    // Mentionné partout (0.5) en position 2 (0.2*0.5) sans reco (0) sentiment neutre (0.1*0.5)
    const row = m({ mentioned: true, position: 2, sentiment: "neutral" });
    expect(computeScore([row]).score).toBe(Math.round(100 * (0.5 + 0.2 * 0.5 + 0 + 0.1 * 0.5)));
  });
});

describe("computeShareOfVoice", () => {
  it("calcule la part sur le total des mentions", () => {
    const all = [
      m({ brand: "Acme", mentioned: true }),
      m({ brand: "Rival", mentioned: true }),
      m({ brand: "Rival", mentioned: true }),
      m({ brand: "Acme", mentioned: false }),
    ];
    const sov = computeShareOfVoice("Acme", all);
    expect(sov.share["Acme"]).toBeCloseTo(1 / 3);
    expect(sov.share["Rival"]).toBeCloseTo(2 / 3);
  });

  it("marques jamais mentionnées présentes à 0", () => {
    const sov = computeShareOfVoice("Acme", [m({ brand: "Acme" }), m({ brand: "Rival", mentioned: true })]);
    expect(sov.share["Acme"]).toBe(0);
    expect(sov.counts["Acme"]).toBe(0);
  });
});
