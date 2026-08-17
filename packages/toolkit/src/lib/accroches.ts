import { citationAutourDe, contientNom, coupePhrase, pct, type ScanInsights } from "./insights.js";

/**
 * Ce qui, dans un scan, donne le plus envie d'appeler.
 *
 * Un scan produit six ou sept faits marquants. Un email n'en a qu'un à jouer
 * en objet et en première phrase : c'est lui qui décide si le message est
 * ouvert, et si l'ouverture donne envie de réserver. Les autres faits suivent
 * dans le corps, ils ne sont pas perdus.
 *
 * L'ordre n'est PAS l'ordre causal. On avait placé le blocage technique en
 * tête parce que c'est la cause de tout le reste, ce qui est vrai et ce qui
 * était une erreur commerciale : « votre site bloque GPTBot » est un constat
 * technique, pas une menace, et il souffle au dirigeant que le problème est
 * petit et gratuit à régler. Il éteint l'envie d'appeler au lieu de l'allumer.
 *
 * Le classement suit donc la force de vente, mesurée sur quatre critères :
 *
 *  1. **Est-ce SON nom ?** Un concurrent qu'il a lui-même saisi bat tout le
 *     reste : il l'a nommé avant de connaître le résultat, donc il y pense
 *     déjà, et le chiffre ne fait que confirmer une inquiétude existante.
 *  2. **Est-ce une phrase ou un chiffre ?** Lire une IA recommander un
 *     concurrent mot pour mot frappe plus fort qu'un pourcentage.
 *  3. **Est-ce une perte ?** Ce qui menace le chiffre d'affaires bat ce qui
 *     décrit un état.
 *  4. **Peut-il le vérifier ?** Un fait vérifiable en trente secondes vaut
 *     mieux qu'une affirmation, même juste.
 *
 * La force est calculée, pas figée : l'écart vaut selon son ampleur, un
 * rapport de 2 pour 1 n'a rien à voir avec 50 pour 1. Mais chaque type reste
 * dans une PLAGE bornée, sinon une formule qui grimpe vite finit par dépasser
 * une accroche qui devrait la battre par nature. Les plages, du plus fort au
 * plus faible :
 *
 *   concurrent nommé   88 à 98   son nom, sa crainte confirmée
 *   verbatim                84   une phrase qu'on ne discute pas
 *   absence totale          80   le seul chiffre qu'on ne relativise pas
 *   écart brut         45 à 78   selon l'ampleur du rapport
 *   questions perdues  40 à 75   selon la part manquée
 *   blocage technique       52   crédible, mais il éteint l'envie d'appeler
 */

export type TypeAccroche =
  | "concurrent-nomme"
  | "verbatim"
  | "absence"
  | "ecart"
  | "questions-perdues"
  | "technique";

export interface Accroche {
  type: TypeAccroche;
  /** 0 à 100. Sert au classement, et à expliquer pourquoi celle-ci a gagné. */
  force: number;
  /** Pourquoi elle vaut ce qu'elle vaut, pour la relecture humaine. */
  pourquoi: string;
  sujet: string;
  /** Le paragraphe d'ouverture, juste après le lien du rapport. */
  ouverture: string;
}

