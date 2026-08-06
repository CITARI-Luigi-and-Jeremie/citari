/**
 * Extraction des contacts publiés sur le site d'une entreprise.
 *
 * Les PME françaises publient massivement leurs coordonnées : la page contact,
 * le pied de page, et surtout les **mentions légales**, obligatoires (article 6
 * III de la LCEN) et qui nomment le responsable de publication. C'est une
 * source gratuite, exacte à la source, et plus fraîche que n'importe quelle
 * base revendue, puisque c'est l'entreprise elle-même qui l'écrit.
 *
 * Fonctions pures uniquement : le réseau vit dans la commande. Ce fichier
 * décide de ce qui est un contact valable, et c'est la seule chose qui compte
 * pour ne pas envoyer un email à `wixpress.com`.
 */

/**
 * Adresses à jeter : elles polluent tout scraping naïf.
 *
 * Trois familles, et chacune a mordu quelqu'un avant nous : les exemples de
 * gabarits (`nom@domaine.fr`), les adresses des prestataires du site
 * (Wix, Squarespace, l'agence web), et les images dont l'extension ressemble
 * à un domaine (`logo@2x.png`).
 */
const EMAILS_JETABLES = [
  "example.com", "domain.com", "votredomaine", "votre-domaine", "monsite",
  "wixpress.com", "sentry.io", "squarespace.com", "wordpress.com", "shopify.com",
  "godaddy.com", "cloudflare.com", "jimdo.com", "webflow.com", "email.com",
];
const EMAILS_ROLES_INUTILES = ["noreply", "no-reply", "ne-pas-repondre", "postmaster", "webmaster", "mailer-daemon", "abuse", "privacy", "dpo", "rgpd"];

/** Le préfixe le plus utile pour de la prospection, du plus direct au plus générique. */
const RANG_PREFIXE = ["direction", "dg", "gerant", "president", "associe", "marketing", "communication", "commercial", "contact", "info", "bonjour", "hello", "accueil", "secretariat"];

const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Emails exploitables trouvés dans une page, classés du plus utile au moins utile. */
export function extraireEmails(html: string, domaineSite?: string): string[] {
  const bruts = new Set<string>();
  for (const m of html.matchAll(RE_EMAIL)) bruts.add(m[0].toLowerCase());
  // `mailto:` encodé : les CMS écrivent parfois %40 pour @.
  for (const m of html.matchAll(/mailto:([^"'>\s?]+)/gi)) {
    const decode = decodeURIComponent(m[1]!).toLowerCase();
    if (RE_EMAIL.test(decode)) bruts.add(decode);
    RE_EMAIL.lastIndex = 0;
  }

  const gardes = [...bruts].filter((e) => {
    const [local = "", domaine = ""] = e.split("@");
    if (!local || !domaine) return false;
    if (/\.(png|jpe?g|gif|svg|webp|css|js|woff2?)$/i.test(domaine)) return false;
    if (EMAILS_JETABLES.some((d) => domaine.includes(d))) return false;
    if (EMAILS_ROLES_INUTILES.some((r) => local.startsWith(r))) return false;
    if (local.length > 40 || e.length > 80) return false;
    // Les identifiants de suivi ressemblent à des emails : u123abc@sentry, hash@.
    if (/^[a-f0-9]{16,}$/.test(local)) return false;
    return true;
  });

  const rang = (e: string) => {
    const [local = "", domaine = ""] = e.split("@");
    // Une adresse sur le domaine du site vaut mieux qu'une adresse gmail
    // trouvée dans un article de blog.
    const surSite = domaineSite && domaine.includes(domaineSite.replace(/^www\./, "")) ? 0 : 100;
    const i = RANG_PREFIXE.findIndex((p) => local.startsWith(p));
    // Une adresse nominative (prenom.nom@) passe avant les génériques.
    const nominative = /^[a-z]+[._-][a-z]+$/.test(local) ? 5 : 50;
    return surSite + (i >= 0 ? i : nominative);
  };
  return gardes.sort((a, b) => rang(a) - rang(b) || a.localeCompare(b));
}

/**
 * Téléphones français exploitables.
 *
 * On garde le mobile ET le fixe, mais on les distingue : un 06/07 est une
 * ligne directe, souvent celle du dirigeant dans une PME, un 04 est un
 * standard. Les faux positifs classiques sont les numéros SIRET, les dates et
 * les codes postaux collés, écartés par la longueur exacte.
 */
export function extraireTelephones(texte: string): { mobiles: string[]; fixes: string[] } {
  const trouves = new Set<string>();
  const re = /(?:(?:\+|00)33\s?|0)\s?[1-9](?:[\s.\-]?\d{2}){4}\b/g;
  for (const m of texte.matchAll(re)) {
    const chiffres = m[0].replace(/[^\d+]/g, "").replace(/^\+33/, "0").replace(/^0033/, "0");
    if (/^0\d{9}$/.test(chiffres)) trouves.add(chiffres);
  }
  const liste = [...trouves];
  return {
    mobiles: liste.filter((t) => /^0[67]/.test(t)),
    fixes: liste.filter((t) => !/^0[67]/.test(t)),
  };
}

/** Format lisible : 04 78 12 34 56. */
export function formaterTelephone(t: string): string {
  return /^0\d{9}$/.test(t) ? t.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : t;
}

/**
 * Le responsable de publication des mentions légales.
 *
 * C'est le nom que la loi oblige à publier, donc il est exact et à jour bien
 * plus souvent qu'une fiche achetée. Dans une PME, c'est presque toujours le
 * dirigeant, c'est-à-dire notre acheteur.
 */
export function extraireResponsable(texte: string): string | null {
  const motifs = [
    /responsable\s+(?:de\s+la\s+)?publication\s*:?\s*(?:M(?:me|\.|onsieur|adame)?\s*)?([A-ZÀ-Ý][\wÀ-ÿ'-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'-]+){1,2})/i,
    /directeur\s+(?:de\s+la\s+)?publication\s*:?\s*(?:M(?:me|\.|onsieur|adame)?\s*)?([A-ZÀ-Ý][\wÀ-ÿ'-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'-]+){1,2})/i,
    /(?:gérant|président|dirigeant)\s*:?\s*(?:M(?:me|\.|onsieur|adame)?\s*)?([A-ZÀ-Ý][\wÀ-ÿ'-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'-]+){1,2})/i,
  ];
  for (const re of motifs) {
    const m = texte.match(re);
    const nom = m?.[1]?.trim();
    if (nom && nom.length >= 5 && nom.length <= 60) return nom;
  }
  return null;
}

