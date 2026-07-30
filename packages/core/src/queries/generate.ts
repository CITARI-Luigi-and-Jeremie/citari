import { z } from "zod";
import type { BrandRef, GeneratedQuery, Lang } from "../types";
import { askClaudeJson, type LLMUsage } from "../llm/json";
import { isMock, mockQueries } from "../mock/mockLlm";

const QuerySchema = z.object({
  queries: z
    .array(
      z.object({
        text: z.string().min(8),
        category: z.enum(["comparative", "problem", "local", "trust"]),
      })
    )
    .min(20)
    .max(30),
});

/** Récupère un extrait textuel de la home pour contextualiser la génération. */
export async function fetchHomeText(url: string): Promise<string> {
  try {
    const full = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(full, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOSprintBot/1.0)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return "";
  }
}

const LANG_NAMES: Record<Lang, string> = { fr: "français", it: "italien", en: "anglais" };

/**
 * Génère 20-30 requêtes « intention d'achat » qu'un prospect taperait dans un chatbot.
 * Mix imposé : 40 % comparatives, 25 % problème, 20 % locales si pertinent, 15 % confiance.
 */
export async function generateQueries(
  input: {
    brand: BrandRef;
    sector: string;
    competitors: BrandRef[];
    lang: Lang;
    count?: number;
  },
  onUsage?: (u: LLMUsage) => void
): Promise<GeneratedQuery[]> {
  const count = Math.min(30, Math.max(20, input.count ?? 24));
  if (isMock()) return mockQueries(input.sector, input.brand.name, count);
  const homeText = input.brand.url ? await fetchHomeText(input.brand.url) : "";

  const prompt = `Tu génères des requêtes que de VRAIS acheteurs potentiels taperaient dans ChatGPT/Claude/Gemini/Perplexity, pour mesurer la visibilité IA d'une marque.

Marque : ${input.brand.name} (${input.brand.url ?? "URL inconnue"})
Secteur : ${input.sector}
Concurrents : ${input.competitors.map((c) => c.name).join(", ") || "aucun fourni"}
Langue des requêtes : ${LANG_NAMES[input.lang]}
${homeText ? `Extrait de la page d'accueil :\n"""${homeText}"""` : ""}

Génère exactement ${count} requêtes avec CE mix :
- 40 % category "comparative" : "meilleur X pour Y", "X vs Y", "quel X choisir pour…"
- 25 % category "problem" : l'utilisateur décrit son problème sans nommer de solution
- 20 % category "local" : avec ville/région/pays SI le secteur s'y prête (sinon reporte sur comparative)
- 15 % category "trust" : "[marque] est-il fiable", "avis sur [marque]", "[marque] arnaque ?"

Règles : requêtes naturelles (comme tapées par un humain), intention d'achat ou de choix, JAMAIS de requête qui présuppose la réponse. Ne mentionne la marque cible QUE dans les requêtes "trust".

Format : {"queries": [{"text": "...", "category": "comparative"}, ...]}`;

  const out = await askClaudeJson(prompt, QuerySchema, { maxTokens: 4096, onUsage });
  return out.queries;
}
