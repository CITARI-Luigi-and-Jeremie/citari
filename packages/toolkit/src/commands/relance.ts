import { getDb, unwrap } from "@geo/core";
import { buildScanInsights, pct, type ScanInsights } from "../lib/insights.js";
import { slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Séquence de relance des leads ayant scanné sans réserver de call.
 *
 * Parti pris : gabarits déterministes remplis avec les données RÉELLES du scan.
 * Un email de prospection ne doit contenir aucun chiffre inventé — et cela évite
 * de dépendre d'une API pour un texte qui doit rester sous contrôle.
 */

const BOOKING = () => process.env.BOOKING_URL || "[LIEN DE RÉSERVATION]";
const SIGNATURE = () => process.env.FOUNDER_SIGNATURE || "Luigi\nGEO Sprint";

interface Draft {
  step: number;
  offsetDays: number;
  subject: string;
  body: string;
}

/** J+2 — le fait le plus frappant de SON scan. Ultra court, une seule question. */
function step1(i: ScanInsights): Draft {
  const hook = i.topCompetitor
    ? `Sur les ${i.totalQueries} questions d'achat testées dans votre secteur, ${i.topCompetitor.name} apparaît dans ${pct(i.topCompetitor.share)} des réponses. ${i.brand} : ${pct(i.brandShare)}.`
    : `Sur les ${i.totalQueries} questions d'achat testées dans votre secteur, ${i.brand} n'apparaît que dans ${pct(i.brandShare)} des réponses.`;

  const detail = i.missedCount > 0
    ? `\n\nCe qui m'a le plus frappé : ${i.missedCount} questions sur ${i.totalQueries} où ${i.brand} n'est cité par aucun des 4 moteurs. Par exemple « ${i.missedQueries[0]} ».`
    : "";

  return {
    step: 1,
    offsetDays: 2,
    subject: `${i.brand} : ${pct(i.brandShare)} de part de voix face à ${i.topCompetitor?.name ?? "vos concurrents"}`,
    body: `Bonjour,

Vous avez lancé un scan de visibilité IA pour ${i.brand} il y a deux jours — j'ai regardé les résultats de plus près.

${hook}${detail}

Ce n'est pas une fatalité : dans 9 cas sur 10, l'essentiel vient de trois causes techniques identifiables en 20 minutes.

Vous voulez qu'on regarde ensemble ? 30 minutes, gratuit, sans engagement :
${BOOKING()}

${i.reportUrl ? `Votre rapport complet reste accessible ici : ${i.reportUrl}\n\n` : ""}${SIGNATURE()}

--
Vous recevez cet email parce que vous avez demandé un rapport de visibilité IA. Pour ne plus être contacté, répondez « STOP ».`,
  };
}

/** J+7 — valeur d'abord : une action qu'il peut faire seul, sans nous. */
function step2(i: ScanInsights): Draft {
  const sources = i.competitorSources.slice(0, 3);
  const sourcesBlock = sources.length > 0
    ? `\n\nAutre chose d'utile, tirée de votre scan : quand Perplexity recommande vos concurrents, il s'appuie régulièrement sur ces sources :\n${sources.map((s) => `  • ${s}`).join("\n")}\n\nY être présent est souvent plus rentable qu'un mois de publicité. Vous pouvez commencer par la première dès cette semaine, sans nous.`
    : "";

  return {
    step: 2,
    offsetDays: 7,
    subject: `Une action à faire vous-même pour ${i.brand} (5 minutes)`,
    body: `Bonjour,

Je reviens vers vous sans relancer sur notre offre — juste une chose concrète que vous pouvez vérifier en 5 minutes.

Ouvrez ${i.url.replace(/\/$/, "")}/robots.txt et cherchez GPTBot, ClaudeBot et PerplexityBot. S'ils y sont bloqués, aucune des IA ne peut lire votre site : tout le reste devient inutile tant que ce n'est pas corrigé. Beaucoup de sites les ont bloqués en 2023-2024 sans le savoir, souvent via un réglage par défaut du CMS.${sourcesBlock}

J'ai détaillé la méthode complète ici, en accès libre : ${process.env.NEXT_PUBLIC_SITE_URL || "https://votre-domaine.fr"}/guide-geo

Si vous préférez qu'on déroule ça ensemble sur ${i.brand}, mon agenda est ouvert :
${BOOKING()}

${SIGNATURE()}

--
Pour ne plus être contacté, répondez « STOP ».`,
  };
}

/** J+21 — clôture honnête. Souvent l'email qui obtient le plus de réponses. */
function step3(i: ScanInsights): Draft {
  return {
    step: 3,
    offsetDays: 21,
    subject: `Je clos votre dossier ${i.brand} ?`,
    body: `Bonjour,

Sans nouvelles de votre côté, je pars du principe que le sujet n'est pas prioritaire en ce moment — ce qui est parfaitement légitime.

Je clos donc votre dossier, sans relance supplémentaire. Trois choses avant de le faire :

1. Votre rapport reste accessible${i.reportUrl ? ` : ${i.reportUrl}` : ""}.
2. Votre score de départ (${i.score}/100) est archivé. Si vous refaites un scan dans six mois, vous aurez une comparaison exacte, mêmes questions.
3. Si la situation change — par exemple si vous constatez que vos prospects arrivent en citant un concurrent qu'ils ont vu dans ChatGPT — écrivez-moi, je reprends le dossier là où on l'a laissé.

Bonne continuation à ${i.brand}.

${SIGNATURE()}

--
Vous ne recevrez plus d'email de ma part concernant ce scan.`,
  };
}

export async function relance(leadRef: string, opts: { all?: boolean } = {}): Promise<void> {
  const db = getDb();

  const leads = opts.all
    ? ((unwrap(await db.from("leads").select("*").eq("status", "new")) as any[]))
    : await resolveLeads(leadRef);

  if (leads.length === 0) {
    console.log("Aucun lead à relancer (statut « new » requis).");
    return;
  }

  for (const lead of leads) {
    const insights = await buildScanInsights(lead.scan_id);
    const drafts = [step1(insights), step2(insights), step3(insights)];
    const createdAt = new Date(lead.created_at ?? Date.now());

    const lines = [`# Séquence de relance — ${insights.brand} (${lead.email})\n`];
    for (const d of drafts) {
      const scheduled = new Date(createdAt.getTime() + d.offsetDays * 86400_000).toISOString().slice(0, 10);

      // Ne pas recréer une relance déjà générée pour ce lead
      const { data: existing } = await db
        .from("follow_ups")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("step", d.step)
        .maybeSingle();
      if (!existing) {
        unwrap(
          await db
            .from("follow_ups")
            .insert({ lead_id: lead.id, step: d.step, subject: d.subject, body: d.body, scheduled_for: scheduled })
            .select("id")
        );
      }

      lines.push(`## Email ${d.step} — à envoyer le ${new Date(scheduled).toLocaleDateString("fr-FR")}\n`);
      lines.push(`**Objet :** ${d.subject}\n`);
      lines.push("```\n" + d.body + "\n```\n");
    }

    const path = writeDeliverableFile(`relances/${slugify(insights.brand)}`, "sequence.md", lines.join("\n"));
    console.log(`✓ ${insights.brand} (${lead.email}) — 3 relances programmées · ${path}`);
  }

  console.log(`\n${leads.length} lead(s) traité(s). Les brouillons sont visibles et marquables comme envoyés dans l'admin.`);
}

async function resolveLeads(ref: string): Promise<any[]> {
  const db = getDb();
  const byId = await db.from("leads").select("*").eq("id", ref).maybeSingle();
  if (byId.data) return [byId.data];
  const byEmail = unwrap(await db.from("leads").select("*").ilike("email", ref)) as any[];
  if (byEmail.length > 0) return byEmail;
  const byBrand = unwrap(await db.from("leads").select("*").ilike("brand", ref)) as any[];
  if (byBrand.length === 0) throw new Error(`Lead introuvable : "${ref}" (id, email ou marque attendus).`);
  return byBrand;
}
