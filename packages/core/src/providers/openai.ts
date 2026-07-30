import type { Lang, LLMAnswer, LLMProvider } from "../types";
import { requireEnv, optionalEnv } from "../env";
import { extractUrls, langInstruction, postJson } from "./base";

export class OpenAIProvider implements LLMProvider {
  id = "openai" as const;

  async ask(query: string, lang: Lang): Promise<LLMAnswer> {
    const t0 = Date.now();
    const data = await postJson(
      "https://api.openai.com/v1/chat/completions",
      { Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}` },
      {
        model: optionalEnv("OPENAI_MODEL", "gpt-4o"),
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
