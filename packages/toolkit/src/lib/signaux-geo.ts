/**
 * Ce qu'un site dit de lui-même avant qu'on l'ait scanné.
 *
 * Le scan mesure la douleur ; ces signaux-là mesurent le **matériau** : de quoi
 * dispose ce prospect pour qu'un sprint GEO produise un effet en 90 jours, et
 * quel discours tenir. Tout se lit gratuitement sur son propre site, dans des
 * formats structurés qu'il publie volontairement : plan du site, flux RSS,
 * balisage schema.org.
 *
 * Le renseignement le plus vendeur n'est pas « publie » ou « ne publie pas »,
 * c'est **« a publié puis s'est arrêté »**. Une entreprise qui a écrit quinze
 * articles en 2022 puis plus rien a déjà payé pour croire au contenu, a
 * l'outillage en place, et a échoué faute de méthode. C'est exactement ce que
 * le sprint vend. Une entreprise qui n'a jamais rien publié doit d'abord être
 * convaincue que le contenu sert à quelque chose, ce qui est un autre métier
 * et un cycle plus long.
 */

/** Ce que le site publie, tel qu'on peut le lire de l'extérieur. */
export interface SignauxGeo {
  /** Nombre d'URLs déclarées au plan du site. Un site de 5 pages n'a rien à citer. */
  pagesTotal: number;
  /** Date ISO du contenu le plus récent, ou null si aucune date lisible. */
  dernierContenu: string | null;
  /** Contenus datés de moins de douze mois. */
  contenus12Mois: number;
  /** Contenus datés, toutes périodes confondues. */
  contenusTotal: number;
  /** Note moyenne et nombre d'avis, quand le site les balise lui-même. */
  avisNote: number | null;
  avisNombre: number | null;
  /** Le site balise-t-il une FAQ ? C'est le format que les IA citent le plus volontiers. */
  faqBalisee: boolean;
  /** Fichier llms.txt présent : un chantier 1 en moins, et un signe de maturité. */
  llmsTxt: boolean;
}

export type Cadence = "actif" | "ralenti" | "endormi" | "abandonne" | "aucun";

/**
 * Rythme de publication, en une catégorie.
 *
 * Les seuils sont commerciaux, pas statistiques : ils correspondent à quatre
 * conversations différentes, décrites dans `angleCommercial`.
 */
export function cadence(s: Pick<SignauxGeo, "dernierContenu" | "contenus12Mois" | "contenusTotal">, aujourdhui = new Date()): Cadence {
  if (!s.dernierContenu || s.contenusTotal === 0) return "aucun";
  const jours = (aujourdhui.getTime() - new Date(s.dernierContenu).getTime()) / 86400000;
  if (Number.isNaN(jours)) return "aucun";
  if (jours <= 92 && s.contenus12Mois >= 3) return "actif";
  if (jours <= 92) return "ralenti";
  if (jours <= 365) return "ralenti";
  if (jours <= 1095) return "endormi";
  return "abandonne";
}

/**
 * La phrase d'ouverture que ces signaux autorisent, et rien de plus.
 *
 * Chaque angle n'affirme que ce qui a été lu sur le site du prospect : un
 * nombre d'articles, une date, un nombre d'avis. Aucune extrapolation, parce
 * qu'un chiffre faux dans une première phrase tue la crédibilité de toute la
 * mesure qu'on vend derrière.
 */
export function angleCommercial(s: SignauxGeo, aujourdhui = new Date()): { angle: string; priorite: number } {
  const c = cadence(s, aujourdhui);
  const annee = s.dernierContenu ? new Date(s.dernierContenu).getFullYear() : null;

  if (c === "endormi" || c === "abandonne") {
    return {
      // Le meilleur angle : ils ont cru au contenu, ont investi, puis se sont
      // arrêtés. On ne leur vend pas une idée, on leur vend une méthode.
      angle: `a publié ${s.contenusTotal} contenus puis s'est arrêté${annee ? ` en ${annee}` : ""} : l'outillage est là, la méthode manque`,
      priorite: 1,
    };
  }
  if (c === "actif") {
    return {
      angle: `publie déjà (${s.contenus12Mois} contenus sur douze mois) : si l'IA ne le cite pas, c'est le format, pas le volume`,
      priorite: 2,
    };
  }
  if (c === "ralenti") {
    return { angle: `publie peu (${s.contenus12Mois} contenus sur douze mois) : la régularité est le seul manque`, priorite: 3 };
  }
  if (s.avisNombre && s.avisNombre >= 20) {
    return { angle: `${s.avisNombre} avis clients affichés, et rien à citer pour une IA`, priorite: 2 };
  }
  return { angle: `aucun contenu publié : il n'y a littéralement rien à citer`, priorite: 4 };
}

