import { getDb, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

const KIND_LABELS: Record<string, string> = {
  audit: "Audit technique",
  fixes: "Correctifs techniques",
  brief: "Brief de contenu",
  content: "Contenu rédigé",
  citations: "Plan de citations externes",
  rescan_report: "Rapport de re-scan",
};

const CITATION_STATUS_LABELS: Record<string, string> = {
  todo: "à contacter",
  sent: "envoyé",
  followed_up: "relancé",
  obtained: "obtenu",
};

/**
 * Rapport de fin de sprint (semaine 4) : liste exhaustive de ce qui a été livré,
 * état des citations, et programmation du re-scan J+90. C'est le document qui
 * accompagne la facture de solde et prépare l'upsell.
 */
export async function sprintReport(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  const db = getDb();

  const sprints = unwrap(await db.from("sprints").select("*").eq("client_id", client.id).order("created_at")) as any[];
  const sprint = sprints[0];
  const tasks = sprint
    ? (unwrap(await db.from("sprint_tasks").select("*").eq("sprint_id", sprint.id).order("position")) as any[])
    : [];
  const deliverables = unwrap(await db.from("deliverables").select("*").eq("client_id", client.id).order("created_at")) as any[];
  // Rattachement par client : les cibles produites avant la vente d'un sprint
  // n'ont pas de sprint_id, et une requête par sprint les rendait invisibles.
  // Le rapport annonçait alors 0 citation alors que le travail était fait.
  const citations = unwrap(
    await db.from("citation_targets").select("*").eq("client_id", client.id)
  ) as any[];

  // Les preuves : passages réels des robots IA et vérifications en ligne.
  const crawlerHits = unwrap(
    await db.from("crawler_hits").select("bot,hits,errors,period_start,period_end").eq("client_id", client.id).order("created_at")
  ) as any[];
  const verifs = deliverables.filter((d) => ["citations_verifiees", "contenus_verifies"].includes(d.kind));

  const initialScan = client.initialScanId
    ? ((await db.from("scans").select("*").eq("id", client.initialScanId).maybeSingle()).data as any)
    : null;

  const doneTasks = tasks.filter((t) => t.done);
  const pendingTasks = tasks.filter((t) => !t.done);
  const contents = deliverables.filter((d) => d.kind === "content");
  const obtained = citations.filter((c) => c.status === "obtenue");
  const inProgress = citations.filter((c) => c.status === "envoyee" || c.status === "relancee");

  const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
  const rescanDate = sprint?.rescan_due_on ?? (sprint?.ends_on ? addDays(sprint.ends_on, 60) : null);

  const md = `# Rapport de fin de sprint GEO — ${client.brand}

**Période :** ${fmt(sprint?.started_on)} → ${fmt(sprint?.ends_on)}
**Site :** ${client.url}
**Secteur :** ${client.sector ?? "—"}
**Score de visibilité IA au démarrage :** ${initialScan?.score_global != null ? Math.round(initialScan.score_global) : "—"}/100 (scan du ${fmt(initialScan?.created_at)})

---

## 1. Ce qui a été livré

### Chantier 1 — Technique
${listDeliverables(deliverables, ["audit", "fixes"])}

### Chantier 2 — Contenu
${contents.length > 0
  ? contents.map((c) => `- **${c.title}** — \`${c.path ?? "—"}\``).join("\n")
  : "- (aucun contenu enregistré)"}

${deliverables.filter((d) => d.kind === "brief").length > 0
  ? `Briefs validés en amont : ${deliverables.filter((d) => d.kind === "brief").map((b) => b.title).join(" · ")}`
  : ""}

### Chantier 3 — Citations externes
${citations.length === 0
  ? "- (aucune cible enregistrée)"
  : `${citations.length} cibles identifiées et travaillées :

| Source | Type | Statut |
|---|---|---|
${citations
  .map((c) => `| ${c.source} | ${c.type ?? "—"} | ${CITATION_STATUS_LABELS[c.status] ?? c.status} |`)
  .join("\n")}

**Citations obtenues : ${obtained.length}** · en cours : ${inProgress.length} · restant à contacter : ${citations.length - obtained.length - inProgress.length}`}

---

## 2. Avancement de la checklist

**${doneTasks.length}/${tasks.length} tâches réalisées.**

${[1, 2, 3, 4]
  .map((week) => {
    const wt = tasks.filter((t) => t.week === week);
    if (wt.length === 0) return "";
    return `### Semaine ${week}
${wt.map((t) => `- [${t.done ? "x" : " "}] ${t.label}${t.notes ? ` — _${t.notes}_` : ""}`).join("\n")}`;
  })
  .filter(Boolean)
  .join("\n\n")}

${pendingTasks.length > 0
  ? `> ⚠ ${pendingTasks.length} tâche(s) non cochée(s) à ce jour — à traiter ou à justifier avant l'envoi du rapport au client.`
  : "> Toutes les tâches du sprint sont réalisées."}

