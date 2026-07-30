/**
 * Validation Phase 1 : lancer un scan complet en CLI, sans UI.
 *
 *   pnpm --filter @geo/core scan:cli -- --brand "Acme" --url https://acme.fr \
 *     --sector "logiciel RH" --competitors "PayFit,Lucca" [--lang fr]
 */
import { getDb, unwrap } from "./db";
import { runScan } from "./scan/runScan";
import { ENGINE_LABELS, type EngineId } from "./types";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const brand = arg("brand");
  const url = arg("url");
  const sector = arg("sector");
  if (!brand || !url || !sector) {
    console.error('Usage: scan:cli -- --brand "X" --url https://x.fr --sector "..." [--competitors "A,B"] [--lang fr]');
    process.exit(1);
  }
  const competitors = (arg("competitors") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((name) => ({ name }));

  const db = getDb();
  const scan = unwrap(
    await db
      .from("scans")
      .insert({ brand, url, sector, competitors, lang: arg("lang") ?? "fr" })
      .select("id")
      .single()
  ) as { id: string };

  console.log(`Scan ${scan.id} créé — exécution…`);
  const t0 = Date.now();
  await runScan(scan.id);
  const result = unwrap(await db.from("scans").select("*").eq("id", scan.id).single()) as any;

  console.log(`\n─── Résultat (${Math.round((Date.now() - t0) / 1000)}s, ${result.cost_cents} ct) ───`);
  console.log(`Score de Visibilité IA : ${result.score}/100`);
  for (const [engine, s] of Object.entries(result.score_detail?.byEngine ?? {})) {
    console.log(`  ${ENGINE_LABELS[engine as EngineId]}: ${(s as any).score}/100 (${(s as any).mentionedCount}/${(s as any).responses} mentions)`);
  }
  console.log(`Part de voix :`);
  for (const [b, share] of Object.entries(result.share_of_voice?.share ?? {})) {
    console.log(`  ${b}: ${Math.round((share as number) * 100)} %`);
  }
  console.log(`\nRapport web : /rapport/${result.report_token}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
