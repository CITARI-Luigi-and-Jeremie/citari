import { z } from "zod";
import type { PriorityAction } from "../types";
import { askClaudeJson, type LLMUsage } from "../llm/json";
import { isMock, mockActions } from "../mock/mockLlm";

const ActionsSchema = z.object({
  actions: z
    .array(z.object({ chantier: z.union([z.literal(1), z.literal(2), z.literal(3)]), action: z.string().min(10) }))
    .length(10),
});

/** Les « 10 actions prioritaires » du rapport, mappées sur les 3 chantiers. */
export async function generatePriorityActions(
  input: {
    brand: string;
    sector: string;
    score: number;
    missedQueries: string[]; // requêtes où la marque est absente
    competitorSources: string[]; // sources citées par Perplexity pour les concurrents
  },
  onUsage?: (u: LLMUsage) => void
): Promise<PriorityAction[]> {
  if (isMock()) return mockActions(input.brand, input.missedQueries);
  const prompt = `Tu es consultant GEO (Generative Engine Optimization). Génère exactement 10 actions prioritaires, concrètes et spécifiques, pour améliorer la visibilité de "${input.brand}" (secteur : ${input.sector}, score actuel : ${input.score}/100) dans les réponses de ChatGPT, Claude, Gemini et Perplexity.

Chaque action est mappée sur un chantier :
1 = Technique (robots.txt/crawlers IA, llms.txt, schema.org, structure des pages en format réponse directe)
2 = Contenu (pages comparatives, pages "alternatives à", FAQ balisée, guides d'achat factuels)
3 = Citations externes (annuaires, comparateurs, presse, forums, fiches)

Requêtes où la marque est ABSENTE des réponses IA :
${input.missedQueries.slice(0, 15).map((q) => `- ${q}`).join("\n") || "- (aucune)"}

Sources citées par Perplexity pour les concurrents (là où il faut exister) :
${input.competitorSources.slice(0, 15).map((s) => `- ${s}`).join("\n") || "- (aucune)"}

Utilise ces données : cite des requêtes et des sources précises dans les actions. Mix indicatif : 3-4 actions chantier 1, 3-4 chantier 2, 3 chantier 3.

Format : {"actions": [{"chantier": 1, "action": "..."}, ...]} (exactement 10).`;

  const out = await askClaudeJson(prompt, ActionsSchema, { maxTokens: 3000, onUsage });
  return out.actions;
}
