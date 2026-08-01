import { z } from "zod";
import { askClaudeJson, fetchHomeText, getDb, unwrap } from "@geo/core";
import { recordDeliverable, requireUrl, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

const BriefsSchema = z.object({
  briefs: z.array(
    z.object({
      target_query: z.string(),
      format: z.enum(["comparatif", "alternatives", "faq", "guide"]),
      title: z.string(),
      outline: z.array(z.string()).min(3),
      data_needed: z.array(z.string()),
      rationale: z.string(),
    })
  ).min(4).max(6),
});

/** Chantier 2 : croise le scan (requêtes où le client est absent) avec le site → 4-6 briefs. */
export async function contentBrief(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  const db = getDb();
  if (!client.initialScanId) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);

  // Requêtes où la marque est absente des réponses
  const queries = unwrap(await db.from("queries").select("id,text,intent").eq("scan_id", client.initialScanId)) as any[];
  const responses = unwrap(await db.from("responses").select("id,query_id").eq("scan_id", client.initialScanId)) as any[];
  // Une ligne de `mentions` est une mention : on filtre sur `is_target` plutôt
  // que de comparer des noms de marque, qui varient d'une réponse à l'autre.
  const mentions = unwrap(
    await db.from("mentions").select("response_id,is_target").eq("scan_id", client.initialScanId).eq("is_target", true)
  ) as any[];
  const mentionedResponseIds = new Set(mentions.map((m) => m.response_id));
  const missedQueries = queries.filter((q) => {
    const rs = responses.filter((r) => r.query_id === q.id);
    return rs.length > 0 && !rs.some((r) => mentionedResponseIds.has(r.id));
  });

  const clientData = unwrap(await db.from("client_data").select("key,value").eq("client_id", client.id)) as { key: string; value: string }[];
  const homeText = await fetchHomeText(requireUrl(client));

  console.log(`${missedQueries.length} requêtes où ${client.brand} est absent — génération des briefs…`);
  const out = await askClaudeJson(
    `Tu es stratège contenu GEO. Propose les 4 à 6 contenus prioritaires du sprint pour ${client.brand} (secteur : ${client.sector ?? "?"}, site : ${client.url}).

Concurrents : ${(client.competitors ?? []).map((c) => c.name).join(", ") || "?"}

Requêtes du scan où ${client.brand} est ABSENT des réponses IA (cibles prioritaires) :
${missedQueries.map((q) => `- [${q.intent}] ${q.text}`).join("\n") || "- (aucune, prendre les requêtes à faible position)"}

Extrait du site existant :
"""${homeText}"""

Données client : ${clientData.map((d) => `${d.key}: ${d.value}`).join(" · ") || "aucune (à collecter au call)"}

Chaque brief : "target_query" (une requête de la liste), "format" (comparatif = "Client vs Concurrent" | alternatives = "Alternatives à [leader]" | faq = FAQ métier balisée | guide = guide d'achat factuel), "title" (H1 en forme de question si pertinent), "outline" (plan détaillé, sections H2/H3), "data_needed" (données à demander au client : prix, chiffres, différenciateurs), "rationale" (pourquoi ce contenu fera citer la marque).

Format : {"briefs": [{...}]}`,
    BriefsSchema,
    { maxTokens: 6000 }
  );

  const lines: string[] = [`# Briefs de contenu — ${client.brand}\n`];
  for (const brief of out.briefs) {
    const id = await recordDeliverable(client.id, "brief", brief.title, null, brief);
    lines.push(`## ${brief.title}
- **brief-id** : \`${id}\` → \`pnpm toolkit draft-content "${client.brand}" ${id}\`
- **Requête cible** : ${brief.target_query}
- **Format** : ${brief.format}
- **Pourquoi** : ${brief.rationale}
- **Plan** :
${brief.outline.map((o) => `  - ${o}`).join("\n")}
- **Données à demander au client** :
${brief.data_needed.map((d) => `  - ${d}`).join("\n")}
`);
    console.log(`→ Brief "${brief.title}" (${id})`);
  }

  const path = writeDeliverableFile(slug, "content-briefs.md", lines.join("\n"));
  console.log(`→ Récapitulatif : ${path}`);
}
