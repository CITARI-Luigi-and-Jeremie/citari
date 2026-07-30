import type { BrandRef, EngineId, LLMProvider } from "../types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { PerplexityProvider } from "./perplexity";
import { isMock, MockProvider } from "../mock/mockLlm";

/** `mockBrands` n'est utilisé qu'en mode démo (GEO_MOCK=1) pour simuler les mentions. */
export function getProviders(mockBrands?: BrandRef[]): Record<EngineId, LLMProvider> {
  if (isMock()) {
    const brands = () => mockBrands ?? [];
    return {
      openai: new MockProvider("openai", brands),
      anthropic: new MockProvider("anthropic", brands),
      gemini: new MockProvider("gemini", brands),
      perplexity: new MockProvider("perplexity", brands),
    };
  }
  return {
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    gemini: new GeminiProvider(),
    perplexity: new PerplexityProvider(),
  };
}

export { OpenAIProvider, AnthropicProvider, GeminiProvider, PerplexityProvider };