/** Borne une valeur entre 0 et 100, pour que les bonus ne dérapent pas. */
const borne = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function accrochesClassees(i: ScanInsights): Accroche[] {
  const out: Accroche[] = [];
  const jamais = i.citationsCible === 0;

  // 1. Le concurrent qu'il a nommé lui-même, et qui le domine.
  //
  // La plus forte de toutes, et de loin. Il a écrit ce nom dans le formulaire
  // avant de connaître le moindre résultat : il y pense déjà, il le redoute
  // peut-être. Le chiffre ne lui apprend pas un concurrent, il confirme une
  // inquiétude, et c'est beaucoup plus difficile à ignorer.
  const nomme = [...i.concurrentsSuivis]
    .filter((c) => c.citations > 0)
    .sort((a, b) => b.citations - a.citations)[0];
  if (nomme && (jamais || nomme.citations >= i.citationsCible * 2)) {
    const rapport = jamais ? Infinity : nomme.citations / i.citationsCible;
    out.push({
      type: "concurrent-nomme",
      // 88 de base, jusqu'à +10 quand l'écart est écrasant.
      force: borne(88 + Math.min(10, (Number.isFinite(rapport) ? rapport : 12) - 2)),
      pourquoi: `Il a nommé ${nomme.saisi} lui-même : le chiffre confirme une inquiétude qu'il avait déjà.`,
      // Son mot à lui, retourné avec une information nouvelle. Pas un chiffre
      // dans l'objet : la confirmation suffit, les nombres suivent dedans.
      sujet: `Vous nous avez cité ${nomme.saisi}. Les IA aussi.`,
      ouverture: `Vous nous aviez cité ${nomme.saisi}. Les moteurs le mentionnent ${nomme.citations} fois sur les ${i.totalQueries} questions testées. ${i.brand} : ${jamais ? "zéro" : i.citationsCible}.`,
    });
  }

  // 2. Le verbatim : une IA qui recommande un concurrent, mot pour mot.
  //
  // Rien ne remplace la phrase brute. Un pourcentage se discute, une citation
  // se lit, et on ne discute pas ce qu'on lit de ses propres yeux.
  if (i.killerQuote) {
    out.push({
      type: "verbatim",
      force: 84,
      pourquoi: "Une phrase se lit, un pourcentage se discute.",
      // L'article défini promet une pièce précise : c'est ce qu'on ouvre.
      sujet: `La phrase où une IA recommande votre concurrent`,
      // La coupe finit sur une phrase : un « mot pour mot » tronqué en plein
      // mot ruine exactement ce qu'il prétend prouver.
      // L'extrait s'ouvre là où le concurrent est nommé : sinon la citation
      // s'arrête avant lui et la phrase qui suit affirme une preuve que le
      // lecteur ne voit pas. Même règle que dans emails.ts, même fonction.
      ouverture: (() => {
        const extrait = citationAutourDe(i.killerQuote.excerpt, i.killerQuote.competitor, 300);
        const constat = contientNom(extrait, i.killerQuote.competitor)
          ? `${i.killerQuote.competitor} est nommé. ${i.brand} n'apparaît pas.`
          : `${i.brand} n'y apparaît pas.`;
        return `Voici ce que ${i.killerQuote.engine} répond, mot pour mot, à la question « ${i.killerQuote.query} » :\n\n« ${extrait} »\n\n${constat}`;
      })(),
    });
  }

  // 3. L'absence totale. Brutal, simple, indiscutable.
  if (jamais) {
    out.push({
      type: "absence",
      force: 80,
      pourquoi: "Zéro est le seul chiffre qu'on ne peut pas relativiser.",
      sujet: `Les IA répondent à vos clients sans vous citer`,
      ouverture: `Sur les ${i.totalQueries} questions d'achat testées dans votre secteur, aucun moteur ne mentionne ${i.brand}. Pas une seule fois. Vos concurrents comparables, ${i.citationsRivaux} fois.`,
    });
  }

  // 4. L'écart brut, dont la force dépend de son ampleur.
  //
  // Deux pour un ne dit rien, cinquante pour un est un constat de disparition.
  // D'où une force calculée plutôt que fixe.
  if (!jamais && i.citationsRivaux > i.citationsCible) {
    const rapport = i.citationsRivaux / Math.max(1, i.citationsCible);
    out.push({
      type: "ecart",
      // Plafonné à 78 : un écart, même énorme, reste un chiffre. Il ne doit
      // pas passer devant une phrase citée ni devant un nom que le prospect a
      // lui-même donné.
      force: borne(45 + Math.min(33, rapport * 4)),
      pourquoi: `Rapport de ${rapport.toFixed(1)} pour 1 : ${rapport >= 5 ? "l'écart parle tout seul" : "l'écart existe mais reste discutable"}.`,
      // Compté en RÉPONSES, l'unité du rapport : l'objet, l'ouverture et la
      // page que le prospect ouvre ensuite doivent dire le même nombre.
      sujet: i.topCompetitor
        ? `${i.topCompetitor.name} cité dans ${i.topCompetitor.reponses} réponses. Vous, ${i.reponsesAvecMarque}.`
        : `${i.brand} : ${i.citationsCible} citations contre ${i.citationsRivaux} pour vos concurrents`,
      ouverture: `Le chiffre qui compte n'est pas le score, c'est l'écart. Sur les ${i.reponsesTotal} réponses obtenues, ${i.brand} apparaît dans ${i.reponsesAvecMarque}.${
        i.topCompetitor ? ` ${i.topCompetitor.name}, dans ${i.topCompetitor.reponses}.` : ` Vos concurrents comparables totalisent ${i.citationsRivaux} citations.`
      }`,
    });
  }

  // 5. Les questions perdues, force proportionnelle à la part manquée.
  if (i.missedCount > 0 && i.totalQueries > 0) {
    const part = i.missedCount / i.totalQueries;
    out.push({
      type: "questions-perdues",
      // Plafonné à 75, sous l'absence totale : « absent sur 20 des 20 » et
      // « cité zéro fois » disent la même chose, et la seconde formulation
      // frappe plus fort.
      force: borne(40 + part * 35),
      pourquoi: `${pct(part)} des questions d'achat sans aucune mention : c'est précis et actionnable.`,
      sujet: `Absent sur ${i.missedCount} questions que posent vos clients`,
      ouverture: `Vous êtes totalement absent sur ${i.missedCount} des ${i.totalQueries} questions testées.${
        i.missedQueries[0] ? ` Par exemple : « ${i.missedQueries[0]} ».` : ""
      } Ce sont des questions que vos prospects posent au moment de choisir.`,
    });
  }

  // 6. Le blocage technique.
  //
  // Volontairement en bas, malgré sa valeur de preuve. C'est une CAUSE, pas
  // une perte : le dirigeant y entend « une ligne à changer » et se dit que
  // son développeur s'en charge. Excellent pour la crédibilité, mauvais pour
  // l'envie d'appeler. Il reste toujours dans le corps du message, jamais en
  // objet sauf quand rien de plus fort n'existe.
  if (i.botsBloques.length > 0) {
    out.push({
      type: "technique",
      force: 52,
      pourquoi: "Vérifiable en trente secondes, donc très crédible, mais c'est une cause et non une perte : il entend « une ligne à changer ».",
      sujet: `${i.brand} : votre site bloque ${i.botsBloques[0]}`,
      ouverture: `Votre fichier robots.txt bloque ${i.botsBloques.join(", ")}. Ces robots sont ceux par lesquels les IA lisent le web : tant qu'ils sont bloqués, ces moteurs ne peuvent pas lire votre site, quoi que vous publiiez.`,
    });
  }

  return out.sort((a, b) => b.force - a.force);
}

/** La plus forte, ou null si le scan n'a rien donné d'exploitable. */
export function meilleureAccroche(i: ScanInsights): Accroche | null {
  return accrochesClassees(i)[0] ?? null;
}
