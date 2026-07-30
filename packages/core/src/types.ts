export type Lang = "fr" | "it" | "en";

export type EngineId = "openai" | "anthropic" | "gemini" | "perplexity";

export const ENGINES: EngineId[] = ["openai", "anthropic", "gemini", "perplexity"];

export const ENGINE_LABELS: Record<EngineId, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

export type QueryCategory = "comparative" | "problem" | "local" | "trust";

export interface GeneratedQuery {
  text: string;
  category: QueryCategory;
}

export interface LLMAnswer {
  text: string;
  citations: string[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LLMProvider {
  id: EngineId;
  ask(query: string, lang: Lang): Promise<LLMAnswer>;
}

export interface BrandRef {
  name: string;
  url?: string;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface MentionResult {
  brand: string;
  mentioned: boolean;
  position: number | null;
  sentiment: Sentiment | null;
  is_recommended: boolean;
  method: "deterministic" | "llm";
}

export interface ScoreComponents {
  mentionRate: number;      // 0-1
  positionScore: number;    // 0-1 (moyenne de 1/position)
  recommendationRate: number; // 0-1
  sentimentScore: number;   // 0-1
  score: number;            // 0-100
  responses: number;
  mentionedCount: number;
}

export interface ScanScoreDetail {
  global: ScoreComponents;
  byEngine: Partial<Record<EngineId, ScoreComponents>>;
}

export interface ShareOfVoice {
  brand: string;
  counts: Record<string, number>; // marque -> nb de réponses où mentionnée
  share: Record<string, number>;  // marque -> part (0-1)
}

export interface PriorityAction {
  chantier: 1 | 2 | 3;
  action: string;
}
