import { z } from "zod";
import { askClaudeJson, getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

const TargetsSchema = z.object({
  targets: z.array(
    z.object({
      source: z.string(),
      url: z.string().nullable(),
      type: z.enum(["annuaire", "comparateur", "presse", "forum", "fiche", "autre"]),
      reason: z.string(),
      action: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      pitch_draft: z.string().nullable(),
    })
  ).min(5),
});

/** Chantier 3 : sources Perplexity des concurrents + base d'annuaires → liste priorisée + pitchs. */
export async function citationTargets(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  const db = getDb();
  if (!client.initial_scan_id) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);

  // Sources citées par Perplexity quand un concurrent apparaît
  const responses = unwrap(
    await db.from("responses").select("id,citations").eq("scan_id", client.initial_scan_id).eq("engine", "perplexity")
  ) as { id: string; citations: string[] }[];
  const mentions = unwrap(
    await db.from("mentions").select("response_id,brand,mentioned").eq("scan_id", client.initial_scan_id)
  ) as { response_id: string; brand: string; mentioned: boolean }[];

  const sourceCounts = new Map<string, { count: number; competitors: Set<string> }>();
  for (const r of responses) {
    const comps = mentions.filter((m) => m.response_id === r.id && m.mentioned && m.brand !== client.brand).map((m) => m.brand);
    if (comps.length === 0) continue;
    for (const url of r.citations ?? []) {
      let host: string;
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { continue; }
      const e = sourceCounts.get(host) ?? { count: 0, competitors: new Set() };
      e.count++;
      comps.forEach((c) => e.competitors.add(c));
      sourceCounts.set(host, e);
    }
  }
  const perplexitySources = [...sourceCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 25)
    .map(([host, v]) => `${host} (cité ${v.count}×, pour : ${[...v.competitors].join(", ")})`);

  // Base interne d'annuaires — actif réutilisable alimenté au fil des sprints.
  // On croise les entrées du secteur ET les incontournables « tous secteurs ».
  type DirectoryRow = { name: string; url: string; type: string; notes: string | null };
  const sectorDirs = client.sector
    ? (unwrap(await db.from("directories").select("name,url,type,notes").ilike("sector", `%${client.sector}%`)) as DirectoryRow[])
    : [];
  const generalDirs = unwrap(await db.from("directories").select("name,url,type,notes").eq("sector", "tous")) as DirectoryRow[];
  const directories = [...sectorDirs, ...generalDirs].filter(
    (d, i, arr) => arr.findIndex((x) => x.url === d.url) === i
  );

  console.log(`${perplexitySources.length} sources Perplexity, ${directories.length} annuaires en base — priorisation…`);
  const out = await askClaudeJson(
    `Tu es consultant GEO, chantier « citations externes » pour ${client.brand} (secteur : ${client.sector ?? "?"}, site : ${client.url}, concurrents : ${(client.competitors ?? []).map((c) => c.name).join(", ")}).

Sources citées par Perplexity dans les réponses où les concurrents apparaissent (LES endroits où il faut être) :
${perplexitySources.map((s) => `- ${s}`).join("\n") || "- (aucune détectée sur ce scan)"}

Annuaires, comparateurs et plateformes d'avis déjà connus en interne (à intégrer en priorité s'ils sont pertinents pour ce secteur) :
${directories.map((d) => `- ${d.name} (${d.url}) [${d.type}]${d.notes ? ` — ${d.notes}` : ""}`).join("\n") || "- (aucun)"}

Produis une liste priorisée de cibles de citation (les sources Perplexity d'abord, complétées par les annuaires/comparateurs/presse évidents du secteur en francophonie). Pour chaque cible :
- "source" : nom, "url" : URL si connue sinon null, "type" : annuaire|comparateur|presse|forum|fiche|autre
- "reason" : pourquoi (données du scan si dispo)
- "action" : quoi faire concrètement (s'inscrire, proposer un article, répondre, créer la fiche…)
- "difficulty" : easy|medium|hard
- "pitch_draft" : pour la presse/comparateurs, un brouillon d'email de pitch personnalisé, signé "${client.brand}" (null pour une simple inscription)

Format : {"targets": [{...}]}`,
    TargetsSchema,
    { maxTokens: 8192 }
  );

  // Insertion en base (suivi des statuts dans l'admin) + enrichissement de `directories`
  for (const t of out.targets) {
    unwrap(
      await db.from("citation_targets").insert({
        client_id: client.id, source: t.source, url: t.url, type: t.type,
        reason: t.reason, action: t.action, difficulty: t.difficulty, pitch_draft: t.pitch_draft,
      }).select("id")
    );
    if (t.type === "annuaire" && t.url && client.sector) {
      const exists = await db.from("directories").select("id").eq("url", t.url).maybeSingle();
      if (!exists.data) {
        await db.from("directories").insert({ sector: client.sector, name: t.source, url: t.url, type: t.type });
      }
    }
  }

  const md = `# Cibles de citations externes — ${client.brand}

| Source | Type | Difficulté | Action |
|---|---|---|---|
${out.targets.map((t) => `| ${t.url ? `[${t.source}](${t.url})` : t.source} | ${t.type} | ${t.difficulty} | ${t.action.replace(/\|/g, "/")} |`).join("\n")}

## Détail et pitchs

${out.targets.map((t) => `### ${t.source}
- **Pourquoi** : ${t.reason}
- **Action** : ${t.action}
${t.pitch_draft ? `\n**Brouillon de pitch :**\n\n\`\`\`\n${t.pitch_draft}\n\`\`\`` : ""}`).join("\n\n")}
`;
  const path = writeDeliverableFile(slug, "citation-targets.md", md);
  await recordDeliverable(client.id, "citations", `${out.targets.length} cibles de citation`, path, { count: out.targets.length });
  console.log(`→ ${out.targets.length} cibles insérées (suivi dans l'admin) · ${path}`);
}
