import { z } from "zod";
import type { BrandRef, MentionResult } from "../types";
import { askClaudeJson, type LLMUsage } from "../llm/json";
import { detectMentions } from "./detect";
import { isMock, mockClassify } from "../mock/mockLlm";

const ClassificationSchema = z.object({
  results: z.array(
    z.object({
      response_index: z.number().int().min(0),
      brand: z.string(),
      mentioned: z.boolean(),
      position: z.number().int().min(1).nullable(),
      sentiment: z.enum(["positive", "neutral", "negative"]).nullable(),
      is_recommended: z.boolean(),
    })
  ),
});

const BATCH_SIZE = 5;

/**
 * Étape 2 (LLM, en batch) : raffine la détection déterministe —
 * sentiment, recommandation explicite, mentions indirectes ratées par le matching.
 * Le résultat fusionne les deux méthodes (mentioned = déterministe OU LLM).
 */
export async function classifyMentions(
  responses: { text: string }[],
  brands: BrandRef[],
  onUsage?: (u: LLMUsage) => void
): Promise<MentionResult[][]> {
  const deterministic = responses.map((r) => detectMentions(r.text, brands));
  if (isMock()) return mockClassify(deterministic);
  const merged: MentionResult[][] = deterministic.map((ms) => ms.map((m) => ({ ...m })));

  for (let start = 0; start < responses.length; start += BATCH_SIZE) {
    const batch = responses.slice(start, start + BATCH_SIZE);
    const prompt = `Analyse ces réponses d'assistants IA. Pour CHAQUE réponse et CHAQUE marque de la liste, indique :
- mentioned : la marque est-elle citée (même indirectement, ex. "le leader français du secteur" identifiable) ?
- position : ordre de citation parmi les marques de la liste (1 = citée en premier), null si non citée
- sentiment : "positive" | "neutral" | "negative" (null si non citée)
- is_recommended : la réponse recommande-t-elle EXPLICITEMENT cette marque (conseil d'achat, "je recommande", en tête de liste des suggestions) ?

Marques : ${brands.map((b) => b.name).join(", ")}

${batch.map((r, i) => `### Réponse ${start + i}\n${r.text.slice(0, 4000)}`).join("\n\n")}

Format : {"results": [{"response_index": ${start}, "brand": "...", "mentioned": true, "position": 1, "sentiment": "positive", "is_recommended": false}, ...]} — une entrée par (réponse × marque).`;

    const out = await askClaudeJson(prompt, ClassificationSchema, { maxTokens: 4096, onUsage });

    for (const r of out.results) {
      const row = merged[r.response_index];
      if (!row) continue;
      const target = row.find((m) => m.brand.toLowerCase() === r.brand.toLowerCase());
      if (!target) continue;
      const wasDeterministic = target.mentioned;
      target.mentioned = target.mentioned || r.mentioned;
      target.position = target.position ?? r.position;
      target.sentiment = r.sentiment ?? target.sentiment;
      target.is_recommended = r.is_recommended;
      if (!wasDeterministic && r.mentioned) target.method = "llm";
    }
  }
  return merged;
}
