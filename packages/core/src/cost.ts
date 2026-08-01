import type { EngineId } from "./types";

/** Prix en centimes d'euro par MILLION de tokens (approximation, à ajuster). */
const PRICES: Record<EngineId | "anthropic-internal", { input: number; output: number }> = {
  openai: { input: 230, output: 920 },          // gpt-4o
  anthropic: { input: 280, output: 1400 },      // claude sonnet
  gemini: { input: 10, output: 40 },            // gemini flash
  perplexity: { input: 90, output: 90 },        // sonar
  grok: { input: 280, output: 1380 },           // grok-4
  mistral: { input: 190, output: 560 },         // mistral-large
  "anthropic-internal": { input: 280, output: 1400 },
};

export function costCents(engine: EngineId | "anthropic-internal", inputTokens: number, outputTokens: number): number {
  const p = PRICES[engine];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

/** Plafond de coût par scan (centimes). Au-delà, le scan s'arrête proprement. */
export const MAX_SCAN_COST_CENTS = 150;
