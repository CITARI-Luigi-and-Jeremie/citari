import { z } from "zod";
import { askClaudeJson, getDb, unwrap } from "@geo/core";
import { currentSprintId, recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

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
  if (!client.initialScanId) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);

  // Sources citées par Perplexity quand un concurrent apparaît
  // `engine` stocke le libellé du moteur, pas un identifiant technique.
  const responses = unwrap(
    await db.from("responses").select("id,sources").eq("scan_id", client.initialScanId).eq("engine", "Perplexity")
  ) as { id: string; sources: unknown }[];
  const mentions = unwrap(
    await db.from("mentions").select("response_id,brand,is_target").eq("scan_id", client.initialScanId)
  ) as { response_id: string; brand: string; is_target: boolean }[];

  const sourceCounts = new Map<string, { count: number; competitors: Set<string> }>();
  for (const r of responses) {
    const comps = mentions.filter((m) => m.response_id === r.id && !m.is_target).map((m) => m.brand);
    if (comps.length === 0) continue;
    // `sources` est un jsonb : soit des chaînes, soit des objets {title?, url}.
    const urls = Array.isArray(r.sources)
      ? (r.sources as unknown[])
          .map((s) => (typeof s === "string" ? s : ((s as { url?: string })?.url ?? "")))
          .filter(Boolean)
      : [];
    for (const url of urls) {
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
  type DirectoryRow = { name: string; url: string; kind: string; authority_note: string | null };
  const COLS = "name,url,kind,authority_note";
  const sectorDirs = client.sector
    ? (unwrap(await db.from("directories").select(COLS).ilike("sector", `%${client.sector}%`)) as DirectoryRow[])
    : [];
  const generalDirs = unwrap(await db.from("directories").select(COLS).eq("sector", "tous")) as DirectoryRow[];
  const directories = [...sectorDirs, ...generalDirs].filter(
    (d, i, arr) => arr.findIndex((x) => x.url === d.url) === i
  );

  const sprintId = await currentSprintId(client.id);

  if (perplexitySources.length === 0) {
    console.log(
      "⚠ Aucune source Perplexity exploitable sur ce scan : la priorisation s'appuiera\n" +
        "  uniquement sur l'annuaire sectoriel. Ne promettez pas au client une analyse\n" +
        "  des sources citées tant que ce point n'est pas rétabli."
    );
  }
  console.log(`${perplexitySources.length} sources Perplexity, ${directories.length} annuaires en base — priorisation…`);
  const out = await askClaudeJson(
    `Tu es consultant GEO, chantier « citations externes » pour ${client.brand} (secteur : ${client.sector ?? "?"}, site : ${client.url}, concurrents : ${(client.competitors ?? []).map((c) => c.name).join(", ")}).

Sources citées par Perplexity dans les réponses où les concurrents apparaissent (LES endroits où il faut être) :
${perplexitySources.map((s) => `- ${s}`).join("\n") || "- (aucune détectée sur ce scan)"}

Annuaires, comparateurs et plateformes d'avis déjà connus en interne (à intégrer en priorité s'ils sont pertinents pour ce secteur) :
${directories.map((d) => `- ${d.name} (${d.url}) [${d.kind}]${d.authority_note ? ` — ${d.authority_note}` : ""}`).join("\n") || "- (aucun)"}

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
    // `citation_targets` ne porte que name/url/status/notes : le détail
    // (pourquoi, difficulté, pitch) vit dans le livrable Markdown, et `notes`
    // en garde le résumé pour rester lisible depuis l'admin.
    unwrap(
      await db
        .from("citation_targets")
        .insert({
          sprint_id: sprintId,
          name: t.source,
          url: t.url,
          status: "a_faire",
          notes: [`[${t.type} · ${t.difficulty}]`, t.reason, `→ ${t.action}`].filter(Boolean).join("\n"),
        })
        .select("id")
    );

    // Enrichissement de l'actif réutilisable : un annuaire découvert sur une
    // mission sert aux suivantes. L'unicité est sur (secteur, url).
    if (t.type === "annuaire" && t.url && client.sector) {
      const exists = await db
        .from("directories")
        .select("id")
        .eq("sector", client.sector)
        .eq("url", t.url)
        .maybeSingle();
      if (!exists.data) {
        await db
          .from("directories")
          .insert({ sector: client.sector, name: t.source, url: t.url, kind: t.type, language: "fr" });
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
