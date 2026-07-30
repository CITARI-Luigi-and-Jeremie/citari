import type { Lang, LLMAnswer, LLMProvider } from "../types";
import { requireEnv, optionalEnv } from "../env";
import { extractUrls, langInstruction, postJson } from "./base";

export class PerplexityProvider implements LLMProvider {
  id = "perplexity" as const;

  async ask(query: string, lang: Lang): Promise<LLMAnswer> {
    const t0 = Date.now();
    const data = await postJson(
      "https://api.perplexity.ai/chat/completions",
      { Authorization: `Bearer ${requireEnv("PERPLEXITY_API_KEY")}` },
      {
        model: optionalEnv("PERPLEXITY_MODEL", "sonar"),
        messages: [
          { role: "system", content: langInstruction(lang) },
          { role: "user", content: query },
        ],
        max_tokens: 1024,
      }
    );
    const text: string = data.choices?.[0]?.message?.content ?? "";
    // Les citations sources de Perplexity sont LA donnée du Chantier 3.
    const apiCitations: string[] = data.citations ?? (data.search_results ?? []).map((r: any) => r.url).filter(Boolean);
    return {
      text,
      citations: apiCitations.length > 0 ? apiCitations : extractUrls(text),
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - t0,
    };
  }
}
