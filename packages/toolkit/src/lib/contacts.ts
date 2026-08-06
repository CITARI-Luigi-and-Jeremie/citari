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
/**
 * Le numéro correspond-il à un bloc réellement attribué en France ?
 *
 * Dix chiffres commençant par zéro ne suffisent pas : un SIRET, un numéro de
 * TVA ou une suite de dates découpée en paires produit la même forme. Trois
 * faux numéros sont ainsi entrés dans la base du 06/08/2026, dont
 * « 01 20 04 86 22 » et « 01 03 10 38 07 », deux préfixes qui n'existent pas.
 * Un faux numéro coûte plus qu'un numéro absent : on appelle un inconnu, et
 * on croit la fiche complète.
 *
 * Bornes ARCEP par indicatif, sur les deux chiffres suivants. Elles sont
 * volontairement PERMISSIVES : jeter un vrai numéro coûte un prospect, alors
 * qu'un faux se repère au premier appel. Un premier jeu de bornes trop serré
 * a écarté vingt-trois numéros parfaitement valides, dont des `0980` et des
 * `0413`.
 *
 * La forme internationale est normalisée avant tout contrôle : `+33 4 72 …`
 * doit devenir `0472…`, faute de quoi il est rejeté pour mauvaise longueur.
 */
export function telephoneFrancaisPlausible(numero: string): boolean {
  let n = (numero ?? "").replace(/[^\d+]/g, "");
  if (n.startsWith("+33")) n = "0" + n.slice(3);
  else if (n.startsWith("0033")) n = "0" + n.slice(4);
  else if (n.startsWith("+")) return false; // indicatif étranger
  n = n.replace(/\D/g, "");
  if (!/^0\d{9}$/.test(n)) return false;
  const indicatif = n.slice(0, 2);
  const suite = Number(n.slice(2, 4));
  if (indicatif === "06" || indicatif === "07") return true;
  if (indicatif === "01") return suite >= 30 && suite <= 89; // Île-de-France
  if (indicatif === "02") return suite >= 14;
  if (indicatif === "03") return suite >= 10;
  if (indicatif === "04") return suite >= 13;
  if (indicatif === "05") return suite >= 16;
  if (indicatif === "09") return suite >= 9; // non géographiques, 0909 à 0989
  // 08 : numéros spéciaux et surtaxés, sans intérêt pour joindre un dirigeant.
  return false;
}

/**
 * Numéro d'exemple laissé par un gabarit de site, jamais un vrai contact.
 *
 * Les modèles de site livrent des numéros de démonstration que personne ne
 * remplace : `06 07 08 09 10` (suite de +1), `06 12 34 56 78` (chiffres
 * consécutifs), `06 00 00 00 00` (répétition). Ils passent tous les contrôles
 * de format et d'indicatif, donc seule leur régularité les trahit. Un seul
 * dans une base coûte un appel dans le vide et fait douter de tout le reste :
 * `alteraudit.fr` publiait le premier.
 */
export function numeroFactice(numero: string): boolean {
  const n = (numero ?? "").replace(/\D/g, "");
  if (!/^0\d{9}$/.test(n)) return false;
  const suite = n.slice(1);
  if (new Set(suite).size <= 2) return true;
  const paires = [1, 3, 5, 7].map((i) => Number(suite.slice(i, i + 2)));
  if (paires.every((v, i) => i === 0 || v - paires[i - 1]! === 1)) return true;
  if ("01234567890123456789".includes(suite.slice(1))) return true;
  return false;
}

