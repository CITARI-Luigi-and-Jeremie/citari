import { getDb, unwrap } from "@geo/core";
import { buildScanInsights, pct } from "../lib/insights.js";
import { recordDeliverable, slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Proposition commerciale post-call, construite à partir des données réelles du scan.
 * Déterministe : le prix, les livrables et les engagements ne doivent jamais varier
 * au gré d'un modèle. Seul le diagnostic est personnalisé, avec des faits vérifiables.
 */

interface Offer {
  name: string;
  price: string;
  contents: number;
  citations: number;
  extras: string[];
}

const OFFERS: Record<string, Offer> = {
  sprint: {
    name: "Sprint GEO",
    price: "2 900 €",
    contents: 5,
    citations: 8,
    extras: [],
  },
  domination: {
    name: "Sprint Domination",
    price: "4 900 €",
    contents: 10,
    citations: 15,
    extras: [
      "Couverture élargie : 2 langues ou 2 segments de marché",
      "Campagne presse approfondie (pitchs personnalisés + relances gérées)",
      "Session stratégique dédiée de 90 minutes en fin de sprint",
    ],
  },
};

export async function proposition(ref: string, opts: { offer?: string } = {}): Promise<void> {
  const db = getDb();
  const offer = OFFERS[opts.offer ?? "sprint"];
  if (!offer) throw new Error(`Offre inconnue : "${opts.offer}". Valeurs possibles : sprint, domination.`);

  const { scanId, contactName, clientId } = await resolveTarget(ref);
  const i = await buildScanInsights(scanId);
  const slug = slugify(i.brand);

  const today = new Date();
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR");
  const plus = (n: number) => new Date(today.getTime() + n * 86400_000);

  const gapLine = i.topCompetitor
    ? `${i.topCompetitor.name} occupe ${pct(i.topCompetitor.share)} de la part de voix du secteur, contre ${pct(i.brandShare)} pour ${i.brand}.`
    : `${i.brand} occupe ${pct(i.brandShare)} de la part de voix mesurée sur votre secteur.`;

  const md = `# Proposition — Sprint GEO pour ${i.brand}

**Établie le ${fmt(today)}**${contactName ? `\n**À l'attention de :** ${contactName}` : ""}
**Validité : 30 jours**

---

## 1. Votre situation, mesurée

Nous avons interrogé ChatGPT, Claude, Gemini et Perplexity sur **${i.totalQueries} questions d'intention d'achat** de votre secteur (${i.sector}), via leurs API officielles.

| Indicateur | Valeur |
|---|---|
| Score de Visibilité IA | **${i.score}/100** (${i.scoreLabel}) |
| Part de voix | ${pct(i.brandShare)} |
| Questions où ${i.brand} n'apparaît jamais | **${i.missedCount} sur ${i.totalQueries}** |
| Moteur le plus faible | ${i.weakestEngine ? `${i.weakestEngine.label} (${i.weakestEngine.score}/100)` : "—"} |
| Moteur le plus favorable | ${i.bestEngine ? `${i.bestEngine.label} (${i.bestEngine.score}/100)` : "—"} |

${gapLine}

${i.killerQuote
  ? `### Ce que répond l'IA aujourd'hui

Question posée à ${i.killerQuote.engine} : « ${i.killerQuote.query} »

> ${i.killerQuote.excerpt.replace(/\n+/g, " ")}

${i.killerQuote.competitor} est recommandé. ${i.brand} n'est pas mentionné.`
  : ""}

${i.missedCount > 0
  ? `### Les questions où vous êtes absent

${i.missedQueries.slice(0, 8).map((q) => `- « ${q} »`).join("\n")}

Ce sont des questions posées par des acheteurs en phase de décision. Chacune est une recommandation qui va à un concurrent.`
  : ""}

---

## 2. Ce que nous ferons — 30 jours, 3 chantiers

### Chantier 1 · Technique — rendre le site lisible par les IA
- Audit technique complet de ${i.url}
- Correction du \`robots.txt\` : autorisation explicite de GPTBot, ClaudeBot, PerplexityBot, Google-Extended et des autres crawlers IA
- Rédaction et pose d'un fichier \`llms.txt\`
- Balisage schema.org des pages clés (Organization, Service, FAQPage${i.sector.match(/BTP|Santé|Restaur|Hôtel|Immobilier/i) ? ", LocalBusiness" : ""})
- Restructuration des pages principales en format « réponse directe »

**Livrables :** rapport d'audit, fichiers prêts à poser, document de spécifications pour votre développeur si nous n'avons pas d'accès direct.

### Chantier 2 · Contenu — créer les pages que les IA citent
- **${offer.contents} contenus** rédigés et livrés, ciblés sur les questions ci-dessus où vous êtes absent
- Formats : comparatifs « ${i.brand} vs ${i.topCompetitor?.name ?? "concurrent"} », pages « alternatives à », FAQ métier balisée, guides d'achat factuels
- Chaque contenu est chiffré, structuré, avec son balisage schema.org intégré
- Validation des sujets avec vous avant rédaction, relecture de votre côté avant publication

**Livrables :** briefs validés, contenus en Markdown et HTML prêts à intégrer.

### Chantier 3 · Citations externes — faire parler de vous ailleurs
- Identification des sources sur lesquelles les moteurs s'appuient pour recommander vos concurrents${i.competitorSources.length > 0 ? ` — déjà repérées dans votre scan : ${i.competitorSources.slice(0, 4).join(", ")}` : ""}
- **${offer.citations} cibles prioritaires** : annuaires et comparateurs sectoriels, presse spécialisée, fiches (Google Business, Wikidata si éligible)
- Inscriptions réalisées, pitchs presse rédigés et envoyés, relances assurées

**Livrables :** liste priorisée avec statut de chaque cible, brouillons d'emails de pitch, suivi des obtentions.
${offer.extras.length > 0 ? `\n### Inclus dans ${offer.name}\n${offer.extras.map((e) => `- ${e}`).join("\n")}\n` : ""}
---

## 3. Calendrier

| Semaine | Dates | Contenu |
|---|---|---|
| 1 | ${fmt(today)} → ${fmt(plus(7))} | Call de cadrage, audit technique, correctifs posés, sujets de contenu validés |
| 2 | ${fmt(plus(7))} → ${fmt(plus(14))} | Premiers contenus livrés, plan de citations lancé |
| 3 | ${fmt(plus(14))} → ${fmt(plus(21))} | Contenus restants, pitchs presse envoyés |
| 4 | ${fmt(plus(21))} → ${fmt(plus(30))} | Relances, vérification technique finale, rapport de fin de sprint |
| J+90 | ${fmt(plus(90))} | **Re-scan offert** : mêmes questions, rapport avant/après |

---

## 4. Prix et conditions

**${offer.name} — ${offer.price}** (paiement unique, HT)

- 50 % à la commande, 50 % à la livraison du rapport de fin de sprint
- Re-scan J+90 inclus, sans supplément
- Aucun abonnement, aucun engagement de durée
- Nous limitons volontairement notre activité à **3 sprints par mois** pour garantir l'exécution

### Ce que nous garantissons, et ce que nous ne garantissons pas

**Nous garantissons** la livraison intégrale des actions listées ci-dessus, documentées une par une dans le rapport de fin de sprint.

**Nous ne garantissons pas** un score précis à une date précise. Les moteurs d'IA intègrent les changements en 4 à 12 semaines et leurs réponses varient par nature. Quiconque vous promet « la première place dans ChatGPT » vous vend quelque chose qu'il ne contrôle pas.

**Ce que nous garantissons en revanche, c'est la mesure** : le re-scan à J+90 rejoue exactement les mêmes ${i.totalQueries} questions, sur les mêmes moteurs, avec la même méthode de calcul. Vous verrez la progression réelle, quelle qu'elle soit.

---

## 5. Pour démarrer

Un simple retour par email sur cette proposition suffit. Nous planifions ensuite le call de cadrage sous 5 jours ouvrés et le sprint démarre.

${i.reportUrl ? `Votre rapport de scan complet : ${i.reportUrl}\n` : ""}
Des questions avant de décider ? Répondez à cet email, je réponds sous 24 h.

---

*Proposition établie le ${fmt(today)} · Validité 30 jours · Citari*
`;

  const html = `<article style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:760px;margin:0 auto;line-height:1.6;color:#0f172a">
${md
  .replace(/^# (.+)$/gm, '<h1 style="font-size:28px">$1</h1>')
  .replace(/^## (.+)$/gm, '<h2 style="font-size:22px;margin-top:32px">$1</h2>')
  .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;margin-top:20px">$1</h3>')
  .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">')
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/^> (.+)$/gm, '<blockquote style="border-left:4px solid #4f46e5;padding-left:16px;color:#475569;margin:16px 0">$1</blockquote>')
  .replace(/^- (.+)$/gm, "<li>$1</li>")
  .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
  .replace(/\n{2,}/g, "</p><p>")}
</article>`;

  const mdPath = writeDeliverableFile(`propositions/${slug}`, `proposition-${offer.name.toLowerCase().replace(/\s+/g, "-")}.md`, md);
  const htmlPath = writeDeliverableFile(`propositions/${slug}`, `proposition-${offer.name.toLowerCase().replace(/\s+/g, "-")}.html`, html);

  if (clientId) {
    await recordDeliverable(clientId, "proposition", `Proposition ${offer.name} (${offer.price})`, mdPath, { offer: offer.name });
  }

  console.log(`\nProposition ${offer.name} — ${i.brand}`);
  console.log(`  Score de départ : ${i.score}/100 · ${i.missedCount}/${i.totalQueries} questions sans mention`);
  console.log(`  Prix : ${offer.price} · ${offer.contents} contenus · ${offer.citations} cibles de citation`);
  console.log(`→ ${mdPath}`);
  console.log(`→ ${htmlPath}`);
  console.log(`\n⚠ Relire avant envoi : vérifier le nom du contact et adapter le mot d'introduction.`);
}

/** Accepte un id/email de lead, un nom de client, ou un id de scan. */
async function resolveTarget(ref: string): Promise<{ scanId: string; contactName: string | null; clientId: string | null }> {
  const db = getDb();

  const client = await db.from("clients").select("*").ilike("brand", ref).maybeSingle();
  if (client.data?.initial_scan_id) {
    return { scanId: client.data.initial_scan_id, contactName: client.data.contact_name ?? null, clientId: client.data.id };
  }

  for (const col of ["id", "email", "brand"] as const) {
    const q = col === "id" ? db.from("leads").select("*").eq("id", ref) : db.from("leads").select("*").ilike(col, ref);
    const { data } = await q.maybeSingle();
    if (data) return { scanId: data.scan_id, contactName: null, clientId: null };
  }

  const scan = await db.from("scans").select("id").eq("id", ref).maybeSingle();
  if (scan.data) return { scanId: scan.data.id, contactName: null, clientId: null };

  throw new Error(`Cible introuvable : "${ref}" (client, lead, email ou id de scan attendus).`);
}
