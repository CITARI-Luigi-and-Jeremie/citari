import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { AI_CRAWLERS } from "../lib/crawl.js";
import { getDb } from "@geo/core";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Analyse les logs d'accès du site client et compte les passages des crawlers IA.
 *
 * C'est la preuve la plus dure qu'un sprint fonctionne — et elle arrive six
 * semaines avant le re-scan. Un site qui passe de 0 à 40 visites de GPTBot par
 * semaine est devenu lisible par les moteurs, indépendamment du score.
 *
 * Format attendu : log combiné Apache/Nginx (le défaut chez la quasi-totalité
 * des hébergeurs). Les lignes non reconnues sont ignorées silencieusement.
 */

/** Motifs de user-agent, plus larges que les noms de robots du robots.txt. */
const BOT_PATTERNS: [string, RegExp][] = [
  ["GPTBot", /GPTBot/i],
  ["OAI-SearchBot", /OAI-SearchBot/i],
  ["ChatGPT-User", /ChatGPT-User/i],
  ["ClaudeBot", /ClaudeBot/i],
  ["Claude-Web", /Claude-Web/i],
  ["anthropic-ai", /anthropic-ai/i],
  ["PerplexityBot", /PerplexityBot/i],
  ["Perplexity-User", /Perplexity-User/i],
  ["Google-Extended", /Google-Extended/i],
  ["CCBot", /CCBot/i],
  ["Bytespider", /Bytespider/i],
  ["Applebot-Extended", /Applebot-Extended/i],
];

/** IP - - [10/Jul/2026:14:32:01 +0200] "GET /page HTTP/1.1" 200 1234 "ref" "user-agent" */
const LINE = /^(\S+).*?\[([^\]]+)\]\s+"(?:\S+)\s+(\S+)[^"]*"\s+(\d{3})\s+\S+(?:\s+"[^"]*")?\s+"([^"]*)"/;

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** 10/Jul/2026:14:32:01 +0200 → 2026-07-10 */
function toDay(stamp: string): string | null {
  const m = /^(\d{2})\/(\w{3})\/(\d{4})/.exec(stamp);
  if (!m) return null;
  const month = MONTHS[m[2] as string];
  return month ? `${m[3]}-${month}-${m[1]}` : null;
}

interface BotStats {
  hits: number;
  days: Set<string>;
  paths: Map<string, number>;
  statuses: Map<number, number>;
}

