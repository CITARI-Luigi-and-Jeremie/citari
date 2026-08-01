import { getDb, unwrap } from "@geo/core";
import { AI_CRAWLERS, analyzeRobots, auditHtml, fetchText, normalizeBase } from "../lib/crawl.js";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Vérifie que les correctifs livrés sont RÉELLEMENT en ligne.
 *
 * Le mode d'échec le plus coûteux d'un sprint est silencieux : on livre les
 * fichiers, le développeur du client ne les déploie jamais, et on le découvre
 * trois mois plus tard au re-scan. Cette commande ferme cette porte.
 */

interface Check {
  label: string;
  ok: boolean;
  detail: string;
  /** Un correctif non posé bloque tout le reste du sprint. */
  blocking: boolean;
}

export async function verifyFixes(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  const base = normalizeBase(client.url);
  const checks: Check[] = [];

  console.log(`Vérification des correctifs sur ${base}…`);

  // ── 1. robots.txt : les crawlers IA passent-ils ? ──
  const robotsTxt = await fetchText(`${base}/robots.txt`);
  const robots = analyzeRobots(robotsTxt);

  if (!robots.exists) {
    checks.push({ label: "robots.txt présent", ok: false, detail: "aucun fichier servi", blocking: true });
  } else {
    checks.push({ label: "robots.txt présent", ok: true, detail: "servi correctement", blocking: true });
    const blocked = robots.blockedAiBots;
    checks.push({
      label: "Crawlers IA autorisés",
      ok: blocked.length === 0 && !robots.blocksAll,
      detail: robots.blocksAll
        ? "Disallow: / sur * — TOUS les robots sont bloqués"
        : blocked.length > 0
          ? `encore bloqués : ${blocked.join(", ")}`
          : "aucun crawler IA bloqué",
      blocking: true,
    });

    // Mention explicite : mieux qu'une simple absence de blocage
    const named = AI_CRAWLERS.filter((b) => new RegExp(`user-agent:\\s*${b}`, "i").test(robotsTxt ?? ""));
    checks.push({
      label: "Crawlers IA nommés explicitement",
      ok: named.length >= 4,
      detail: named.length > 0 ? `${named.length} nommés : ${named.slice(0, 5).join(", ")}` : "aucun nommé",
      blocking: false,
    });
  }

  // ── 2. llms.txt ──
  const llms = await fetchText(`${base}/llms.txt`);
  checks.push({
    label: "llms.txt en ligne",
    ok: llms != null && llms.length > 200,
    detail: llms == null ? "introuvable (404)" : llms.length < 200 ? `trop court : ${llms.length} caractères` : `${llms.length} caractères`,
    blocking: false,
  });

  // ── 3. schema.org sur les pages livrées ──
  const db = getDb();
  const fixes = unwrap(
    await db.from("deliverables").select("*").eq("client_id", client.id).eq("kind", "fixes").order("created_at", { ascending: false }).limit(1)
  ) as { data: { pages?: { url: string; schema_types: string[] }[] } }[];
  const plannedPages = fixes[0]?.data?.pages ?? [];

  if (plannedPages.length === 0) {
    checks.push({
      label: "Balisage schema.org",
      ok: false,
      detail: "aucun livrable « fixes » trouvé — lancer generate-fixes d'abord",
      blocking: false,
    });
  } else {
    for (const page of plannedPages) {
      const html = await fetchText(page.url);
      if (html == null) {
        checks.push({ label: `schema.org — ${page.url}`, ok: false, detail: "page inaccessible", blocking: false });
        continue;
      }
      const audit = auditHtml(page.url, html, 200, 0);
      const found = audit.jsonLd.flatMap((j) => j.types.map((t) => String(t)));
      const missing = page.schema_types.filter((t) => !found.includes(t));
      checks.push({
        label: `schema.org — ${page.url.replace(base, "") || "/"}`,
        ok: missing.length === 0 && audit.jsonLdErrors === 0,
        detail:
          audit.jsonLdErrors > 0
            ? `${audit.jsonLdErrors} bloc(s) JSON-LD invalide(s)`
            : missing.length > 0
              ? `manquant : ${missing.join(", ")}`
              : `présent : ${found.join(", ")}`,
        blocking: false,
      });
    }
  }

  // ── 4. Contenus publiés ──
  const contents = unwrap(
    await db.from("deliverables").select("title,data").eq("client_id", client.id).eq("kind", "content")
  ) as { title: string; data: { publishedUrl?: string } | null }[];
  for (const c of contents) {
    const url = c.data?.publishedUrl;
    if (!url) {
      checks.push({ label: `Contenu — ${c.title}`, ok: false, detail: "URL de publication non renseignée", blocking: false });
      continue;
    }
    const html = await fetchText(url);
    checks.push({
      label: `Contenu — ${c.title}`,
      ok: html != null,
      detail: html == null ? "page inaccessible" : "en ligne",
      blocking: false,
    });
  }

  // ── Verdict ──
  const failures = checks.filter((c) => !c.ok);
  const blockers = failures.filter((c) => c.blocking);

  const md = `# Vérification des correctifs — ${client.brand}

**${base}** · ${new Date().toLocaleDateString("fr-FR")}

${blockers.length > 0
  ? `## ⛔ ${blockers.length} blocage(s) : le sprint ne peut pas produire d'effet\n\n${blockers.map((c) => `- **${c.label}** — ${c.detail}`).join("\n")}\n`
  : "## ✅ Aucun blocage : le site est lisible par les moteurs IA\n"}

## Détail

| Vérification | État | Détail |
|---|---|---|
${checks.map((c) => `| ${c.label} | ${c.ok ? "✅" : c.blocking ? "⛔" : "⚠️"} | ${c.detail} |`).join("\n")}

${failures.length > 0 && blockers.length === 0
  ? `\n> ${failures.length} point(s) d'attention non bloquant(s). À traiter avant la fin du sprint.\n`
  : ""}
---

*Rappel : tant qu'un crawler IA est bloqué dans le robots.txt, aucun contenu et aucune citation ne peut produire d'effet. C'est la vérification à faire en premier après chaque déploiement du client.*

*Limite de la méthode : le balisage schema.org est cherché dans le **HTML brut**. Un site qui injecte son JSON-LD en JavaScript après chargement apparaîtra ici comme non balisé. Vérifier alors manuellement sur validator.schema.org — et signaler au client que les crawlers IA ne l'exécutent pas tous non plus, ce qui rend l'injection côté client déconseillée.*
`;

  const path = writeDeliverableFile(slug, "verification-correctifs.md", md);
  await recordDeliverable(client.id, "verification", `Vérification correctifs (${checks.length - failures.length}/${checks.length})`, path, {
    passed: checks.length - failures.length,
    total: checks.length,
    blockers: blockers.length,
  });

  console.log("");
  for (const c of checks) {
    console.log(`  ${c.ok ? "✅" : c.blocking ? "⛔" : "⚠️ "} ${c.label} — ${c.detail}`);
  }
  console.log(`\n${checks.length - failures.length}/${checks.length} vérifications passées`);
  if (blockers.length > 0) {
    console.log(`\n⛔ ${blockers.length} BLOCAGE(S) : prévenir le client immédiatement, le sprint ne peut rien produire en l'état.`);
  }
  console.log(`→ ${path}`);
}
