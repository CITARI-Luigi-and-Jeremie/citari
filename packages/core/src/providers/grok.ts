import type { Lang, LLMAnswer, LLMProvider } from "../types";
import { requireEnv, optionalEnv } from "../env";
import { extractUrls, langInstruction, postJson } from "./base";

/**
 * Grok (xAI) — cinquième moteur.
 *
 * Ajouté parce que le front Citari l'annonce et qu'il pèse réellement dans les
 * usages francophones. L'API xAI est compatible avec le format OpenAI.
 * Clé : XAI_API_KEY (https://console.x.ai).
 */
export class GrokProvider implements LLMProvider {
  id = "grok" as const;

  async ask(query: string, lang: Lang): Promise<LLMAnswer> {
    const t0 = Date.now();
    const data = await postJson(
      "https://api.x.ai/v1/chat/completions",
      { Authorization: `Bearer ${requireEnv("XAI_API_KEY")}` },
      {
        model: optionalEnv("XAI_MODEL", "grok-4"),
        messages: [
          { role: "system", content: langInstruction(lang) },
          { role: "user", content: query },
        ],
        max_tokens: 1024,
      }
    );
    const text: string = data.choices?.[0]?.message?.content ?? "";
    // Grok cite parfois ses sources quand la recherche en direct est active.
    const apiCitations: string[] = data.citations ?? [];
    return {
      text,
      citations: apiCitations.length > 0 ? apiCitations : extractUrls(text),
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - t0,
    };
  }
}