/**
 * Matériau exploitable en 90 jours, sur 100.
 *
 * ⚠ Ce n'est PAS une note de prospect : un score bas peut signaler le meilleur
 * client (tout est à faire, donc tout progressera). Il dit de quoi on part, et
 * combien de travail le sprint devra fournir avant que la mesure bouge.
 */
export function materiauGeo(s: SignauxGeo, aujourdhui = new Date()): number {
  let n = 0;
  const c = cadence(s, aujourdhui);
  n += { actif: 30, ralenti: 22, endormi: 15, abandonne: 10, aucun: 0 }[c];
  if (s.pagesTotal >= 100) n += 20;
  else if (s.pagesTotal >= 30) n += 15;
  else if (s.pagesTotal >= 10) n += 8;
  else if (s.pagesTotal > 0) n += 3;
  n += Math.min(20, s.contenusTotal * 2);
  if (s.faqBalisee) n += 15;
  if (s.avisNombre && s.avisNombre >= 50) n += 10;
  else if (s.avisNombre && s.avisNombre >= 10) n += 6;
  else if (s.avisNombre) n += 3;
  if (s.llmsTxt) n += 5;
  return Math.max(0, Math.min(100, n));
}

/** Dates ISO trouvées dans un plan de site, du plus récent au plus ancien. */
export function datesDuSitemap(xml: string): string[] {
  const dates: string[] = [];
  for (const m of xml.matchAll(/<lastmod>\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/g)) dates.push(m[1]!);
  return dates.sort().reverse();
}

/** Dates de publication d'un flux RSS ou Atom. */
export function datesDuFlux(xml: string): string[] {
  const dates: string[] = [];
  for (const m of xml.matchAll(/<pubDate>\s*([^<]+)</gi)) {
    const d = new Date(m[1]!.trim());
    if (!Number.isNaN(d.getTime())) dates.push(d.toISOString().slice(0, 10));
  }
  for (const m of xml.matchAll(/<(?:updated|published)>\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/gi)) dates.push(m[1]!);
  return [...new Set(dates)].sort().reverse();
}

/**
 * Avis clients que le site balise lui-même, en schema.org.
 *
 * On ne lit QUE ce que le prospect publie sur son propre domaine : aucune
 * interrogation de Google, donc aucun scraping d'un service tiers. Ce que le
 * site affiche est de toute façon ce qu'il assume publiquement.
 */
export function avisSchema(html: string): { note: number | null; nombre: number | null } {
  const note = html.match(/"ratingValue"\s*:\s*"?([0-9]+(?:[.,][0-9]+)?)"?/i);
  const nb = html.match(/"(?:reviewCount|ratingCount)"\s*:\s*"?([0-9]+)"?/i);
  const n = note ? Number(note[1]!.replace(",", ".")) : null;
  const c = nb ? Number(nb[1]) : null;
  // Une note hors de l'échelle ou un compte absurde trahit un gabarit.
  const noteOk = n !== null && n > 0 && n <= 5 ? n : null;
  const nbOk = c !== null && c > 0 && c < 100000 ? c : null;
  return { note: noteOk, nombre: nbOk };
}

/** Le site balise-t-il une FAQ ? C'est le format que les moteurs reprennent le plus. */
export function faqBalisee(html: string): boolean {
  return /"@type"\s*:\s*"FAQPage"/i.test(html) || /"@type"\s*:\s*"Question"/i.test(html);
}
