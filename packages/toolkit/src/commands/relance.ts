import { getDb, unwrap } from "@geo/core";
import { EMAIL_A_TROUVER } from "../lib/prospect.js";
import { buildScanInsights } from "../lib/insights.js";
import { tousLesEmails, situationDuScan } from "../lib/emails.js";
import { slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Prépare les quatre emails d'un lead : celui qui part à la fin du scan, puis
 * les trois relances de rattrapage.
 *
 * La rédaction vit dans `lib/emails.ts`, cette commande ne fait que la brancher
 * sur la base : elle lit le scan, produit les messages, les enregistre comme
 * brouillons dans `follow_ups`, et écrit un fichier lisible pour relecture.
 *
 * Rien n'est envoyé ici. L'envoi se fait depuis l'admin, une fois relu.
 */
export async function relance(leadRef: string, opts: { all?: boolean } = {}): Promise<void> {
  const db = getDb();

  const bruts = opts.all
    ? ((unwrap(await db.from("leads").select("*").eq("status", "nouveau")) as any[]))
    : await resolveLeads(leadRef);

  // Garde-fou : les prospects issus du baromètre portent une adresse fictive
  // (« @barometre.local ») tant que le vrai contact n'a pas été trouvé. Leur
  // statut suffit normalement à les écarter, mais une relance envoyée à une
  // adresse inventée est une erreur qu'on ne peut pas rattraper : on la bloque
  // ici aussi, quel que soit le statut.
  const leads = bruts.filter((l: any) => !String(l.email ?? "").endsWith(EMAIL_A_TROUVER));
  const ecartes = bruts.length - leads.length;
  if (ecartes > 0) {
    console.log(`${ecartes} prospect(s) sans email réel écarté(s) : trouvez le contact avant de relancer.`);
  }

  if (leads.length === 0) {
    console.log("Aucun lead à relancer (statut « nouveau » et email réel requis).");
    return;
  }

  for (const lead of leads) {
    const insights = await buildScanInsights(lead.scan_id);
    const emails = tousLesEmails(insights);
    const createdAt = new Date(lead.created_at ?? Date.now());

    const lines = [
      `# Emails — ${insights.brand} (${lead.email})\n`,
      `Score ${insights.score}/100 · situation détectée : **${situationDuScan(insights)}**\n`,
    ];

    for (const e of emails) {
      const due = new Date(createdAt.getTime() + e.offsetDays * 86400_000).toISOString().slice(0, 10);

      // Ne jamais réécrire un message déjà préparé : il a pu être relu, corrigé
      // à la main dans l'admin, voire envoyé.
      const { data: existing } = await db
        .from("follow_ups")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("step", e.step)
        .maybeSingle();
      if (!existing) {
        unwrap(
          await db
            .from("follow_ups")
            .insert({ lead_id: lead.id, step: e.step, subject: e.subject, body: e.body, due_on: due })
            .select("id")
        );
      }

      const quand = e.step === 0 ? "à envoyer dès maintenant" : `à envoyer le ${new Date(due).toLocaleDateString("fr-FR")}`;
      lines.push(`## Email ${e.step} — ${quand}\n`);
      lines.push(`**Objet :** ${e.subject}\n`);
      lines.push("```\n" + e.body + "\n```\n");
    }

    const path = writeDeliverableFile(`relances/${slugify(insights.brand)}`, "emails.md", lines.join("\n"));
    console.log(`✓ ${insights.brand} (${lead.email}) — ${situationDuScan(insights)} · ${emails.length} emails · ${path}`);
  }

  console.log(`\n${leads.length} lead(s) traité(s). Relisez dans l'admin avant d'envoyer.`);
}

async function resolveLeads(ref: string): Promise<any[]> {
  const db = getDb();
  const byId = await db.from("leads").select("*").eq("id", ref).maybeSingle();
  if (byId.data) return [byId.data];
  const byEmail = unwrap(await db.from("leads").select("*").ilike("email", ref)) as any[];
  if (byEmail.length > 0) return byEmail;
  const byBrand = unwrap(await db.from("leads").select("*").ilike("company", ref)) as any[];
  if (byBrand.length === 0) throw new Error(`Lead introuvable : "${ref}" (id, email ou marque attendus).`);
  return byBrand;
}
