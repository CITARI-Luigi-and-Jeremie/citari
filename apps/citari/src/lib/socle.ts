/**
 * LE SOCLE : le second axe, celui qui départage les invisibles (18/08/2026).
 *
 * Le score de visibilité mesure UNE chose : est-ce que les moteurs vous
 * citent. Il est figé, et il est juste — zéro mention vaut zéro. Mais sur
 * nos 110 mesures, 77 sont à exactement 0 : sur le segment que Citari vend,
 * le score ne départage plus rien, et deux entreprises à 0 peuvent être dans
 * des états très différents.
 *
 * Le socle mesure l'AUTRE chose : êtes-vous en état d'être cité. Il ne
 * touche jamais au score, ne s'additionne jamais avec lui, et ne se présente
 * jamais comme une note sur 100 — c'est un état des lieux, pas une
 * performance. On ne relève surtout PAS le plancher du score : cinq points
 * offerts pour un llms.txt feraient passer une entreprise invisible mais
 * rangée (5) devant une entreprise réellement citée une fois sur quarante
 * (3), et le classement s'inverserait.
 *
 * Règle du dénominateur, comme partout : un critère qu'on n'a pas mesuré ne
 * compte pas. En aperçu, les moteurs ne lisent pas le web : le critère de la
 * matière lue n'est pas applicable, il sort du dénominateur au lieu d'être
 * compté comme un échec.
 */

export type CritereSocle = {
  cle: "acces" | "identite" | "reconnaissance" | "matiere";
  libelle: string;
  /** Ce que le prospect doit comprendre, en français courant. */
  detail: string;
  /** Le critère a-t-il pu être mesuré sur ce scan ? */
  mesure: boolean;
  /** Est-il satisfait ? Toujours false si non mesuré. */
  atteint: boolean;
};

export type Socle = {
  criteres: CritereSocle[];
  /** Critères satisfaits. */
  points: number;
  /** Critères réellement mesurés : le dénominateur honnête. */
  mesures: number;
  /**
   * Le départage, de 0 à 100, pour ordonner des entreprises toutes à 0 de
   * visibilité. `null` si rien n'a pu être mesuré : on n'invente pas un
   * classement à partir de rien.
   */
  rang: number | null;
};

type Audit = {
  bots?: Record<string, string> | null;
  llmstxt?: boolean | null;
} | null;

/** Un robot est bloqué si l'audit le dit explicitement. « non_mentionne »
 *  n'est pas un blocage : le robots.txt ne le nomme pas, donc il passe. */
function robotsBloques(bots: Record<string, string> | null | undefined): string[] {
  if (!bots) return [];
  return Object.entries(bots)
    .filter(([, etat]) => etat === "bloque" || etat === "interdit")
    .map(([nom]) => nom);
}

