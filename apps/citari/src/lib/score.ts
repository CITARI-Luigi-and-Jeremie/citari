import { MOTEURS } from "@/lib/typo";

// Calcul du Score de Visibilité IA — règles métier figées.
// mention 50 % · position 20 % · recommandation 20 % · sentiment 10 %

export type LigneMention = {
  /** La réponse d'où vient la mention : l'unité de TOUT comptage. */
  response_id: string;
  engine: string;
  brand: string;
  is_target: boolean;
  position: number | null;
  recommended: boolean;
  sentiment: string | null;
};

export const POIDS = { mention: 0.5, position: 0.2, reco: 0.2, sentiment: 0.1 } as const;

type Presence = { position: number | null; recommended: boolean; sentiments: number[] };

/**
 * Regroupe les mentions de la marque par RÉPONSE : une réponse où elle
 * apparaît, quel qu'en soit le nombre de citations, vaut UNE présence.
 *
 * C'est la correction du score 123/100 d'Apple (15/08/2026) : une grande
 * marque est citée plusieurs fois par réponse (54 mentions pour 39
 * réponses), et compter les lignes de mention portait la présence à 138 %
 * et la recommandation à 126 %. La règle d'unité de tout le parcours vaut
 * aussi pour la formule : le dénominateur est en réponses, le numérateur
 * doit l'être.
 *
 * Par réponse : la MEILLEURE position (celle que lit l'acheteur en
 * premier), recommandé si au moins une citation l'est, et la tonalité
 * moyenne de ses citations.
 */
function presencesParReponse(cible: LigneMention[]): Presence[] {
  const par = new Map<string, Presence>();
  for (const m of cible) {
    const p = par.get(m.response_id) ?? { position: null, recommended: false, sentiments: [] };
    if (
      typeof m.position === "number" &&
      m.position >= 1 &&
      (p.position === null || m.position < p.position)
    ) {
      p.position = m.position;
    }
    p.recommended = p.recommended || m.recommended;
    p.sentiments.push(scoreSentiment(m.sentiment));
    par.set(m.response_id, p);
  }
  return [...par.values()];
}

function scorePosition(position: number | null): number {
  if (!position || position < 1) return 0;
  if (position === 1) return 1;
  if (position === 2) return 0.8;
  if (position === 3) return 0.6;
  if (position <= 5) return 0.4;
  return 0.2;
}

function scoreSentiment(s: string | null): number {
  if (s === "positif") return 1;
  if (s === "negatif") return 0;
  return 0.5;
}

export function calculerScore(
  reponses: { id: string; engine: string }[],
  mentions: LigneMention[],
): {
  global: number;
  parMoteur: Record<string, number | null>;
  mentionRate: number;
  avgPosition: number | null;
  recoRate: number;
  sentiment: number;
} {
  // Garde-fou d'unité : seule compte une mention rattachée à une réponse
  // réellement mesurée. Une ligne orpheline (réponse en erreur, incohérence
  // de base) ne peut plus gonfler un numérateur dont elle ne partage pas le
  // dénominateur, et chaque ratio est borné à 1 par construction.
  const idsMesures = new Set(reponses.map((r) => r.id));
  const cible = mentions.filter((m) => m.is_target && idsMesures.has(m.response_id));
  const total = reponses.length || 1;

  const presences = presencesParReponse(cible);
  const mentionRate = presences.length / total;
  const positions = presences.map((p) => p.position).filter((p): p is number => p !== null);
  const avgPosition = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null;
  const posScore = presences.reduce((a, p) => a + scorePosition(p.position), 0) / total;
  const recoRate = presences.filter((p) => p.recommended).length / total;
  const sentiment = presences.length
    ? presences.reduce((a, p) => a + p.sentiments.reduce((x, y) => x + y, 0) / p.sentiments.length, 0) /
      presences.length
    : 0.5;

  const global =
    100 *
    (POIDS.mention * mentionRate +
      POIDS.position * posScore +
      POIDS.reco * recoRate +
      POIDS.sentiment * (presences.length ? sentiment : 0));

  const parMoteur: Record<string, number | null> = {};
  for (const moteur of MOTEURS) {
    const rep = reponses.filter((r) => r.engine === moteur);
    if (!rep.length) {
      parMoteur[moteur] = null;
      continue;
    }
    const idsMoteur = new Set(rep.map((r) => r.id));
    const pres = presencesParReponse(cible.filter((x) => idsMoteur.has(x.response_id)));
    const mr = pres.length / rep.length;
    const ps = pres.reduce((a, p) => a + scorePosition(p.position), 0) / rep.length;
    const rr = pres.filter((p) => p.recommended).length / rep.length;
    const st = pres.length
      ? pres.reduce((a, p) => a + p.sentiments.reduce((x, y) => x + y, 0) / p.sentiments.length, 0) /
        pres.length
      : 0;
    parMoteur[moteur] = Math.round(
      100 * (POIDS.mention * mr + POIDS.position * ps + POIDS.reco * rr + POIDS.sentiment * st),
    );
  }

  return {
    global: Math.round(global),
    parMoteur,
    mentionRate,
    avgPosition,
    recoRate,
    sentiment,
  };
}

