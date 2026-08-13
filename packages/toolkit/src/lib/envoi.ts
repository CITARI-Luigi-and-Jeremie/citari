/**
 * L'envoi des emails, et surtout ses refus.
 *
 * Un email de relance raté ne se rattrape pas : il n'y a pas de bouton
 * « dépublier » dans la boîte de réception d'un prospect. Ce module est donc
 * écrit à l'envers : d'abord toutes les raisons de NE PAS envoyer, en
 * fonctions pures et testées, puis seulement l'appel à Resend.
 *
 * L'appel passe par l'API HTTP directe, sans SDK : une dépendance de moins,
 * et le jour où quelque chose casse, le corps de la requête se lit dans ce
 * fichier plutôt que dans les entrailles d'un paquet.
 */

export interface LeadEnvoi {
  id: string;
  email: string;
  status: string;
  unsubscribed_at: string | null;
  converted: boolean;
}

export interface RelanceEnvoi {
  id: string;
  step: number;
  due_on: string;
  subject: string | null;
  body: string | null;
  sent_at: string | null;
  cancelled: boolean;
}

export type Decision = { ok: true } | { ok: false; raison: string };

/**
 * Statuts depuis lesquels un email commercial peut encore partir.
 *
 * Tout le reste refuse : un converti n'a plus besoin de relance, un perdu a
 * dit non (et la doctrine dit qu'un non se respecte), un statut inconnu est
 * un état qu'on ne comprend pas, donc dans le doute on s'abstient.
 */
const STATUTS_RELANCABLES = new Set(["nouveau", "relance", "contacte"]);

/**
 * Le mail 0 se périme : « votre scan est terminé » envoyé dix jours après la
 * mesure est absurde, et le prospect a probablement déjà oublié. Au-delà de
 * cette fenêtre, on annule au lieu d'envoyer.
 */
export const FENETRE_MAIL0_JOURS = 3;

/** Une relance très en retard (commande pas lancée pendant des semaines) ne
 * part pas non plus : J+7 envoyé à J+40 ressemble à un système cassé. */
export const RETARD_MAX_JOURS = 10;

export function decisionEnvoi(
  relance: RelanceEnvoi,
  lead: LeadEnvoi,
  aujourdHui: Date,
): Decision {
  if (relance.sent_at) return { ok: false, raison: "déjà envoyé" };
  if (relance.cancelled) return { ok: false, raison: "annulé" };
  if (!relance.subject || !relance.body) return { ok: false, raison: "brouillon vide" };

  if (lead.unsubscribed_at) return { ok: false, raison: "désinscrit (STOP)" };
  if (lead.converted) return { ok: false, raison: "déjà client" };
  if (!STATUTS_RELANCABLES.has(lead.status))
    return { ok: false, raison: `statut « ${lead.status} »` };

  const echeance = new Date(`${relance.due_on}T00:00:00Z`);
  const retardJours = Math.floor((aujourdHui.getTime() - echeance.getTime()) / 86400_000);
  if (retardJours < 0) return { ok: false, raison: `pas encore dû (${relance.due_on})` };

  if (relance.step === 0 && retardJours > FENETRE_MAIL0_JOURS)
    return { ok: false, raison: `mail 0 périmé (${retardJours} j de retard)` };
  if (relance.step > 0 && retardJours > RETARD_MAX_JOURS)
    return { ok: false, raison: `relance périmée (${retardJours} j de retard)` };

  // Un lien localhost dans un email envoyé à un vrai prospect est le signe
  // que NEXT_PUBLIC_SITE_URL n'est pas configurée : on refuse tout le lot
  // plutôt que d'envoyer un rapport inaccessible.
  if (/localhost|127\.0\.0\.1/.test(relance.body))
    return { ok: false, raison: "lien localhost dans le corps (NEXT_PUBLIC_SITE_URL manquante)" };
  if (/\[LIEN DE RÉSERVATION\]/.test(relance.body))
    return { ok: false, raison: "BOOKING_URL manquante (le corps contient le gabarit)" };

  return { ok: true };
}

/**
 * Détecte une demande d'arrêt dans une réponse de prospect.
 *
 * Volontairement large : au moindre doute, on désinscrit. Perdre une relance
 * coûte un rendez-vous potentiel ; relancer quelqu'un qui a dit stop coûte la
 * réputation du domaine et une plainte CNIL.
 */
