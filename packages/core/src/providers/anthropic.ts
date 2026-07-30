import type { Lang, LLMAnswer, LLMProvider } from "../types";
import { requireEnv, optionalEnv } from "../env";
import { extractUrls, langInstruction, postJson } from "./base";

export class AnthropicProvider implements LLMProvider {
  id = "anthropic" as const;

  async ask(query: string, lang: Lang): Promise<LLMAnswer> {
    const t0 = Date.now();
    const data = await postJson(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": requireEnv("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01" },
      {
        model: optionalEnv("ANTHROPIC_MODEL", "claude-sonnet-5"),
        max_tokens: 1024,
        system: langInstruction(lang),
        messages: [{ role: "user", content: query }],
      }
    );
    const text: string = (data.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");
    return {
      text,
      citations: extractUrls(text),
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      latencyMs: Date.now() - t0,
    };
  }
}
