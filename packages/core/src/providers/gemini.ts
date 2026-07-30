import type { Lang, LLMAnswer, LLMProvider } from "../types";
import { requireEnv, optionalEnv } from "../env";
import { extractUrls, langInstruction, postJson } from "./base";

export class GeminiProvider implements LLMProvider {
  id = "gemini" as const;

  async ask(query: string, lang: Lang): Promise<LLMAnswer> {
    const t0 = Date.now();
    const model = optionalEnv("GEMINI_MODEL", "gemini-2.0-flash");
    const data = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${requireEnv("GOOGLE_AI_API_KEY")}`,
      {},
      {
        systemInstruction: { parts: [{ text: langInstruction(lang) }] },
        contents: [{ role: "user", parts: [{ text: query }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }
    );
    const text: string = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p: any) => p.text ?? "")
      .join("\n");
    return {
      text,
      citations: extractUrls(text),
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      latencyMs: Date.now() - t0,
    };
  }
}
