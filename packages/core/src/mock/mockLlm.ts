/**
 * Simulation des moteurs LLM (GEO_MOCK=1) : réponses déterministes qui citent la
 * marque et les concurrents avec des probabilités réalistes — la marque cible est
 * volontairement sous-représentée pour reproduire le cas d'usage vendeur.
 */
import type { BrandRef, EngineId, GeneratedQuery, Lang, LLMAnswer, LLMProvider, MentionResult, PriorityAction, Sentiment } from "../types";

export function isMock(): boolean {
  return process.env.GEO_MOCK === "1";
}

/** Hash déterministe simple (stable entre runs). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockProvider implements LLMProvider {
  constructor(public id: EngineId, private brands: () => BrandRef[]) {}

  async ask(query: string, _lang: Lang): Promise<LLMAnswer> {
    const t0 = Date.now();
    await sleep(120 + (hash(query + this.id) % 250));
    const brands = this.brands();
    const target = brands[0] ?? { name: "Marque" };
    const competitors = brands.slice(1);
    const h = hash(`${this.id}|${query}`);

    // Concurrents cités ~75 % du temps, marque cible ~30 %
    const cited: string[] = [];
    competitors.forEach((c, i) => {
      if (hash(`${h}|comp${i}`) % 100 < 75) cited.push(c.name);
    });
    const targetCited = h % 100 < 30;
    if (targetCited) cited.splice(h % (cited.length + 1), 0, target.name);
    if (cited.length === 0 && competitors.length > 0) cited.push(competitors[0]!.name);

    const phrases = cited.map((name, i) =>
      i === 0
        ? `Pour ce besoin, ${name} est souvent recommandé : offre solide, bons retours clients.`
        : `${name} est une alternative sérieuse à considérer, notamment sur le rapport qualité-prix.`
    );
    const text = `Voici ce qu'il faut savoir. ${phrases.join(" ")} Comparez les offres selon votre budget et vos contraintes avant de choisir. (réponse simulée — mode démo)`;

    const citations =
      this.id === "perplexity"
        ? [
            `https://www.trustpilot.com/review/${(competitors[0]?.name ?? "exemple").toLowerCase().replace(/\s+/g, "")}.fr`,
            `https://comparateur-secteur.fr/classement-${(h % 7) + 1}`,
            `https://www.lesnumeriques.com/guide-achat-${(h % 5) + 1}`,
            ...(cited.length > 1 ? [`https://blog-avis.fr/test-${cited[1]!.toLowerCase().replace(/\s+/g, "-")}`] : []),
          ]
        : [];

    return {
      text,
      citations,
      inputTokens: 120 + (h % 60),
      outputTokens: 280 + (h % 120),
      latencyMs: Date.now() - t0,
    };
  }
}

export function mockQueries(sector: string, brand: string, count = 24): GeneratedQuery[] {
  const s = sector.toLowerCase();
  const comparative = [
    `meilleur prestataire ${s} en France`,
    `quel ${s} choisir pour une PME`,
    `top 5 des solutions ${s} en 2026`,
    `comparatif des offres ${s}`,
    `quelle entreprise de ${s} recommandez-vous`,
    `meilleur rapport qualité-prix en ${s}`,
    `${s} : quelles sont les références du marché`,
    `alternatives au leader du ${s}`,
    `quel fournisseur ${s} pour un budget serré`,
    `classement des acteurs ${s}`,
  ];
  const problem = [
    `je cherche une solution de ${s}, par où commencer`,
    `comment choisir un prestataire ${s} fiable`,
    `combien coûte un service de ${s}`,
    `quels critères pour comparer des offres ${s}`,
    `erreurs à éviter en choisissant un ${s}`,
    `${s} : faut-il passer par un professionnel`,
  ];
  const local = [
    `meilleur ${s} à Paris`,
    `${s} recommandé à Lyon`,
    `entreprise de ${s} près de Bordeaux`,
    `${s} en région parisienne, qui choisir`,
    `${s} à Marseille avis`,
  ];
  const trust = [
    `${brand} est-il fiable`,
    `avis clients sur ${brand}`,
    `${brand} arnaque ou sérieux ?`,
  ];
  const all: GeneratedQuery[] = [
    ...comparative.map((text) => ({ text, category: "comparative" as const })),
    ...problem.map((text) => ({ text, category: "problem" as const })),
    ...local.map((text) => ({ text, category: "local" as const })),
    ...trust.map((text) => ({ text, category: "trust" as const })),
  ];
  return all.slice(0, Math.max(20, Math.min(30, count)));
}

/** Enrichit la détection déterministe (sentiment/recommandation) sans appel LLM. */
export function mockClassify(deterministic: MentionResult[][]): MentionResult[][] {
  return deterministic.map((row, i) =>
    row.map((m) => {
      if (!m.mentioned) return m;
      const h = hash(`${i}|${m.brand}`);
      const sentiment: Sentiment = h % 10 < 6 ? "positive" : h % 10 < 9 ? "neutral" : "negative";
      return { ...m, sentiment, is_recommended: m.position === 1 && h % 2 === 0 };
    })
  );
}

export function mockActions(brand: string, missedQueries: string[]): PriorityAction[] {
  const q = (i: number) => missedQueries[i] ?? "vos requêtes cibles";
  return [
    { chantier: 1, action: `Débloquer GPTBot, ClaudeBot et PerplexityBot dans le robots.txt de ${brand} pour rendre le site lisible par les IA.` },
    { chantier: 1, action: "Publier un fichier llms.txt décrivant l'offre, les prix et les différenciateurs." },
    { chantier: 1, action: "Ajouter le balisage schema.org Organization + Service sur la page d'accueil et les pages offre." },
    { chantier: 1, action: `Restructurer la page principale en format réponse directe pour la requête « ${q(0)} ».` },
    { chantier: 2, action: `Créer une page comparative ciblant « ${q(1)} » avec tableau chiffré.` },
    { chantier: 2, action: `Publier une page « Alternatives » optimisée pour « ${q(2)} ».` },
    { chantier: 2, action: "Ajouter une FAQ métier balisée FAQPage répondant aux questions problème du scan." },
    { chantier: 3, action: "S'inscrire sur les 3 comparateurs sectoriels cités par Perplexity pour vos concurrents." },
    { chantier: 3, action: "Créer/compléter la fiche Google Business et solliciter 10 avis clients." },
    { chantier: 3, action: "Pitcher un article invité à la presse spécialisée du secteur (brouillons fournis par le toolkit)." },
  ];
}