/**
 * Signal d'achat : la société paye-t-elle déjà de la publicité ?
 *
 * Une entreprise qui a un pixel Google Ads ou Meta a un budget d'acquisition
 * et un réflexe d'acquisition. Elle comprend « vos concurrents vous prennent
 * des clients dans ChatGPT » en une phrase, là où il faut vingt minutes à une
 * entreprise qui n'a jamais acheté un clic.
 */
export function detecterRegiesPub(html: string): string[] {
  const signatures: [string, RegExp][] = [
    ["Google Ads", /googleadservices|gtag\/js\?id=AW-|google_conversion/i],
    ["Google Analytics", /gtag\/js\?id=G-|googletagmanager\.com\/gtm\.js/i],
    ["Meta", /connect\.facebook\.net.*fbevents|fbq\(\s*['"]init/i],
    ["LinkedIn", /snap\.licdn\.com|_linkedin_partner_id/i],
    ["HubSpot", /js\.hs-scripts\.com|hs-analytics/i],
  ];
  return signatures.filter(([, re]) => re.test(html)).map(([nom]) => nom);
}

/** Les robots d'IA bloqués par un robots.txt, pour l'accroche la plus vérifiable. */
export function botsIaBloques(robotsTxt: string): string[] {
  const BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "OAI-SearchBot"];
  const regles: Record<string, string[]> = {};
  let agents: string[] = [];
  let enTete = true;
  for (const brute of robotsTxt.split(/\r?\n/)) {
    const ligne = brute.replace(/#.*$/, "").trim();
    if (!ligne) continue;
    const [clef = "", ...reste] = ligne.split(":");
    const valeur = reste.join(":").trim();
    if (clef.trim().toLowerCase() === "user-agent") {
      if (!enTete) agents = [];
      enTete = false;
      agents.push(valeur.toLowerCase());
      for (const a of agents) regles[a] ??= [];
    } else {
      enTete = true;
      if (clef.trim().toLowerCase() === "disallow") {
        for (const a of agents) (regles[a] ??= []).push(valeur);
      }
    }
  }
  return BOTS.filter((bot) => {
    const applicables = regles[bot.toLowerCase()] ?? regles["*"];
    return applicables?.some((d) => d === "/") ?? false;
  });
}

/** Retire les balises pour analyser le texte visible, sans le bruit du code. */
export function texteVisible(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ");
}

/** Les pages où les coordonnées se trouvent, par ordre de rendement. */
export const CHEMINS_CONTACT = [
  "/",
  "/contact",
  "/mentions-legales",
  "/nous-contacter",
  "/contactez-nous",
  "/qui-sommes-nous",
  "/equipe",
  "/mentions-legales.html",
];
