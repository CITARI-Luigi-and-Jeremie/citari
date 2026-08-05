import { getDb, unwrap } from "@geo/core";
import { buildScanInsights } from "../lib/insights.js";
import { reponsesAuxObjections } from "../lib/reponses.js";
import { situationDuScan } from "../lib/emails.js";
import { slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Les réponses aux objections d'un prospect, remplies avec ses vrais chiffres.
 *
 * Une objection se traite dans l'heure ou ne se traite pas. Chercher le bon
 * argument, retrouver le bon chiffre dans le rapport, reformuler : c'est vingt
 * minutes à chaque fois, et c'est vingt minutes pendant lesquelles le prospect
 * attend. Ici tout est prêt, il reste à choisir et à adapter.
 *
 *   pnpm toolkit reponses luigi@cabinet-vaurel.fr
 */
export async function reponses(leadRef: string): Promise<void> {
  const db = getDb();

  const byId = await db.from("leads").select("*").eq("id", leadRef).maybeSingle();
  const lead =
    byId.data ??
    ((unwrap(await db.from("leads").select("*").ilike("email", leadRef)) as any[])[0] ??
      (unwrap(await db.from("leads").select("*").ilike("company", leadRef)) as any[])[0]);
  if (!lead) throw new Error(`Lead introuvable : « ${leadRef} » (id, email ou marque attendus).`);

  const i = await buildScanInsights(lead.scan_id);
  const liste = reponsesAuxObjections(i);

  const lignes = [
    `# Réponses aux objections — ${i.brand} (${lead.email})\n`,
    `Score ${i.score}/100 · situation **${situationDuScan(i)}** · cité ${i.citationsCible} fois contre ${i.citationsRivaux} pour ses concurrents comparables.\n`,
    `Ce sont des brouillons. Relisez, coupez, adaptez au ton de l'échange. Les chiffres, eux, sont exacts.\n`,
  ];

  for (const r of liste) {
    lignes.push(`## ${r.objection}\n`);
    lignes.push(`*${r.lecture}*\n`);
    lignes.push("```\n" + r.texte + "\n```\n");
  }

  const chemin = writeDeliverableFile(`relances/${slugify(i.brand)}`, "reponses-objections.md", lignes.join("\n"));

  console.log(`\n${liste.length} réponses préparées pour ${i.brand} (${lead.email}) :\n`);
  for (const r of liste) console.log(`  ${r.objection}`);
  console.log(`\n→ ${chemin}`);
}
