export * from "./types";
export { getDb, unwrap } from "./db";
export { requireEnv, optionalEnv } from "./env";
export { costCents, MAX_SCAN_COST_CENTS } from "./cost";
export { getProviders, OpenAIProvider, AnthropicProvider, GeminiProvider, PerplexityProvider, GrokProvider } from "./providers/index";
export { extractUrls } from "./providers/base";
export { askClaudeJson, type LLMUsage } from "./llm/json";
export { generateQueries, fetchHomeText } from "./queries/generate";
export { detectMentions, brandVariants, firstMentionIndex, normalize } from "./scoring/detect";
export { classifyMentions } from "./scoring/classify";
export { computeScore, computeScoreDetail, computeShareOfVoice, type MentionForScoring } from "./scoring/score";
export { generatePriorityActions } from "./report/actions";
// `runScan` / `createRescan` ont été retirés le 06/08/2026. C'était un SECOND
// moteur de scan, resté sur le schéma d'avant Lovable : il écrivait `brand`,
// `url`, `lang`, `queries.position`, `cost_log.cost_cents`, colonnes qui
// n'existent plus. Contre la vraie base il échouait ; ses tests passaient parce
// qu'ils tournaient sur une base simulée. Le seul moteur est
// `apps/citari/src/lib/orchestrateur.server.ts`.
export { isMock } from "./mock/mockLlm";
export { resetMockDb } from "./mock/fakeDb";