/**
 * Regroupe les variantes d'écriture d'une même entreprise.
 *
 * Les moteurs nomment rarement une entreprise deux fois pareil. Relevé sur nos
 * données réelles : 177 marques sur 1220 sont des variantes d'une autre, et
 * une seule société apparaissait six fois (« Amarris », « Amarris Direct »,
 * « Amarris Contact », « Amarris Contact Lyon », « Amarris Groupe », « Amarris
 * Expertise Comptable »).
 *
 * Trois dégâts, dont le dernier coûte de l'argent au client. La part de voix
 * sous-estime les leaders puisque leur poids est éclaté. La comparaison J+90
 * se fausse si l'IA écrit « Amarris » en janvier et « Amarris Direct » en
 * avril. Et la priorisation croit qu'une question oppose six concurrents là où
 * il n'y en a qu'un, donc elle la juge ingagnable et fait écrire le mauvais
 * contenu.
 *
 * La règle est volontairement prudente : forme compacte identique, ou préfixe
 * d'au moins quatre caractères. Le seuil écarte les faux positifs sur les
 * sigles courts (« EY », « BDO »), où une inclusion libre rapprocherait
 * n'importe quoi. Mieux vaut laisser deux variantes séparées que fusionner
 * deux entreprises distinctes.
 *
 * Le nom retenu est le plus cité, pas le plus court : c'est la façon dont les
 * moteurs désignent réellement l'entreprise, donc celle que le client
 * reconnaîtra dans son rapport.
 *
 * @returns variante → nom retenu, pour les seules marques regroupées.
 */
export function regrouperMarques(mentions: { brand: string }[]): Record<string, string> {
  const compte = new Map<string, number>();
  for (const m of mentions) {
    const nom = m.brand.trim();
    if (nom) compte.set(nom, (compte.get(nom) ?? 0) + 1);
  }

  const compact = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");

  // Du plus cité au moins cité : le premier rencontré devient le nom retenu,
  // et les suivants s'y rattachent.
  const noms = [...compte.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).map(([n]) => n);

  const alias: Record<string, string> = {};
  const retenus: { nom: string; cle: string }[] = [];
  for (const nom of noms) {
    const cle = compact(nom);
    if (cle.length < 2) continue;
    const parent = retenus.find(
      (r) =>
        r.cle === cle ||
        (r.cle.length >= 4 && cle.startsWith(r.cle)) ||
        (cle.length >= 4 && r.cle.startsWith(cle)),
    );
    if (parent) alias[nom] = parent.nom;
    else retenus.push({ nom, cle });
  }
  return alias;
}

/**
 * Part de voix = mentions de la marque / mentions totales (marque + concurrents).
 *
 * `classe` sépare les concurrents atteignables des autres. Elle est posée après
 * coup par `finaliser`, à partir de `classerConcurrents` : cette fonction reste
 * un pur calcul, sans appel réseau, pour rester testable et déterministe.
 */
export function partDeVoix(
  mentions: LigneMention[],
  alias: Record<string, string> = {},
): {
  name: string;
  count: number;
  share: number;
  target: boolean;
  classe?: "rival" | "geant" | "outil" | "institution";
  /**
   * Écritures regroupées sous ce nom, quand il y en a.
   *
   * Le regroupement réunit parfois des cabinets juridiquement indépendants du
   * même réseau (« Exco Lyon », « Exco Anthenor »). C'est le bon compte pour
   * mesurer une force concurrentielle, mais il ne doit rien cacher : les
   * variantes restent affichables, et un client qui relève le détail y trouve
   * la réponse plutôt qu'une approximation silencieuse.
   */
  variantes?: string[];
}[] {
  const compte = new Map<string, { count: number; target: boolean; variantes: Set<string> }>();
  for (const m of mentions) {
    const brut = m.brand.trim();
    if (!brut) continue;
    // Les variantes se rangent sous le nom retenu : sans ça, une entreprise
    // citée sous six écritures paraît six fois plus faible qu'elle ne l'est.
    const clef = alias[brut] ?? brut;
    const prev = compte.get(clef) ?? { count: 0, target: m.is_target, variantes: new Set<string>() };
    if (brut !== clef) prev.variantes.add(brut);
    compte.set(clef, { count: prev.count + 1, target: prev.target || m.is_target, variantes: prev.variantes });
  }
  const total = [...compte.values()].reduce((a, b) => a + b.count, 0) || 1;
  const toutes = [...compte.entries()]
    .map(([name, v]) => ({
      name,
      count: v.count,
      share: v.count / total,
      target: v.target,
      ...(v.variantes.size ? { variantes: [...v.variantes].sort() } : {}),
    }))
    .sort((a, b) => b.count - a.count);

  // Les dix premiers, PLUS le client s'il n'y figure pas.
  //
  // La troncature sert l'affichage : dix lignes se lisent, quarante non. Mais
  // le client doit toujours être présent, et pas seulement par courtoisie :
  // `insights.ts` lisait ses citations dans ce tableau, si bien qu'une marque
  // classée onzième était comptée à zéro. Les emails la déclaraient alors
  // « invisible » et annonçaient « absent sur les 20 questions » à une
  // entreprise réellement citée. Une affirmation fausse envoyée à un prospect
  // est la pire erreur que ce produit puisse commettre : elle se vérifie en
  // trente secondes et détruit la crédibilité de toute la mesure.
  const dix = toutes.slice(0, 10);
  if (!dix.some((p) => p.target)) {
    const cible = toutes.find((p) => p.target);
    if (cible) dix.push(cible);
  }
  return dix;
}
