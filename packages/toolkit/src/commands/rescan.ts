import { createRescan, getDb, runScan, unwrap } from "@geo/core";
import { recordDeliverable, resolveClient } from "../lib/context.js";

/** Re-scan J+90 : mêmes requêtes que le scan initial, rapport avant/après. */
export async function rescan(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  if (!client.initial_scan_id) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);

  console.log(`Re-scan de ${client.brand} (mêmes requêtes que le scan initial)…`);
  const rescanId = await createRescan(client.initial_scan_id, client.id);
  const t0 = Date.now();
  await runScan(rescanId);

  const db = getDb();
  const result = unwrap(await db.from("scans").select("*").eq("id", rescanId).single()) as any;
  const initial = unwrap(await db.from("scans").select("score").eq("id", client.initial_scan_id).single()) as any;

  const webUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const reportUrl = `${webUrl}/rapport/${result.report_token}`;
  await recordDeliverable(client.id, "rescan_report", `Rapport J+90 (${initial.score} → ${result.score})`, null, { rescanId, reportUrl });

  console.log(`\n─── Re-scan terminé (${Math.round((Date.now() - t0) / 1000)}s, ${result.cost_cents} ct) ───`);
  console.log(`Score : ${initial.score} → ${result.score} (${result.score - initial.score >= 0 ? "+" : ""}${result.score - initial.score})`);
  console.log(`Rapport avant/après : ${reportUrl}`);
}
