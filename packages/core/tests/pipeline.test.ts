import { beforeEach, describe, expect, it } from "vitest";
import { getDb, unwrap } from "../src/db";
import { resetMockDb } from "../src/mock/fakeDb";
import { runScan, createRescan } from "../src/scan/runScan";
import { ENGINES } from "../src/types";

process.env.GEO_MOCK = "1";
// Store isolé : les tests ne doivent pas écraser une démo en cours dans l'autre fichier
process.env.GEO_MOCK_STORE = `${process.env.TMPDIR || "/tmp"}/geo-test-${process.pid}.json`;

async function seedScan() {
  const db = getDb();
  return unwrap(
    await db
      .from("scans")
      .insert({
        brand: "Acme Solutions",
        url: "https://acme-solutions.fr",
        sector: "logiciel RH",
        competitors: [{ name: "PayFit" }, { name: "Lucca" }],
        lang: "fr",
      })
      .select("id")
      .single()
  ) as { id: string };
}

describe("pipeline complet (GEO_MOCK)", () => {
  beforeEach(() => resetMockDb());

  it("déroule un scan de bout en bout : requêtes → réponses → mentions → score", async () => {
    const { id } = await seedScan();
    await runScan(id);
    const db = getDb();
    const scan = unwrap(await db.from("scans").select("*").eq("id", id).single()) as any;

    expect(scan.status).toBe("done");
    expect(scan.progress).toBe(100);
    expect(scan.report_token).toBeTruthy();
    expect(scan.score).toBeGreaterThanOrEqual(0);
    expect(scan.score).toBeLessThanOrEqual(100);
    expect(scan.score_detail.byEngine).toHaveProperty("perplexity");
    expect(Object.keys(scan.share_of_voice.share)).toContain("PayFit");
    expect(scan.actions).toHaveLength(10);
    expect(scan.cost_cents).toBeGreaterThan(0);

    const queries = unwrap(await db.from("queries").select("*").eq("scan_id", id)) as any[];
    expect(queries.length).toBeGreaterThanOrEqual(20);
    const categories = new Set(queries.map((q) => q.category));
    expect(categories).toEqual(new Set(["comparative", "problem", "local", "trust"]));

    const responses = unwrap(await db.from("responses").select("*").eq("scan_id", id)) as any[];
    // Un moteur ajouté ne doit pas casser le test : on compte les moteurs déclarés.
    expect(responses.length).toBe(queries.length * ENGINES.length);

    const mentions = unwrap(await db.from("mentions").select("*").eq("scan_id", id)) as any[];
    expect(mentions.length).toBe(responses.length * 3); // marque cible + 2 concurrents

    // Perplexity fournit des citations (données du Chantier 3)
    const perplexityWithCitations = responses.filter((r: any) => r.engine === "perplexity" && r.citations.length > 0);
    expect(perplexityWithCitations.length).toBeGreaterThan(0);
  }, 60_000);

  it("un rescan réutilise strictement les mêmes requêtes", async () => {
    const { id } = await seedScan();
    await runScan(id);
    const rescanId = await createRescan(id);
    await runScan(rescanId);

    const db = getDb();
    const q1 = unwrap(await db.from("queries").select("*").eq("scan_id", id).order("position")) as any[];
    const q2 = unwrap(await db.from("queries").select("*").eq("scan_id", rescanId).order("position")) as any[];
    expect(q2.map((q) => q.text)).toEqual(q1.map((q) => q.text));

    const rescan = unwrap(await db.from("scans").select("*").eq("id", rescanId).single()) as any;
    expect(rescan.previous_scan_id).toBe(id);
    expect(rescan.status).toBe("done");
  }, 120_000);
});
