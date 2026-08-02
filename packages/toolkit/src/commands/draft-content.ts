import { z } from "zod";
import { askClaudeJson, getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

const DraftSchema = z.object({
  markdown: z.string().min(500),
  html: z.string().min(500),
  jsonld: z.string(),
});

/** Chantier 2 : rédige le brouillon complet d'un contenu à partir d'un brief. */
export async function draftContent(clientRef: string, briefId: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  const db = getDb();

  const brief = unwrap(await db.from("deliverables").select("*").eq("id", briefId).eq("kind", "brief").single()) as any;
  const b = brief.data as { target_query: string; format: string; title: string; outline: string[]; data_needed: string[] };
  const clientData = unwrap(await db.from("client_data").select("key,value").eq("client_id", client.id)) as { key: string; value: string }[];

  console.log(`Rédaction : "${b.title}" (${b.format})…`);
  const out = await askClaudeJson(
    `Rédige le contenu web complet suivant pour ${client.brand} (${client.url ?? "site non renseigné"}, secteur : ${client.sector ?? "?"}).

Titre : ${b.title}
Format : ${b.format}
Requête cible (le contenu doit être LA meilleure réponse à cette question) : ${b.target_query}
Plan imposé :
${b.outline.map((o) => `- ${o}`).join("\n")}

Données client réelles (à utiliser, ne rien inventer d'autre) :
${clientData.map((d) => `- ${d.key} : ${d.value}`).join("\n") || "- (aucune donnée : mets des placeholders [À COMPLÉTER : …] pour chaque fait manquant)"}

Contraintes de rédaction STRICTES :
- Réponse directe en tête : les 2 premières phrases répondent à la requête cible.
- Faits précis, chiffres, tableaux comparatifs markdown quand pertinent. AUCUN chiffre inventé : placeholder [À COMPLÉTER : …] si la donnée manque.
- Ton factuel et direct, PAS de style IA générique (bannir « dans un monde où », « il est important de noter », superlatifs creux).
- Concurrents traités factuellement et loyalement.
- Structure Hn propre (un seul H1).

Produis :
- "markdown" : le contenu complet en markdown
- "html" : le même contenu en HTML propre (article autonome, sans <html>/<head>)
- "jsonld" : bloc schema.org adapté (FAQPage pour une FAQ, Article sinon) sérialisé

Format : {"markdown": "...", "html": "...", "jsonld": "{...}"}`,
    DraftSchema,
    { maxTokens: 8192 }
  );

  const name = slugify(b.title).slice(0, 60);
  const htmlDoc = `${out.html}\n<script type="application/ld+json">\n${out.jsonld}\n</script>\n`;
  const mdPath = writeDeliverableFile(slug, `contents/${name}.md`, out.markdown);
  const htmlPath = writeDeliverableFile(slug, `contents/${name}.html`, htmlDoc);

  await recordDeliverable(client.id, "content", b.title, mdPath, { briefId, htmlPath });
  console.log(`→ ${mdPath}\n→ ${htmlPath}`);
  console.log(`\n⚠ RELECTURE OBLIGATOIRE avant livraison : vérifier chaque fait, compléter les [À COMPLÉTER].`);
}