export function extraireTelephones(texte: string): { mobiles: string[]; fixes: string[] } {
  const trouves = new Set<string>();
  const re = /(?:(?:\+|00)33\s?|0)\s?[1-9](?:[\s.\-]?\d{2}){4}\b/g;
  for (const m of texte.matchAll(re)) {
    const chiffres = m[0].replace(/[^\d+]/g, "").replace(/^\+33/, "0").replace(/^0033/, "0");
    if (telephoneFrancaisPlausible(chiffres)) trouves.add(chiffres);
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
/**
 * Mots qui ne peuvent pas faire partie d'un nom de personne.
 *
 * Sans ce filtre, la base s'est retrouvée avec des dirigeants nommés « est une
 * personne », « et accompagnement » ou « du conseil syndical » : le texte qui
 * suit « Le gérant » dans une phrase ordinaire. Un faux nom est pire qu'un nom
 * absent, parce qu'il finit dans un email adressé à quelqu'un qui n'existe pas.
 */
const MOTS_INTERDITS = new Set([
  "est", "sont", "et", "ou", "de", "du", "des", "le", "la", "les", "un", "une", "au", "aux",
  "ce", "cette", "ces", "son", "sa", "ses", "votre", "vos", "notre", "nos", "leur", "leurs",
  "personne", "physique", "morale", "societe", "société", "entreprise", "cabinet", "groupe",
  "sas", "sarl", "sasu", "sci", "scop", "sa", "eurl", "selarl", "sadresser", "adresse",
  "pourquoi", "comment", "contactez", "contact", "responsable", "direction", "directeur",
  "gerant", "gérant", "president", "président", "forme", "juridique", "siege", "siège",
  "social", "syndical", "conseil", "retraite", "partant", "travailler", "dans", "chez",
  "pour", "par", "avec", "sur", "sous", "entre", "vers", "accompagnement", "expertise",
  "actions", "fonds", "structure", "capital", "euros", "immatriculee", "immatriculée",
  "representee", "représentée", "publication", "hebergeur", "hébergeur", "editeur", "éditeur",
]);

/** Chaque mot commence-t-il vraiment par une majuscule, sans mot interdit ? */
function ressembleAUnNom(candidat: string): boolean {
  const mots = candidat.trim().split(/\s+/);
  if (mots.length < 2 || mots.length > 3) return false;
  for (const mot of mots) {
    const nu = mot.replace(/[^A-Za-zÀ-ÿ'-]/g, "");
    if (nu.length < 2) return false;
    // La casse est décisive : « Est » dans un titre reste un mot, pas un prénom,
    // mais un mot entièrement minuscule ne peut pas être un nom propre.
    if (nu[0] !== nu[0]!.toUpperCase()) return false;
    if (MOTS_INTERDITS.has(nu.toLowerCase())) return false;
  }
  return true;
}

export function extraireResponsable(texte: string): string | null {
  // Le nom se capture SANS le drapeau « insensible à la casse » : avec lui,
  // `[A-ZÀ-Ý]` acceptait n'importe quelle lettre et « est une personne »
  // passait pour un nom. Les variantes de casse du mot-clé sont donc écrites
  // explicitement.
  const CLE = "[Rr]esponsable|[Dd]irecteur|[Dd]irectrice|[Gg][ée]rant|[Gg][ée]rante|[Pp]r[ée]sident|[Pp]r[ée]sidente|[Dd]irigeant|[Ff]ondateur|[Ff]ondatrice";
  const NOM = "([A-ZÀ-Ý][A-Za-zÀ-ÿ'-]+(?:\\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'-]+){1,2})";
  const motifs = [
    new RegExp(`(?:${CLE})\\s+(?:de\\s+la\\s+)?[Pp]ublication\\s*:?\\s*(?:M(?:me|\\.|onsieur|adame)?\\s+)?${NOM}`),
    new RegExp(`(?:${CLE})\\s*:\\s*(?:M(?:me|\\.|onsieur|adame)?\\s+)?${NOM}`),
    new RegExp(`${NOM}\\s*[,–—-]\\s*(?:${CLE})`),
  ];
  for (const re of motifs) {
    const nom = texte.match(re)?.[1]?.trim();
    if (nom && nom.length >= 5 && nom.length <= 60 && ressembleAUnNom(nom)) return nom;
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
