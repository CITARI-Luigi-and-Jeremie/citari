import { z } from "zod";
import { askClaudeJson, fetchHomeText, getDb, unwrap } from "@geo/core";
import { AI_CRAWLERS } from "../lib/crawl.js";
import { recordDeliverable, requireUrl, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";
import type { AuditResult } from "./audit-technique.js";

const FixesSchema = z.object({
  llms_txt: z.string().min(100),
  pages: z.array(
    z.object({
      url: z.string(),
      schema_types: z.array(z.string()),
      jsonld: z.string(), // bloc JSON-LD sérialisé
      notes: z.string(),
    })
  ).min(1),
});

/** Chantier 1 : robots.txt corrigé, llms.txt complet, blocs JSON-LD par page + doc de specs. */
export async function generateFixes(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  const db = getDb();

  const audits = unwrap(
    await db.from("deliverables").select("*").eq("client_id", client.id).eq("kind", "audit").order("created_at", { ascending: false }).limit(1)
  ) as { data: AuditResult }[];
  const audit = audits[0]?.data;
  if (!audit) throw new Error(`Aucun audit trouvé pour ${client.brand} — lancez d'abord : pnpm toolkit audit-technique <url> --client "${client.brand}"`);

  const clientData = unwrap(await db.from("client_data").select("key,value").eq("client_id", client.id)) as { key: string; value: string }[];
  const homeText = await fetchHomeText(requireUrl(client));

  // robots.txt corrigé — déterministe, pas besoin de LLM
  const robotsTxt = `# robots.txt généré par Citari — crawlers IA explicitement autorisés
${AI_CRAWLERS.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")}

User-agent: *
Allow: /

Sitemap: ${audit.base}/sitemap.xml
`;

  console.log(`Génération llms.txt + JSON-LD pour ${client.brand}…`);
  const fixes = await askClaudeJson(
    `Tu prépares les fixes techniques GEO du site ${audit.base} (marque : ${client.brand}, secteur : ${client.sector ?? "?"}).

Contexte site (extrait home) :
"""${homeText}"""

Données client collectées : ${clientData.map((d) => `${d.key}: ${d.value}`).join(" · ") || "aucune"}

Pages auditées :
${audit.pages.map((p) => `- ${p.url} (titre: ${p.title ?? "?"}, schema existant: ${p.jsonLdTypes.join(",") || "aucun"})`).join("\n")}

Produis :
1. "llms_txt" : un fichier llms.txt complet au format markdown standard (# Nom > résumé, sections ## avec liens et descriptions factuelles). Factuel, riche en informations utiles aux IA (offre, prix si connus, différenciateurs, zone géographique).
2. "pages" : pour chaque page auditée pertinente (home obligatoire), le bloc JSON-LD schema.org adapté — Organization sur la home, Service/Product, FAQPage ou LocalBusiness selon le contenu. "jsonld" = le JSON sérialisé du bloc (avec @context), "notes" = où/comment le poser.

Format : {"llms_txt": "...", "pages": [{"url": "...", "schema_types": ["Organization"], "jsonld": "{...}", "notes": "..."}]}`,
    FixesSchema,
    { maxTokens: 8192 }
  );

  const files: string[] = [];
  files.push(writeDeliverableFile(slug, "fixes/robots.txt", robotsTxt));
  files.push(writeDeliverableFile(slug, "fixes/llms.txt", fixes.llms_txt));
  for (const page of fixes.pages) {
    const name = slugify(new URL(page.url).pathname.replace(/\//g, "-") || "home") || "home";
    let pretty = page.jsonld;
    try {
      pretty = JSON.stringify(JSON.parse(page.jsonld), null, 2);
    } catch {
      console.warn(`⚠ JSON-LD non parsable pour ${page.url} — écrit tel quel, à vérifier.`);
    }
    files.push(writeDeliverableFile(slug, `fixes/jsonld-${name}.json`, pretty));
  }

  // Document de specs pour le dev du client (si pas d'accès CMS/repo)
  const specs = `# Specs d'intégration technique GEO — ${client.brand}

À transmettre au développeur / intégrateur. Tous les fichiers cités sont dans ce dossier.

## 1. robots.txt
Remplacer le robots.txt actuel par \`fixes/robots.txt\` (crawlers IA autorisés : ${AI_CRAWLERS.join(", ")}).

## 2. llms.txt
Poser \`fixes/llms.txt\` à la racine du site : ${audit.base}/llms.txt

## 3. Balisage schema.org (JSON-LD)
Pour chaque page, insérer le bloc dans le <head> via \`<script type="application/ld+json">…</script>\` :
${fixes.pages.map((p) => `- **${p.url}** (${p.schema_types.join(", ")}) → fichier \`fixes/jsonld-${slugify(new URL(p.url).pathname.replace(/\//g, "-") || "home") || "home"}.json\`\n  ${p.notes}`).join("\n")}

## 4. Vérification
Après la pose : tester ${audit.base}/robots.txt, ${audit.base}/llms.txt, et valider les JSON-LD sur https://validator.schema.org.
`;
  files.push(writeDeliverableFile(slug, "fixes/SPECS.md", specs));

  await recordDeliverable(client.id, "fixes", `Fixes techniques (${fixes.pages.length} pages balisées)`, `deliverables/${slug}/fixes/`, {
    files,
    pages: fixes.pages.map((p) => ({ url: p.url, schema_types: p.schema_types })),
  });

  console.log(`→ ${files.length} fichiers générés :`);
  files.forEach((f) => console.log(`   ${f}`));
}
