import { getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";
import { scoreGagnabilite, type QuestionPerdue } from "../lib/gagnabilite.js";

/**
 * Chantier 2, étape zéro : classer les questions perdues par gagnabilité.
 *
 * Les 5 contenus du sprint ne doivent pas viser les questions les plus
 * spectaculaires mais les plus gagnables avant J+90. Ce classement se calcule
 * entièrement à partir des données du scan : aucune clé API nécessaire.
 */
export async function prioriser(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  if (!client.initialScanId) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);
  const db = getDb();

  // Le classement des concurrents, posé par le moteur à la fin du scan.
  // Un géant national et un cabinet voisin n'encombrent pas de la même façon :
  // le premier occupe la réponse sans être délogeable, le second est le vrai
  // combat. Sans cette distinction, une question tenue par les seuls Big Four
  // paraît saturée alors qu'elle est justement la plus prenable localement.
  const scanRow = unwrap(
    await db.from("scans").select("concurrent_classes").eq("id", client.initialScanId).single()
  ) as { concurrent_classes: Record<string, string> | null };
  const classes = scanRow.concurrent_classes ?? {};
  const estRival = (marque: string) => (classes[marque] ?? "rival") === "rival";

  const queries = unwrap(
    await db.from("queries").select("id,text,intent").eq("scan_id", client.initialScanId).order("rank")
  ) as { id: string; text: string; intent: string | null }[];
  const responses = unwrap(
    await db.from("responses").select("id,query_id,sources").eq("scan_id", client.initialScanId)
  ) as { id: string; query_id: string; sources: unknown }[];
  const mentions = unwrap(
    await db.from("mentions").select("query_id,brand,is_target").eq("scan_id", client.initialScanId)
  ) as { query_id: string; brand: string; is_target: boolean }[];

  // Le concurrent dominant du scan : la marque non-cible la plus citée.
  const compte = new Map<string, number>();
  for (const m of mentions) {
    if (!m.is_target && estRival(m.brand)) compte.set(m.brand, (compte.get(m.brand) ?? 0) + 1);
  }
  const dominant = [...compte.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const domaine = (u: string): string | null => {
    try {
      return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return null;
    }
  };

  // Médiane des marques citées, toutes questions confondues : c'est l'étalon
  // de l'encombrement du secteur. Sans lui, la notation sature.
  const parQuestion = queries.map(
    (q) =>
      new Set(
        mentions.filter((m) => m.query_id === q.id && !m.is_target && estRival(m.brand)).map((m) => m.brand)
      ).size
  ).sort((a, b) => a - b);
  const medianeMarques = parQuestion.length ? (parQuestion[Math.floor(parQuestion.length / 2)] ?? 0) : 0;

  const perdues: { texte: string; g: ReturnType<typeof scoreGagnabilite> }[] = [];
  for (const q of queries) {
    const rs = responses.filter((r) => r.query_id === q.id);
    if (rs.length === 0) continue; // jamais mesurée : pas « perdue »
    const ms = mentions.filter((m) => m.query_id === q.id);
    if (ms.some((m) => m.is_target)) continue; // le client y est déjà

    // Seuls les rivaux comptent dans l'encombrement. Les géants et les outils
    // restent visibles dans le rapport, mais ils ne doivent pas décourager
    // d'écrire sur une question qu'un acteur local peut prendre.
    const marques = [...new Set(ms.filter((m) => !m.is_target && estRival(m.brand)).map((m) => m.brand))];
    const domaines: string[] = [];
    for (const r of rs) {
      const urls = Array.isArray(r.sources)
        ? (r.sources as unknown[])
            .map((s) => (typeof s === "string" ? s : ((s as { url?: string })?.url ?? "")))
            .filter(Boolean)
        : [];
      for (const u of urls) {
        const d = domaine(u as string);
        if (d) domaines.push(d);
      }
    }

    const entree: QuestionPerdue = {
      texte: q.text,
      intent: q.intent,
      marquesCitees: marques,
      dominantPresent: dominant !== null && marques.includes(dominant),
      domainesSources: domaines,
      medianeMarques,
    };
    perdues.push({ texte: q.text, g: scoreGagnabilite(entree) });
  }

  if (perdues.length === 0) {
    console.log(`${client.brand} est cité sur toutes les questions mesurées. Rien à prioriser.`);
    return;
  }

  perdues.sort((a, b) => b.g.score - a.g.score);
  console.log(`Encombrement : ${medianeMarques} rivaux comparables par question (médiane), géants et outils exclus.\n`);

  const md = `# Questions gagnables — ${client.brand}

Classement des ${perdues.length} questions où ${client.brand} est absent, par
gagnabilité avant J+90. Les 5 contenus du sprint visent le haut de cette liste.
Heuristique calculée depuis les données du scan : elle ordonne, elle ne prédit pas.

| # | Question | Gagnabilité | Format conseillé |
|---|---|---|---|
${perdues.map((p, i) => `| ${i + 1} | ${p.texte.replace(/\|/g, "/")} | **${p.g.score}**/100 | ${p.g.format} |`).join("\n")}

## Détail du calcul

${perdues.map((p, i) => `### ${i + 1}. ${p.texte}\n${p.g.raisons.map((r) => `- ${r}`).join("\n")}`).join("\n\n")}
`;

  const path = writeDeliverableFile(slug, "questions-gagnables.md", md);
  await recordDeliverable(client.id, "priorisation", `${perdues.length} questions classées par gagnabilité`, path, {
    top: perdues.slice(0, 5).map((p) => ({ question: p.texte, score: p.g.score })),
  });

  console.log(`${perdues.length} questions perdues classées — les 5 premières :\n`);
  for (const p of perdues.slice(0, 5)) {
    console.log(`  ${String(p.g.score).padStart(3)}/100  ${p.texte}`);
    console.log(`           → ${p.g.format}`);
  }
  console.log(`\n→ ${path}`);
}
