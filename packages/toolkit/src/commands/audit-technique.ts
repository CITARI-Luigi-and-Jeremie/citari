import { AI_CRAWLERS, crawlSite } from "../lib/crawl.js";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

export interface AuditResult {
  base: string;
  score: number;
  robots: { exists: boolean; blockedAiBots: string[]; blocksAll: boolean };
  llmsTxtExists: boolean;
  sitemapUsed: boolean;
  actions: string[];
  pages: {
    url: string; status: number; responseMs: number; title: string | null;
    metaDescription: string | null; h1Count: number; hnIssues: string[];
    jsonLdTypes: string[]; wordCount: number;
  }[];
}

export async function auditTechnique(url: string, opts: { client?: string }): Promise<void> {
  console.log(`Audit technique de ${url}…`);
  const { base, robots, llmsTxtExists, pages, sitemapUsed } = await crawlSite(url);

  const actions: string[] = [];
  let score = 100;

  if (!robots.exists) {
    score -= 10;
    actions.push("Créer un robots.txt (aucun trouvé) autorisant explicitement les crawlers IA.");
  } else if (robots.blocksAll) {
    score -= 25;
    actions.push("URGENT : robots.txt bloque TOUS les robots (Disallow: / sur *) — les IA ne peuvent pas lire le site.");
  }
  if (robots.blockedAiBots.length > 0) {
    score -= Math.min(25, robots.blockedAiBots.length * 5);
    actions.push(`Débloquer les crawlers IA dans robots.txt : ${robots.blockedAiBots.join(", ")}.`);
  }
  if (!llmsTxtExists) {
    score -= 15;
    actions.push("Créer un fichier /llms.txt décrivant l'activité, l'offre et les pages clés.");
  }
  const withJsonLd = pages.filter((p) => p.jsonLd.length > 0);
  if (withJsonLd.length === 0) {
    score -= 20;
    actions.push("Aucun balisage schema.org détecté — ajouter Organization + Service/Product + FAQPage sur les pages clés.");
  }
  const jsonLdErrors = pages.reduce((a, p) => a + p.jsonLdErrors, 0);
  if (jsonLdErrors > 0) {
    score -= 5;
    actions.push(`${jsonLdErrors} bloc(s) JSON-LD invalide(s) (erreur de parsing) à corriger.`);
  }
  const hnIssueCount = pages.reduce((a, p) => a + p.hnIssues.length, 0);
  if (hnIssueCount > 0) {
    score -= Math.min(10, hnIssueCount * 2);
    actions.push(`Corriger la structure Hn de ${pages.filter((p) => p.hnIssues.length > 0).length} page(s) (H1 unique, pas de saut de niveau).`);
  }
  const noMeta = pages.filter((p) => p.status === 200 && !p.metaDescription).length;
  if (noMeta > pages.length / 2) {
    score -= 5;
    actions.push(`Ajouter une meta description sur ${noMeta} page(s).`);
  }
  const okPages = pages.filter((p) => p.status === 200);
  const avgMs = okPages.length ? okPages.reduce((a, p) => a + p.responseMs, 0) / okPages.length : 0;
  if (avgMs > 2000) {
    score -= 5;
    actions.push(`Temps de réponse moyen élevé (${Math.round(avgMs)} ms) — viser < 2 s.`);
  }
  actions.push("Restructurer les pages clés en format « réponse directe » : titre-question, réponse en 2 phrases en tête, structure Hn propre.");
  score = Math.max(0, Math.min(100, score));

  const result: AuditResult = {
    base, score, robots, llmsTxtExists, sitemapUsed, actions,
    pages: pages.map((p) => ({
      url: p.url, status: p.status, responseMs: p.responseMs, title: p.title,
      metaDescription: p.metaDescription, h1Count: p.h1Count, hnIssues: p.hnIssues,
      jsonLdTypes: p.jsonLd.flatMap((j) => j.types), wordCount: p.wordCount,
    })),
  };

  const md = `# Audit technique GEO — ${base}

**Score technique : ${score}/100** · ${new Date().toLocaleDateString("fr-FR")} · ${pages.length} pages analysées${sitemapUsed ? " (via sitemap)" : " (via liens internes)"}

## Synthèse
| Vérification | État |
|---|---|
| robots.txt | ${robots.exists ? (robots.blocksAll ? "⛔ bloque tout" : "✅ présent") : "❌ absent"} |
| Crawlers IA bloqués | ${robots.blockedAiBots.length > 0 ? `⛔ ${robots.blockedAiBots.join(", ")}` : "✅ aucun"} |
| llms.txt | ${llmsTxtExists ? "✅ présent" : "❌ absent"} |
| schema.org | ${withJsonLd.length}/${pages.length} pages balisées${jsonLdErrors ? ` · ${jsonLdErrors} bloc(s) invalide(s)` : ""} |
| Temps de réponse moyen | ${Math.round(avgMs)} ms |

## Actions
${actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Détail par page
${result.pages
  .map(
    (p) => `### ${p.url}
- HTTP ${p.status} · ${p.responseMs} ms · ${p.wordCount} mots
- Titre : ${p.title ?? "—"}
- Meta description : ${p.metaDescription ? "oui" : "❌ absente"}
- H1 : ${p.h1Count} ${p.hnIssues.length ? `· problèmes Hn : ${p.hnIssues.join(" ; ")}` : ""}
- JSON-LD : ${p.jsonLdTypes.length ? p.jsonLdTypes.join(", ") : "aucun"}`
  )
  .join("\n\n")}

> Rappel crawlers IA à autoriser : ${AI_CRAWLERS.join(", ")}
`;

  const slug = opts.client ? slugify((await resolveClient(opts.client)).brand) : slugify(new URL(base).hostname);
  const path = writeDeliverableFile(slug, "audit-technique.md", md);
  console.log(`\n${md.split("## Détail")[0]}`);
  console.log(`→ Rapport écrit : ${path}`);

  if (opts.client) {
    const client = await resolveClient(opts.client);
    await recordDeliverable(client.id, "audit", `Audit technique ${base} (${score}/100)`, path, result);
    console.log(`→ Livrable enregistré pour ${client.brand}`);
  }
}
