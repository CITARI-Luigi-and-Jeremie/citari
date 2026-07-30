import { describe, expect, it } from "vitest";
import { analyzeRobots, auditHtml, normalizeBase } from "../src/lib/crawl.js";

describe("normalizeBase", () => {
  it("normalise avec ou sans protocole", () => {
    expect(normalizeBase("acme.fr")).toBe("https://acme.fr");
    expect(normalizeBase("http://acme.fr/page?x=1")).toBe("http://acme.fr");
  });
});

describe("analyzeRobots", () => {
  it("absent → exists false", () => {
    expect(analyzeRobots(null)).toEqual({ exists: false, blockedAiBots: [], blocksAll: false });
  });

  it("détecte les crawlers IA bloqués", () => {
    const robots = `User-agent: GPTBot\nDisallow: /\n\nUser-agent: PerplexityBot\nDisallow: /\n\nUser-agent: *\nAllow: /`;
    const r = analyzeRobots(robots);
    expect(r.blockedAiBots).toContain("GPTBot");
    expect(r.blockedAiBots).toContain("PerplexityBot");
    expect(r.blocksAll).toBe(false);
  });

  it("détecte le blocage global", () => {
    expect(analyzeRobots("User-agent: *\nDisallow: /").blocksAll).toBe(true);
  });

  it("groupes multi-agents : tous les agents du bloc sont bloqués", () => {
    const r = analyzeRobots("User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /");
    expect(r.blockedAiBots).toEqual(expect.arrayContaining(["GPTBot", "ClaudeBot"]));
  });

  it("Disallow partiel ne compte pas comme blocage", () => {
    expect(analyzeRobots("User-agent: GPTBot\nDisallow: /admin").blockedAiBots).toEqual([]);
  });
});

describe("auditHtml", () => {
  const html = `<html><head>
    <title>Acme — logiciel RH</title>
    <meta name="description" content="La paie simplifiée pour PME.">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Acme"}</script>
    <script type="application/ld+json">{invalid json</script>
  </head><body>
    <h1>Logiciel de paie</h1><h2>Fonctionnalités</h2><h4>Détail</h4>
    <p>Contenu de la page avec quelques mots.</p>
  </body></html>`;

  it("extrait titre, meta, JSON-LD et détecte les problèmes", () => {
    const a = auditHtml("https://acme.fr", html, 200, 350);
    expect(a.title).toBe("Acme — logiciel RH");
    expect(a.metaDescription).toBe("La paie simplifiée pour PME.");
    expect(a.h1Count).toBe(1);
    expect(a.jsonLd).toHaveLength(1);
    expect(a.jsonLd[0]!.types).toContain("Organization");
    expect(a.jsonLdErrors).toBe(1);
    expect(a.hnIssues.some((i) => i.includes("H2 → H4"))).toBe(true);
  });

  it("signale l'absence de H1", () => {
    const a = auditHtml("https://x.fr", "<html><body><h2>Titre</h2></body></html>", 200, 100);
    expect(a.hnIssues).toContain("aucun H1");
  });
});