export function socleGeo(entree: {
  audit: unknown;
  /** Les réponses miroir : les moteurs savent-ils dire qui vous êtes ? */
  miroir: { moteur?: string; texte?: string }[] | null;
  /** Lectures des moteurs sur le site du client (0 en aperçu). */
  lecturesVotreSite: number;
  /** Le scan a-t-il collecté des sources ? Faux en aperçu : sans recherche
   *  web, l'absence de lecture ne prouve rien. */
  sourcesCollectees: boolean;
  /** Les moteurs qui ont nommé la marque au moins une fois. */
  moteursQuiCitent?: number;
}): Socle {
  const audit = (entree.audit ?? null) as Audit;
  const bots = audit?.bots ?? null;
  const bloques = robotsBloques(bots);

  // Un miroir « reconnaissant » : une réponse d'au moins 200 signes, où le
  // moteur décrit l'entreprise au lieu de dire qu'il ne la connaît pas. On
  // reste volontairement grossier : c'est un état des lieux, pas une note.
  const miroirs = Array.isArray(entree.miroir) ? entree.miroir : [];
  const reconnaissants = miroirs.filter((m) => {
    const t = (m?.texte ?? "").toLowerCase();
    if (t.length < 200) return false;
    const ignorance = [
      "je ne trouve",
      "je n'ai pas d'information",
      "je ne dispose pas",
      "aucune information",
      "je ne connais pas",
      "ne figure pas",
      "pas de trace",
    ];
    return !ignorance.some((phrase) => t.includes(phrase));
  }).length;

  const criteres: CritereSocle[] = [
    {
      cle: "acces",
      libelle: "Les robots d'IA peuvent lire votre site",
      detail: bloques.length
        ? `robots.txt : ${bloques.join(", ")} bloqué${bloques.length > 1 ? "s" : ""}`
        : "robots.txt : aucun robot d'IA bloqué",
      mesure: bots !== null,
      atteint: bots !== null && bloques.length === 0,
    },
    {
      cle: "identite",
      libelle: "Votre identité est écrite pour les machines",
      detail: audit?.llmstxt ? "fichier llms.txt présent" : "fichier llms.txt absent",
      mesure: audit !== null,
      atteint: Boolean(audit?.llmstxt),
    },
    {
      cle: "reconnaissance",
      libelle: "Les moteurs savent dire qui vous êtes",
      detail: miroirs.length
        ? `${reconnaissants} moteur${reconnaissants > 1 ? "s" : ""} sur ${miroirs.length} vous ${reconnaissants > 1 ? "décrivent" : "décrit"} quand on ${miroirs.length > 1 ? "leur" : "lui"} donne votre nom`
        : "question miroir non posée sur ce scan",
      mesure: miroirs.length > 0,
      atteint: reconnaissants > 0,
    },
    {
      cle: "matiere",
      libelle: "Les moteurs sont allés lire votre site",
      detail: entree.sourcesCollectees
        ? `${entree.lecturesVotreSite} lecture${entree.lecturesVotreSite > 1 ? "s" : ""} de vos pages pendant la mesure`
        : "aperçu : les moteurs répondent de mémoire, sans lire le web",
      // En aperçu, aucune source n'est collectée : le critère n'est pas
      // mesurable, il sort du dénominateur au lieu de compter comme un échec.
      mesure: entree.sourcesCollectees,
      atteint: entree.sourcesCollectees && entree.lecturesVotreSite > 0,
    },
  ];

  const mesures = criteres.filter((c) => c.mesure).length;
  const points = criteres.filter((c) => c.mesure && c.atteint).length;

  return {
    criteres,
    points,
    mesures,
    rang: mesures ? Math.round((points / mesures) * 100) : null,
  };
}

/**
 * LE PLANCHER DU SOCLE : la formule v2 (18/08/2026, décision Luigi).
 *
 * 70 % des mesures sortaient à exactement 0 : le score ne départageait plus
 * rien sur le segment vendu. La v2 donne un PLANCHER au score : une
 * entreprise jamais citée mais prête à l'être ne vaut pas zéro, elle vaut
 * jusqu'à 5 points, au prorata des critères de socle mesurés. Le max() est
 * la clef de la justesse : dès que la visibilité réelle dépasse le plancher,
 * lui seul compte, et une entreprise réellement citée (une seule présence
 * neutre vaut déjà ~6) reste devant toutes les invisibles. Le plancher ne
 * s'additionne jamais : il n'y a pas de « bonus technique ».
 *
 * La formule reste versionnée et comparable : la v2 a été appliquée
 * RÉTROACTIVEMENT à toute la base le 18/08/2026, donc J0 et J+90 parlent la
 * même langue. Toute évolution future suit la même règle : versionner,
 * recalculer toute la base, publier sur /methode.
 */
export const PLANCHER_MAX = 5;

export function avecPlancher(visibilite: number, socle: Socle): number {
  const v = Math.round(visibilite);
  if (socle.mesures === 0) return v;
  const plancher = Math.round((socle.points / socle.mesures) * PLANCHER_MAX);
  return Math.max(v, plancher);
}

/** Le mot du socle, pour l'afficher sans jamais ressembler à une note. */
export function motSocle(s: Socle): string {
  if (s.rang === null) return "non relevé";
  if (s.points === s.mesures) return "prêt à être cité";
  if (s.points === 0) return "rien en place";
  return "partiellement en place";
}
