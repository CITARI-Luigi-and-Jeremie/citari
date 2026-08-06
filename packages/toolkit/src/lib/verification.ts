/**
 * Contrôle de fiabilité d'une base de prospects, avant qu'un seul email parte.
 *
 * Une base d'acquisition ne vaut que par sa justesse : un email qui rebondit
 * abîme la réputation du domaine d'envoi, un prospect hors zone est du bruit
 * pour une agence qui vend l'exclusivité locale, et un homonyme attrapé par
 * erreur fait écrire « bonjour » au mauvais dirigeant. Ce module décide, par
 * des fonctions pures et testables, de ce qui est fiable et de ce qui ne l'est
 * pas. La vérification réseau (MX) vit dans la commande.
 */

/** Départements retenus comme « zone lyonnaise » au sens commercial. */
export const DEPARTEMENTS_ZONE = ["69", "01", "38", "42", "07", "26", "73", "74"];

/** Syntaxe d'email, stricte mais sans excès : ce qui a une chance de délivrer. */
export function emailValide(email: string): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (e.length > 80 || e.includes("..")) return false;
  return /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e);
}

/** Le domaine d'un email, ou "" si illisible. */
export function domaineEmail(email: string): string {
  const m = email.trim().toLowerCase().match(/@([^@\s]+)$/);
  return m ? m[1]! : "";
}

/** Le domaine nu d'un site : « https://www.cabinet.fr/contact » → « cabinet.fr ». */
export function domaineSite(url: string): string {
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]!;
}

/**
 * L'email est-il sur le domaine de l'entreprise ?
 *
 * On compare la racine (le mot avant le premier point). C'est volontairement
 * tolérant : « wize-expert.fr » et « wizeup.fr » sont deux marques du même
 * groupe, un email sur l'un pour un site sur l'autre reste joignable. Ce qu'on
 * veut détecter, c'est l'email franchement étranger, celui d'une autre société
 * du dirigeant, qui fait douter de tout le reste.
 */
export function emailCoherent(email: string, site: string): boolean | null {
  const de = domaineEmail(email);
  const ds = domaineSite(site);
  if (!de || !ds) return null;
  if (de === ds) return true;
  const re = de.split(".")[0]!;
  const rs = ds.split(".")[0]!;
  if (!re || !rs) return false;
  // Une racine contenue dans l'autre : « cabinet » et « cabinet-conseil ».
  if (re.includes(rs) || rs.includes(re)) return true;
  // Sinon un préfixe commun d'au moins quatre caractères, qui rattrape les
  // marques voisines d'une même maison (« wizeup » / « wize-expert ») sans
  // rapprocher deux sociétés sans rapport (« magnacarta » / « canopee »).
  let commun = 0;
  while (commun < re.length && commun < rs.length && re[commun] === rs[commun]) commun++;
  return commun >= 4;
}

/**
 * Le prospect est-il dans la zone ?
 *
 * Le code postal tranche. Quand l'INSEE l'a masqué (entreprise non diffusible),
 * il vaut « [NON-DIFFUSIBLE] » : on se rabat alors sur la commune, qui, elle,
 * reste affichée. Ne jamais écarter un prospect sur une donnée absente.
 */
export function dansZone(codePostal: string, commune: string, communesZone: string[]): boolean {
  const cp = (codePostal ?? "").trim();
  if (/^\d{5}$/.test(cp)) return DEPARTEMENTS_ZONE.includes(cp.slice(0, 2));
  // CP absent ou masqué : on juge sur la commune si on la connaît.
  const c = (commune ?? "").toLowerCase();
  return communesZone.some((z) => c.includes(z.toLowerCase()));
}

export interface LigneProspect {
  entreprise: string;
  site_web: string;
  code_postal: string;
  ville: string;
  siren: string;
  ceo_email: string;
  ceo_email_statut: string;
  email_entreprise: string;
  tel_standard: string;
  tel_mobile_site: string;
  ceo_nom: string;
}

export interface Fiabilite {
  note: "A" | "B" | "C" | "D";
  score: number;
  alertes: string[];
}

/**
 * Note de fiabilité d'une ligne, de A (prête à contacter) à D (à écarter).
 *
 * `mxOk` vient de la commande (résolution DNS) : une valeur `false` veut dire
 * que le domaine ne peut recevoir aucun email, ce qui est éliminatoire pour le
 * canal mail. `null` = non vérifié.
 */
export function noterFiabilite(
  l: LigneProspect,
  ctx: { communesZone: string[]; mxCeo?: boolean | null; mxEntreprise?: boolean | null },
): Fiabilite {
  const alertes: string[] = [];
  let score = 100;

  // Hors zone est rédhibitoire, et pas seulement pénalisant : Citari vend
  // l'exclusivité par secteur ET par zone, et le baromètre local est l'angle
  // de tout le discours. Un cabinet de Carcassonne, même parfaitement
  // renseigné, n'est pas un prospect — c'est du bruit qui dilue la série.
  let horsZone = false;
  if (!dansZone(l.code_postal, l.ville, ctx.communesZone)) {
    alertes.push(`hors zone (${l.ville || l.code_postal || "?"})`);
    score -= 60;
    horsZone = true;
  }
  if (!l.siren) {
    alertes.push("aucun SIREN : identité registre non confirmée");
    score -= 25;
  }

  const emailCeo = l.ceo_email && emailValide(l.ceo_email);
  const emailEnt = l.email_entreprise && emailValide(l.email_entreprise);
  if (l.ceo_email && !emailCeo) { alertes.push("email dirigeant mal formé"); score -= 15; }
  if (!emailCeo && !emailEnt) { alertes.push("aucun email exploitable"); score -= 30; }

  if (emailCeo && ctx.mxCeo === false) { alertes.push("email dirigeant : domaine ne reçoit pas de mail"); score -= 30; }
  if (emailEnt && ctx.mxEntreprise === false && !emailCeo) { alertes.push("email entreprise : domaine sans MX"); score -= 20; }

  if (emailCeo) {
    const coherent = emailCoherent(l.ceo_email, l.site_web);
    if (coherent === false) { alertes.push(`email dirigeant sur un domaine tiers (${domaineEmail(l.ceo_email)})`); score -= 15; }
  }
  if (l.ceo_email && l.ceo_email_statut && l.ceo_email_statut !== "verified") {
    alertes.push(`email dirigeant non vérifié (${l.ceo_email_statut})`);
    score -= 10;
  }

  if (!l.tel_standard && !l.tel_mobile_site) { alertes.push("aucun téléphone"); score -= 10; }
  if (!l.ceo_nom) { alertes.push("dirigeant non nommé"); score -= 8; }

  score = Math.max(0, Math.min(100, score));
  const note = horsZone ? "D" : score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  return { note, score, alertes };
}