export function demandeStop(texte: string): boolean {
  const t = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return (
    /\bstop\b/.test(t) ||
    /desinscri|desabonn|plus (de |d')?e?mail|ne plus (me |etre )?contact|retirez|supprimez mes donnees/.test(t)
  );
}

/* ────────────────────────────── Resend ────────────────────────────── */

export interface MessageAEnvoyer {
  to: string;
  subject: string;
  text: string;
}

export interface ResultatEnvoi {
  id?: string;
  erreur?: string;
}

/**
 * En-têtes de désinscription : les boîtes affichent leur propre bouton
 * « se désabonner », qui vaut mieux qu'un signalement spam. Le mailto pointe
 * vers la boîte de réception réelle, avec un objet que `demandeStop` reconnaît.
 */
function adresseReponse(): string {
  return process.env.CONTACT_EMAIL || "contact@citari.fr";
}

export async function envoyerParResend(message: MessageAEnvoyer): Promise<ResultatEnvoi> {
  const cle = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!cle) return { erreur: "RESEND_API_KEY absente du .env racine" };
  if (!from) return { erreur: "RESEND_FROM absente du .env racine (ex. « Luigi de Citari <luigi@citari.fr> »)" };

  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      reply_to: adresseReponse(),
      subject: message.subject,
      // Texte brut uniquement, décision documentée dans Notion : un domaine
      // neuf qui envoie du HTML part en indésirables, et en B2B de dirigeant
      // à dirigeant le texte convertit mieux.
      text: message.text,
      headers: {
        "List-Unsubscribe": `<mailto:${adresseReponse()}?subject=STOP>`,
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!reponse.ok) {
    const corps = await reponse.text().catch(() => "");
    return { erreur: `Resend HTTP ${reponse.status} : ${corps.slice(0, 300)}` };
  }
  const json = (await reponse.json()) as { id?: string };
  return { id: json.id };
}

/* ─────────────────── revérification avant relance ─────────────────── */

export interface EtatRobots {
  joignable: boolean;
  botsBloques: string[];
}

/**
 * Relit le robots.txt du prospect, en direct, au moment d'envoyer.
 *
 * Les relances sont rédigées le jour du scan. Si le prospect a corrigé son
 * robots.txt entre-temps, l'email « votre site bloque GPTBot » est devenu
 * FAUX, et l'envoyer détruirait la seule chose qu'on vend : l'exactitude.
 * Même logique de lecture que l'audit du scan : la section d'un agent nommé
 * prime sur la section « * ».
 */
export async function relireRobots(siteUrl: string): Promise<EtatRobots> {
  const BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];
  let base: URL;
  try {
    base = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
  } catch {
    return { joignable: false, botsBloques: [] };
  }
  try {
    const r = await fetch(new URL("/robots.txt", base), { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return { joignable: false, botsBloques: [] };
    return { joignable: true, botsBloques: botsBloquesDe(await r.text(), BOTS) };
  } catch {
    return { joignable: false, botsBloques: [] };
  }
}

/**
 * Parse un robots.txt et rend les robots d'IA intégralement bloqués.
 *
 * Des lignes `User-agent` consécutives forment UN bloc : les directives qui
 * suivent s'appliquent à tous. C'est la forme la plus courante du blocage
 * (« User-agent: GPTBot / User-agent: ClaudeBot / Disallow: / »), et c'est
 * précisément celle que l'audit du scan lisait de travers : son drapeau de
 * regroupement était inversé, seul le dernier agent du bloc recevait les
 * règles, et GPTBot ressortait « autorisé » sur un site qui le bloque.
 * Corrigé ici ET dans `auditFlash` le 10/08/2026 ; les deux lectures doivent
 * rester identiques, c'est ce module que les tests couvrent.
 */
export function botsBloquesDe(contenu: string, bots: string[]): string[] {
  const regles: Record<string, string[]> = {};
  let agents: string[] = [];
  // Vrai quand la dernière ligne lue n'était PAS un User-agent : le prochain
  // User-agent ouvre alors un nouveau bloc au lieu d'étendre le courant.
  let apresDirectives = true;
  for (const brute of contenu.split(/\r?\n/)) {
    const ligne = brute.replace(/#.*$/, "").trim();
    if (!ligne) continue;
    const [clef = "", ...reste] = ligne.split(":");
    const valeur = reste.join(":").trim();
    if (clef.trim().toLowerCase() === "user-agent") {
      if (apresDirectives) agents = [];
      apresDirectives = false;
      agents.push(valeur.toLowerCase());
      for (const a of agents) regles[a] ??= [];
    } else {
      apresDirectives = true;
      if (clef.trim().toLowerCase() === "disallow") {
        for (const a of agents) (regles[a] ??= []).push(valeur);
      }
    }
  }
  return bots.filter((bot) => {
    const applicables = regles[bot.toLowerCase()] ?? regles["*"];
    return applicables?.some((d) => d === "/") ?? false;
  });
}
