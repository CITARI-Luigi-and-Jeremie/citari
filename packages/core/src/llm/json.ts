import { z } from "zod";
import { requireEnv, optionalEnv } from "../env";
import { postJson } from "../providers/base";
import { costCents } from "../cost";

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  costCents: number;
}

/**
 * Appel LLM interne (Claude) avec sortie JSON stricte validée Zod.
 * Retente une fois en renvoyant l'erreur de validation au modèle.
 */
export async function askClaudeJson<T>(
  prompt: string,
  schema: z.ZodType<T>,
  opts: { system?: string; maxTokens?: number; onUsage?: (u: LLMUsage) => void } = {}
): Promise<T> {
  const messages: { role: "user" | "assistant"; content: string }[] = [{ role: "user", content: prompt }];

  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await postJson(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": requireEnv("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01" },
      {
        model: optionalEnv("ANTHROPIC_MODEL", "claude-sonnet-5"),
        max_tokens: opts.maxTokens ?? 4096,
        system:
          (opts.system ? opts.system + "\n" : "") +
          "Réponds UNIQUEMENT avec du JSON valide, sans balises markdown, sans texte autour.",
        messages,
      }
    );
    const raw: string = (data.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    opts.onUsage?.({
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      costCents: costCents("anthropic-internal", data.usage?.input_tokens ?? 0, data.usage?.output_tokens ?? 0),
    });

    try {
      const jsonText = extractJson(raw);
      return schema.parse(JSON.parse(jsonText));
    } catch (e) {
      if (attempt === 1) throw new Error(`Sortie JSON invalide après 2 tentatives : ${String(e)}\n---\n${raw.slice(0, 800)}`);
      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "user", content: `Ta réponse est invalide (${String(e).slice(0, 300)}). Renvoie uniquement le JSON corrigé.` });
    }
  }
  throw new Error("unreachable");
}

function extractJson(raw: string): string {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.search(/[[{]/);
  if (start === -1) throw new Error("aucun JSON trouvé");
  return trimmed.slice(start);
}