export async function crawlerLog(clientRef: string, logPath: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);

  const bots = new Map<string, BotStats>();
  const perDay = new Map<string, number>();
  let totalLines = 0;
  let parsed = 0;

  const rl = createInterface({ input: createReadStream(logPath), crlfDelay: Infinity });
  for await (const line of rl) {
    totalLines++;
    const m = LINE.exec(line);
    if (!m) continue;
    parsed++;

    const [, , stamp, path, status, ua] = m;
    const match = BOT_PATTERNS.find(([, re]) => re.test(ua ?? ""));
    if (!match) continue;

    const [name] = match;
    const day = toDay(stamp ?? "");
    const s = bots.get(name) ?? { hits: 0, days: new Set(), paths: new Map(), statuses: new Map() };
    s.hits++;
    if (day) {
      s.days.add(day);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    s.paths.set(path ?? "/", (s.paths.get(path ?? "/") ?? 0) + 1);
    const code = Number(status);
    s.statuses.set(code, (s.statuses.get(code) ?? 0) + 1);
    bots.set(name, s);
  }

  if (parsed === 0) {
    throw new Error(
      `Aucune ligne exploitable dans ${logPath}. Format attendu : log combiné Apache/Nginx. ` +
        `Demandez à l'hébergeur du client un export au format "combined".`
    );
  }

  const ranked = [...bots.entries()].sort((a, b) => b[1].hits - a[1].hits);
  const totalHits = ranked.reduce((acc, [, s]) => acc + s.hits, 0);
  const days = [...perDay.keys()].sort();
  const span = days.length;
  const perWeek = span > 0 ? Math.round((totalHits / span) * 7) : 0;

  // Un 4xx/5xx servi à un crawler est une porte fermée : c'est actionnable.
  const errors = ranked.flatMap(([name, s]) =>
    [...s.statuses.entries()].filter(([code]) => code >= 400).map(([code, n]) => ({ name, code, n }))
  );

  const md = `# Passages des crawlers IA — ${client.brand}

**Source :** \`${logPath}\` · ${parsed.toLocaleString("fr-FR")} lignes exploitées sur ${totalLines.toLocaleString("fr-FR")}
**Période couverte :** ${span > 0 ? `${days[0]} → ${days[span - 1]} (${span} jours)` : "indéterminée"}

## Synthèse

**${totalHits.toLocaleString("fr-FR")} visites de crawlers IA**, soit environ **${perWeek} par semaine**.

${totalHits === 0
  ? `> ⛔ **Aucun crawler IA n'a visité le site sur la période.** C'est le signal le plus grave possible :
> le site est invisible pour les moteurs, quelle que soit la qualité de son contenu. Vérifier
> immédiatement le robots.txt, les règles du pare-feu et les protections anti-bot (Cloudflare,
> reCAPTCHA), qui bloquent souvent ces robots par défaut.`
  : `| Robot | Visites | Jours actifs | Page la plus visitée |
|---|---:|---:|---|
${ranked
  .map(([name, s]) => {
    const top = [...s.paths.entries()].sort((a, b) => b[1] - a[1])[0];
    return `| ${name} | ${s.hits} | ${s.days.size} | \`${top?.[0] ?? "—"}\` (${top?.[1] ?? 0}) |`;
  })
  .join("\n")}`}

## Robots IA jamais vus

${AI_CRAWLERS.filter((b) => !bots.has(b)).map((b) => `- ${b}`).join("\n") || "_Aucun : tous les robots suivis sont passés._"}

${errors.length > 0
  ? `## ⚠ Erreurs servies aux crawlers

Un code 4xx ou 5xx renvoyé à un robot IA est une porte fermée — à corriger en priorité.

${errors.map((e) => `- **${e.name}** a reçu ${e.n} réponse(s) HTTP ${e.code}`).join("\n")}`
  : "## Erreurs servies aux crawlers\n\n_Aucune : tous les robots ont reçu des réponses valides._"}

## Activité par jour

${days.length > 0
  ? days.map((d) => `${d}  ${"█".repeat(Math.min(40, perDay.get(d) ?? 0))} ${perDay.get(d)}`).join("\n")
  : "_Dates illisibles dans ce format de log._"}

---

*Cette mesure est indépendante du Score de Visibilité IA : elle prouve que le site est **lisible**,
pas qu'il est **cité**. Les deux sont nécessaires, la lisibilité vient en premier.*
`;

  // Persistance dans crawler_hits : c'est la série temporelle qui prouve, de
  // sprint en sprint, que le site est devenu lisible. Une ligne par bot vu.
  const db = getDb();
  const periodStart = days[0] ?? null;
  const periodEnd = days[days.length - 1] ?? null;
  for (const [bot, st] of ranked) {
    const errs = [...st.statuses.entries()].filter(([c]) => c >= 400).reduce((a, [, n]) => a + n, 0);
    await db.from("crawler_hits").insert({
      client_id: client.id,
      period_start: periodStart,
      period_end: periodEnd,
      bot,
      hits: st.hits,
      errors: errs,
    });
  }

  const path = writeDeliverableFile(slug, "crawlers-ia.md", md);
  await recordDeliverable(client.id, "crawler_log", `Passages crawlers IA (${totalHits} visites, ~${perWeek}/semaine)`, path, {
    totalHits,
    perWeek,
    bots: Object.fromEntries(ranked.map(([n, s]) => [n, s.hits])),
  });

  console.log(`\nCrawlers IA — ${client.brand}`);
  console.log(`  ${totalHits} visites sur ${span} jours (~${perWeek}/semaine)`);
  for (const [name, s] of ranked) console.log(`  ${name.padEnd(20)} ${String(s.hits).padStart(5)}`);
  if (totalHits === 0) console.log(`\n  ⛔ Aucun crawler IA — le site est invisible pour les moteurs.`);
  if (errors.length > 0) console.log(`  ⚠ ${errors.length} type(s) d'erreur servis aux robots`);
  console.log(`→ ${path}`);
}
