import { getDb, unwrap } from "@geo/core";
import { relance } from "./relance.js";
import { buildScanInsights } from "../lib/insights.js";
import { situationDuScan, tousLesEmails } from "../lib/emails.js";
import {
  decisionEnvoi,
  envoyerParResend,
  relireRobots,
  type LeadEnvoi,
  type RelanceEnvoi,
} from "../lib/envoi.js";

/**
 * Le facteur : envoie ce qui est dû, et rien d'autre.
 *
 * `pnpm toolkit envoyer` est une SIMULATION : elle affiche exactement ce qui
 * partirait, à qui, et pourquoi le reste ne part pas. Rien ne quitte la
 * machine sans `--vraiment`. Un email raté ne se rattrapant pas, le geste
 * d'envoi doit être un geste volontaire, jamais un effet de bord.
 *
 * Ce que fait un passage :
 *
 *   1. Prépare les brouillons des leads « nouveau » qui n'en ont pas encore
 *      (même chemin que `pnpm toolkit relance --all`).
 *   2. Pour chaque relance due : applique les refus de `decisionEnvoi`
 *      (désinscrit, converti, périmé, lien localhost...).
 *   3. Pour une relance « bloqué » : RELIT le robots.txt du prospect en
 *      direct. S'il a corrigé entre-temps, le brouillon est devenu faux ;
 *      on le régénère depuis la situation actuelle au lieu de l'envoyer.
 *   4. Envoie par Resend, marque `sent_at`, passe le lead en « relance ».
 *
 * À lancer chaque matin tant qu'il n'y a pas de cron ; sur le VPS, un cron
 * toutes les 10 minutes rendra le mail 0 quasi immédiat après le scan.
 */
export async function envoyer(opts: { vraiment?: boolean; limite?: string } = {}): Promise<void> {
  const db = getDb();
  const envoiReel = Boolean(opts.vraiment);
  const limite = Math.max(1, Number(opts.limite ?? 50) || 50);

  if (!envoiReel) {
    console.log("MODE SIMULATION — rien ne part. Relisez, puis relancez avec --vraiment.\n");
  }

  // 1. Les brouillons manquants d'abord : un scan fini hier sans relance
  // préparée est exactement ce que cette commande doit rattraper.
  await relance("", { all: true }).catch((e) => {
    console.log(`Préparation des brouillons : ${e instanceof Error ? e.message : e}`);
  });

  // 2. Tout ce qui est dû, avec le lead porteur.
  const aujourdHui = new Date();
  const dues = unwrap(
    await db
      .from("follow_ups")
      .select("id, lead_id, step, due_on, subject, body, sent_at, cancelled")
      .is("sent_at", null)
      .eq("cancelled", false)
      .lte("due_on", aujourdHui.toISOString().slice(0, 10))
      .order("due_on")
      .limit(limite),
  ) as (RelanceEnvoi & { lead_id: string })[];

  if (dues.length === 0) {
    console.log("Rien à envoyer aujourd'hui.");
    return;
  }

  let envoyes = 0;
  let refuses = 0;
  let regeneres = 0;

  for (const due of dues) {
    const lead = (unwrap(
      await db
        .from("leads")
        .select("id, email, status, unsubscribed_at, converted, scan_id, company")
        .eq("id", due.lead_id)
        .limit(1),
    ) as (LeadEnvoi & { scan_id: string | null; company: string | null })[])[0];
    if (!lead) continue;

    const decision = decisionEnvoi(due, lead, aujourdHui);
    if (!decision.ok) {
      refuses += 1;
      console.log(`  ✗ ${lead.email} · email ${due.step} — ${decision.raison}`);
      // Un refus définitif (périmé, désinscrit, converti) annule le brouillon
      // pour qu'il ne revienne pas à chaque passage. Un refus temporaire
      // (pas encore dû, configuration manquante) le laisse en place.
      if (/périmé|désinscrit|déjà client|statut/.test(decision.raison)) {
        await db.from("follow_ups").update({ cancelled: true }).eq("id", due.id);
      }
      continue;
    }

    // 3. La revérification qui empêche d'envoyer un fait périmé : si le
    // brouillon parle d'un robots.txt bloquant, on relit le site MAINTENANT.
    if (due.step > 0 && lead.scan_id && /robots\.txt/i.test(due.body ?? "")) {
      const insights = await buildScanInsights(lead.scan_id);
      if (insights.url && insights.botsBloques.length > 0) {
        const etat = await relireRobots(insights.url);
        if (etat.joignable && etat.botsBloques.length === 0) {
          regeneres += 1;
          console.log(
            `  ↻ ${lead.email} · email ${due.step} — robots.txt corrigé depuis le scan, brouillon régénéré`,
          );
          // La situation a changé : les brouillons restants sont réécrits
          // depuis les données actuelles (mêmes chiffres de scan, mais sans
          // l'argument technique devenu faux).
          const corriges = { ...insights, botsBloques: [] };
          const nouveaux = tousLesEmails(corriges);
          const remplacant = nouveaux.find((e) => e.step === due.step);
          if (remplacant) {
            await db
              .from("follow_ups")
              .update({ subject: remplacant.subject, body: remplacant.body })
              .eq("id", due.id);
            due.subject = remplacant.subject;
            due.body = remplacant.body;
          } else {
            // La nouvelle situation ne prévoit pas ce step (ex. devenue
            // « solide ») : on annule au lieu d'envoyer.
            await db.from("follow_ups").update({ cancelled: true }).eq("id", due.id);
            console.log(`    situation devenue « ${situationDuScan(corriges)} » : relance annulée`);
            continue;
          }
        }
      }
    }

    const apercu = (due.subject ?? "").slice(0, 64);
    if (!envoiReel) {
      envoyes += 1;
      console.log(`  → ${lead.email} · email ${due.step} — « ${apercu} » (simulation)`);
      continue;
    }

    // 4. L'envoi réel.
    const resultat = await envoyerParResend({
      to: lead.email,
      subject: due.subject as string,
      text: due.body as string,
    });
    if (resultat.erreur) {
      console.log(`  ✗ ${lead.email} · email ${due.step} — ÉCHEC : ${resultat.erreur}`);
      continue;
    }
    envoyes += 1;
    await db.from("follow_ups").update({ sent_at: new Date().toISOString() }).eq("id", due.id);
    if (lead.status === "nouveau") {
      await db.from("leads").update({ status: "relance" }).eq("id", lead.id);
    }
    console.log(`  ✓ ${lead.email} · email ${due.step} — « ${apercu} » (id ${resultat.id})`);
  }

  console.log(
    `\n${envoiReel ? "Envoyés" : "Prêts à partir"} : ${envoyes} · refusés : ${refuses} · régénérés : ${regeneres}`,
  );
  if (!envoiReel && envoyes > 0) {
    console.log(`Pour envoyer pour de vrai : pnpm toolkit envoyer --vraiment`);
  }
}
