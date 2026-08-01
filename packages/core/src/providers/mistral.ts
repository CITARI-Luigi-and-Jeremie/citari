import type { Lang, LLMAnswer, LLMProvider } from "../types";
import { requireEnv, optionalEnv } from "../env";
import { extractUrls, langInstruction, postJson } from "./base";

/**
 * Le Chat (Mistral) — sixième moteur.
 *
 * Le seul moteur français de l'échantillon, et le seul argument de ce type que
 * la concurrence n'a pas : pour un dirigeant de PME française, « nous mesurons
 * aussi Le Chat » porte plus qu'un moteur américain de plus.
 *
 * L'étiquette affichée est « Le Chat » et non « Mistral », par cohérence avec
 * les autres moteurs : on nomme partout l'assistant que le public utilise
 * (ChatGPT, Claude, Gemini), pas l'éditeur ni le modèle sous-jacent.
 *
 * L'API est compatible avec le format OpenAI.
 * Clé : MISTRAL_API_KEY (https://console.mistral.ai).
 */
export class MistralProvider implements LLMProvider {
  id = "mistral" as const;

  async ask(query: string, lang: Lang): Promise<LLMAnswer> {
    const t0 = Date.now();
    const data = await postJson(
      "https://api.mistral.ai/v1/chat/completions",
      { Authorization: `Bearer ${requireEnv("MISTRAL_API_KEY")}` },
      {
        model: optionalEnv("MISTRAL_MODEL", "mistral-large-latest"),
        messages: [
          { role: "system", content: langInstruction(lang) },
          { role: "user", content: query },
        ],
        max_tokens: 1024,
      }
    );
    const text: string = data.choices?.[0]?.message?.content ?? "";
    return {
      text,
      citations: extractUrls(text),
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - t0,
    };
  }
}