---

## 3. Ce que ces actions vont produire

Les moteurs génératifs intègrent les changements en **4 à 12 semaines** : les correctifs techniques sont pris en
compte au prochain passage des crawlers, les nouveaux contenus deviennent citables une fois indexés, et les
citations externes pèsent progressivement sur les réponses.

C'est pourquoi ce rapport liste **les actions livrées, pas un score promis**. La mesure objective interviendra au
re-scan.

---

## Preuves mesurées, pas déclarées

${crawlerHits.length > 0
  ? `**Passages réels des robots d'IA sur votre site** (lus dans vos logs serveur) :

| Robot | Visites | Erreurs | Période |
|---|---|---|---|
${crawlerHits.map((h) => `| ${h.bot} | ${h.hits} | ${h.errors} | ${h.period_start ?? "?"} → ${h.period_end ?? "?"} |`).join("\n")}

Un robot qui visite votre site peut le lire, le retenir et le citer. C'est la
condition de tout le reste.`
  : "_Passages des robots : en attente de l'export des logs serveur._"}

${verifs.length > 0
  ? verifs.map((v) => `- **${v.title}**${v.local_path ? ` — détail : \`${v.local_path}\`` : ""}`).join("\n")
  : ""}

---

## 4. Re-scan J+90 (inclus)

**Date prévue : ${rescanDate ? fmt(rescanDate) : "à planifier"}**

Le re-scan rejoue **exactement les mêmes ${initialScan ? "questions" : "questions"} que le scan initial** — même
échantillon, mêmes moteurs, même méthode de calcul. C'est la seule façon de comparer honnêtement l'avant et
l'après. Vous recevrez un rapport comparatif indiquant l'évolution du score global, du score par moteur et de la
part de voix face à vos concurrents.

Commande interne : \`pnpm toolkit rescan "${client.brand}"\`

---

## 5. Recommandations pour la suite

${recommendations(citations.length - obtained.length, pendingTasks.length, contents.length)}

---

*Rapport généré le ${new Date().toLocaleDateString("fr-FR")} — Citari*
`;

  const path = writeDeliverableFile(slug, "rapport-fin-de-sprint.md", md);
  await recordDeliverable(client.id, "sprint_report", `Rapport de fin de sprint (${doneTasks.length}/${tasks.length} tâches)`, path, {
    doneTasks: doneTasks.length,
    totalTasks: tasks.length,
    contents: contents.length,
    citationsObtained: obtained.length,
  });

  console.log(`\nRapport de fin de sprint — ${client.brand}`);
  console.log(`  Tâches : ${doneTasks.length}/${tasks.length}`);
  console.log(`  Contenus livrés : ${contents.length}`);
  console.log(`  Citations obtenues : ${obtained.length}/${citations.length}`);
  if (pendingTasks.length > 0) console.log(`  ⚠ ${pendingTasks.length} tâche(s) non cochée(s) — à vérifier avant envoi`);
  console.log(`→ ${path}`);
}

function listDeliverables(deliverables: any[], kinds: string[]): string {
  const items = deliverables.filter((d) => kinds.includes(d.kind));
  if (items.length === 0) return "- (aucun livrable enregistré)";
  return items.map((d) => `- **${KIND_LABELS[d.kind] ?? d.kind}** : ${d.title}${d.local_path ? ` — \`${d.local_path}\`` : ""}`).join("\n");
}

function addDays(date: string, days: number): string {
  return new Date(new Date(date).getTime() + days * 86400_000).toISOString().slice(0, 10);
}

function recommendations(citationsRemaining: number, pendingTasks: number, contentCount: number): string {
  const recs: string[] = [];
  if (citationsRemaining > 0) {
    recs.push(
      `- **Poursuivre les inscriptions et relances** : ${citationsRemaining} cible(s) de citation restent à obtenir. C'est le chantier au retour le plus lent mais le plus durable.`
    );
  }
  if (pendingTasks > 0) {
    recs.push(`- **Clôturer les ${pendingTasks} tâche(s) restantes** du sprint avant le re-scan.`);
  }
  if (contentCount < 4) {
    recs.push(
      `- **Compléter le socle de contenus** : ${contentCount} contenu(s) publié(s). Les marques citées régulièrement en ont généralement 6 à 10 qui répondent à des questions d'achat précises.`
    );
  }
  recs.push(
    "- **Maintenir la fraîcheur** : mettre à jour les pages comparatives et les chiffres au moins deux fois par an — les moteurs privilégient les sources à jour."
  );
  recs.push(
    "- **Après le re-scan J+90** : selon les résultats, cibler un second lot de requêtes (nouveau segment ou nouvelle zone géographique) ou passer en maintenance mensuelle."
  );
  return recs.join("\n");
}
