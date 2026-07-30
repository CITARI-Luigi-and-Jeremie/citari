import * as cheerio from "cheerio";

export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
];

export interface PageAudit {
  url: string;
  status: number;
  responseMs: number;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  headings: { level: number; text: string }[];
  hnIssues: string[];
  jsonLd: { types: string[]; raw: unknown }[];
  jsonLdErrors: number;
  wordCount: number;
}

export function normalizeBase(url: string): string {
  const u = new URL(url.startsWith("http") ? url : `https://${url}`);
  return u.origin;
}

async function timedFetch(url: string): Promise<{ res: Response | null; ms: number }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOSprintAudit/1.0)" },
      redirect: "follow",
    });
    return { res, ms: Date.now() - t0 };
  } catch {
    return { res: null, ms: Date.now() - t0 };
  }
}

export async function fetchText(url: string): Promise<string | null> {
  const { res } = await timedFetch(url);
  if (!res || !res.ok) return null;
  return res.text();
}

/** Analyse robots.txt : quels crawlers IA sont bloqués ? */
export function analyzeRobots(robotsTxt: string | null): { exists: boolean; blockedAiBots: string[]; blocksAll: boolean } {
  if (robotsTxt == null) return { exists: false, blockedAiBots: [], blocksAll: false };
  const blocked: string[] = [];
  let currentAgents: string[] = [];
  let blocksAll = false;
  for (const line of robotsTxt.split("\n")) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      currentAgents.push(value);
    } else if (key === "disallow" && value === "/") {
      for (const agent of currentAgents) {
        if (agent === "*") blocksAll = true;
        const match = AI_CRAWLERS.find((b) => b.toLowerCase() === agent.toLowerCase());
        if (match) blocked.push(match);
      }
      currentAgents = [];
    } else if (key === "allow" || key === "disallow") {
      currentAgents = [];
    }
  }
  return { exists: true, blockedAiBots: [...new Set(blocked)], blocksAll };
}

export function auditHtml(url: string, html: string, status: number, responseMs: number): PageAudit {
  const $ = cheerio.load(html);
  const headings: { level: number; text: string }[] = [];
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    headings.push({ level: Number(el.tagName[1]), text: $(el).text().trim().slice(0, 120) });
  });

  const hnIssues: string[] = [];
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) hnIssues.push("aucun H1");
  if (h1Count > 1) hnIssues.push(`${h1Count} H1 (il en faut un seul)`);
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1]!.level;
    const cur = headings[i]!.level;
    if (cur > prev + 1) {
      hnIssues.push(`saut de niveau H${prev} → H${cur} (« ${headings[i]!.text.slice(0, 40)} »)`);
      break;
    }
  }

  const jsonLd: PageAudit["jsonLd"] = [];
  let jsonLdErrors = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const items = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
      const types = (Array.isArray(items) ? items : [items])
        .map((x: any) => x?.["@type"])
        .flat()
        .filter(Boolean);
      jsonLd.push({ types, raw: parsed });
    } catch {
      jsonLdErrors++;
    }
  });

  return {
    url,
    status,
    responseMs,
    title: $("title").first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr("content")?.trim() ?? null,
    h1Count,
    headings,
    hnIssues,
    jsonLd,
    jsonLdErrors,
    wordCount: $("body").text().replace(/\s+/g, " ").trim().split(" ").length,
  };
}

/** Crawle home + pages principales (sitemap si dispo, sinon liens internes de la home). */
export async function crawlSite(inputUrl: string, maxPages = 8): Promise<{
  base: string;
  robots: ReturnType<typeof analyzeRobots>;
  llmsTxtExists: boolean;
  pages: PageAudit[];
  sitemapUsed: boolean;
}> {
  const base = normalizeBase(inputUrl);
  const robots = analyzeRobots(await fetchText(`${base}/robots.txt`));
  const llmsTxtExists = (await fetchText(`${base}/llms.txt`)) != null;

  let urls: string[] = [base];
  let sitemapUsed = false;
  const sitemap = await fetchText(`${base}/sitemap.xml`);
  if (sitemap) {
    const locs = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]!.trim());
    const sameHost = locs.filter((u) => u.startsWith(base));
    if (sameHost.length > 0) {
      urls = [base, ...sameHost.filter((u) => u !== base && u !== `${base}/`)].slice(0, maxPages);
      sitemapUsed = true;
    }
  }

  const pages: PageAudit[] = [];
  for (const url of urls) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOSprintAudit/1.0)" },
      });
      const ms = Date.now() - t0;
      const html = await res.text();
      pages.push(auditHtml(url, html, res.status, ms));
      // Sans sitemap : compléter avec les liens internes de la home
      if (!sitemapUsed && url === base && urls.length === 1) {
        const $ = cheerio.load(html);
        const links = new Set<string>();
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          try {
            const abs = new URL(href, base);
            if (abs.origin === base && abs.pathname !== "/" && !abs.pathname.match(/\.(png|jpe?g|svg|pdf|zip|css|js)$/i)) {
              links.add(abs.origin + abs.pathname);
            }
          } catch { /* href invalide */ }
        });
        urls.push(...[...links].slice(0, maxPages - 1));
      }
    } catch (e) {
      pages.push({
        url, status: 0, responseMs: Date.now() - t0, title: null, metaDescription: null,
        h1Count: 0, headings: [], hnIssues: ["page inaccessible"], jsonLd: [], jsonLdErrors: 0, wordCount: 0,
      });
    }
  }

  return { base, robots, llmsTxtExists, pages, sitemapUsed };
}
