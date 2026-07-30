import type { EngineId, LLMProvider } from "../types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { PerplexityProvider } from "./perplexity";

export function getProviders(): Record<EngineId, LLMProvider> {
  return {
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    gemini: new GeminiProvider(),
    perplexity: new PerplexityProvider(),
  };
}

export { OpenAIProvider, AnthropicProvider, GeminiProvider, PerplexityProvider };
