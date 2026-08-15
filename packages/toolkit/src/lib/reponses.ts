import { pct, type ScanInsights } from "./insights.js";
import { situationDuScan } from "./emails.js";

/**
 * Les réponses aux objections, remplies avec les vrais chiffres du prospect.
 *
 * Ce sont des brouillons, pas des envois automatiques : quelqu'un lit le
 * message reçu, choisit la réponse, l'adapte. Mais avoir le bon argument et le
 * bon chiffre sous la main change tout, parce qu'une objection se traite dans
 * l'heure ou ne se traite pas.
 *
 * Deux règles de fond.
 *
 * On ne se défend jamais. Une objection est une question déguisée : « c'est du
 * bullshit » veut dire « prouvez-le », et la bonne réponse est une preuve, pas
 * un argumentaire.
 *
 * On accepte le non. Un prospect qui décline poliment et à qui l'on répond
 * poliment revient parfois six mois plus tard ; un prospect qu'on harcèle ne
 * revient jamais et le raconte.
 */

const BOOKING = () => process.env.BOOKING_URL || "[LIEN DE RÉSERVATION]";
const SIGNATURE = () => process.env.FOUNDER_SIGNATURE || "Luigi\nCitari";

export interface Reponse {
  /** Ce que le prospect a écrit, en une phrase. */
  objection: string;
  /** Pourquoi il l'écrit, et ce qu'il faut viser. */
  lecture: string;
  texte: string;
}

const bloc = (...parties: string[]) => parties.filter((p) => p.trim()).join("\n\n");
const fin = () => `${SIGNATURE()}`;

export function reponsesAuxObjections(i: ScanInsights): Reponse[] {
  const rival = i.topCompetitor?.name ?? "vos concurrents";
  const question = i.missedQueries[0];
  const situation = situationDuScan(i);

  return [
    {
      objection: "« C'est du bullshit, moi je me vois dans ChatGPT. »",
      lecture:
        "La plus importante, et la meilleure nouvelle : il a testé. Ne jamais " +
        "contredire, il a probablement raison sur SON test. Expliquer pourquoi " +
        "une mesure sérieuse donne autre chose qu'un essai unique.",
      texte: bloc(
        `Bonjour,`,
        `Vous avez raison de vérifier, et vous avez sans doute vu ce que vous décrivez. Deux choses expliquent l'écart, et aucune ne remet en cause votre test.`,
        `D'abord, une réponse d'IA change à chaque fois. C'est pour ça que nous posons ${i.totalQueries} questions à plusieurs moteurs plutôt qu'une seule : un essai isolé ne mesure rien, ni dans un sens ni dans l'autre.`,
        `Ensuite, si vous avez tapé votre nom, l'IA vous trouvera toujours. Nous ne prononçons jamais le nom de la marque dans nos questions : nous posons celles que pose un acheteur qui ne vous connaît pas encore, du type « ${question ?? "quel prestataire choisir pour…"} ». C'est là que se joue le fait d'être découvert ou pas.`,
        `Le plus simple : prenez trente minutes, on ouvre le rapport ensemble et vous choisissez la question que vous voulez. On la repose en direct devant vous.`,
        `${BOOKING()}`,
        fin(),
      ),
    },

    {
      objection: "« C'est combien ? »",
      lecture:
        "Bon signe, mais répondre le prix seul tue la vente : 2 900 € sans " +
        "contexte paraît cher. Donner le prix, immédiatement suivi du seuil de " +
        "remboursement, puis ramener au rendez-vous.",
      texte: bloc(
        `Bonjour,`,
        `Le Sprint GEO est à 2 900 € HT, en une fois, 50 % à la commande et 50 % à la livraison. Aucun abonnement, aucune reconduction, et le re-scan à J+90 est inclus.`,
        `Ce qui compte davantage que le prix : avec votre panier moyen, combien de clients faut-il pour le rembourser ? Dans la plupart des cas que nous voyons, un seul suffit. C'est le premier chiffre qu'on regarde ensemble au rendez-vous.`,
        `Et avant ça, le scan complet est offert : les 6 moteurs, ${i.totalQueries === 20 ? 24 : i.totalQueries} questions, l'audit technique de votre site. Vous repartez avec, que vous travailliez avec nous ou non.`,
        `${BOOKING()}`,
        fin(),
      ),
    },

    {
      objection: "« Envoyez-moi une proposition / plus d'infos par email. »",
      lecture:
        "Souvent une façon polie d'éviter l'appel, parfois un vrai besoin de " +
        "faire valider en interne. Ne pas refuser, mais expliquer pourquoi un " +
        "document seul ne sert à rien ici, et proposer un format court.",
      texte: bloc(
        `Bonjour,`,
        `Bien sûr, je peux vous envoyer le détail écrit. Un mot d'honnêteté d'abord : le document seul ne vous servira pas à grand-chose.`,
        `Le scan complet fait ressortir vos questions perdues, les sources qui font gagner ${rival}, et l'état technique de votre site. Ce sont des données brutes : sans quelqu'un pour vous dire lesquelles comptent dans votre cas, ça reste un tableau de chiffres.`,
        `Je vous propose l'inverse : trente minutes où je vous montre le scan complet, et je vous envoie ensuite un écrit qui reprend ce dont on a parlé. Comme ça votre associé ou votre équipe reçoit un document qui a du sens.`,
        `${BOOKING()}`,
        fin(),
      ),
    },

    {
      objection: "« On a déjà une agence SEO. »",
      lecture:
        "Ne jamais attaquer l'agence en place : c'est son choix, le critiquer " +
        "l'oblige à le défendre. Montrer que ce sont deux métiers, et que son " +
        "agence peut très bien faire le sien sans couvrir celui-ci.",
      texte: bloc(
        `Bonjour,`,
        `C'est plutôt bon signe, et je ne viens pas prendre sa place.`,
        `Le SEO vous place dans une liste de liens sur Google. Ici il s'agit d'être cité dans une réponse rédigée par une IA, qui ne donne pas dix liens mais trois noms. Une agence peut très bien faire son travail sur le premier sans que le second suive : c'est mesurable, et c'est ce que votre scan montre déjà.`,
        `Le scan complet est offert et il ne vous engage à rien. S'il montre que votre agence couvre déjà le sujet, je vous le dirai et vous aurez au moins la preuve que c'est bien fait.`,
        `${BOOKING()}`,
        fin(),
      ),
    },

    {
      objection: "« C'est trop cher. »",
      lecture:
        "Rarement une question de budget, plutôt de valeur perçue. Ne jamais " +
        "baisser le prix : ramener à ce qu'un client vaut chez lui, et " +
        "proposer une sortie honnête plutôt qu'une remise.",
      texte: bloc(
        `Bonjour,`,
        `Je comprends, et je ne vais pas négocier : le prix est le même pour tout le monde, c'est aussi ce qui fait que je peux refuser des dossiers.`,
        `La vraie question est ailleurs. Combien vous rapporte un nouveau client sur un an ? Si la réponse dépasse 2 900 €, le sprint se rembourse avec un seul. S'il ne les dépasse pas, c'est moi qui vous dirai de ne pas le faire.`,
        `Et si le budget n'est vraiment pas là aujourd'hui : votre score de départ est archivé avec ses questions. Refaites un scan dans six mois, vous aurez une comparaison exacte, gratuitement. Ça ne me coûte rien et ça vous laisse le temps.`,
        fin(),
      ),
    },

    {
      objection: "« Vous garantissez un résultat ? »",
      lecture:
        "Piège fréquent. Répondre non franchement est ce qui inspire le plus " +
        "confiance, parce que tous les autres répondent oui. Enchaîner " +
        "immédiatement sur ce qui EST garanti.",
      texte: bloc(
        `Bonjour,`,
        `Non, et méfiez-vous de ceux qui vous le promettent.`,
        `Les moteurs intègrent un changement en quatre à douze semaines et personne ne contrôle ce délai. « Premier dans ChatGPT » n'existe même pas : il n'y a pas de classement, seulement une réponse rédigée qui varie d'une fois sur l'autre.`,
        `Ce que je garantis, en revanche, est écrit à l'avance : l'exécution intégrale des trois chantiers, documentée action par action ; la vérification que tout est réellement en ligne ; et une mesure identique avant et après, mêmes questions, mêmes moteurs, même formule. Le re-scan à J+90 est inclus, et je vous le présente même si le résultat est mauvais.`,
        `${BOOKING()}`,
        fin(),
      ),
    },

    {
      objection: "« Pas intéressé. »",
      lecture:
        "Répondre, et clore proprement. Un non respecté revient parfois six " +
        "mois plus tard ; un prospect harcelé ne revient jamais et le raconte. " +
        "Aucune relance après ce message.",
      texte: bloc(
        `Bonjour,`,
        `Entendu, je ne vous relance plus.`,
        `Votre rapport reste accessible${i.reportUrl ? ` : ${i.reportUrl}` : ""}, et votre score de départ (${i.score}/100) est archivé avec ses ${i.totalQueries} questions. Si vous refaites un scan dans six mois, vous aurez une comparaison exacte, sans rien à payer.`,
        `Bonne continuation à ${i.brand}.`,
        `${SIGNATURE()}`,
      ),
    },

    ...(situation === "bloque"
      ? [
          {
            objection: "« Mon développeur dit que le robots.txt est normal. »",
            lecture:
              "Ne pas l'opposer à son développeur, il perdrait la face. Lui " +
              "donner de quoi vérifier en trente secondes : le fait tranche, pas nous.",
            texte: bloc(
              `Bonjour,`,
              `Il a probablement raison sur le fond : ce réglage est courant, et il était même recommandé en 2023. Ce n'est pas une erreur de sa part.`,
              `Le point précis est celui-ci : une ligne interdit l'accès à ${i.botsBloques.join(", ")}. Ouvrez ${(i.url ?? "votre site").replace(/\/$/, "")}/robots.txt et cherchez ${i.botsBloques[0]}, vous verrez la ligne en question.`,
              `Ce qui a changé depuis, c'est que ces robots sont devenus le chemin par lequel vos clients vous trouvent. La question n'est donc pas de savoir qui a raison, mais si vous voulez continuer à les bloquer aujourd'hui.`,
              `${BOOKING()}`,
              fin(),
            ),
          },
        ]
      : []),

    ...(i.brandShare > 0
      ? [
          {
            objection: "« Mais je suis quand même cité, non ? »",
            lecture:
              "Il a raison, et le reconnaître désarme. Déplacer ensuite le " +
              "sujet du fait d'être cité vers celui d'être cité AU BON MOMENT.",
            texte: bloc(
              `Bonjour,`,
              `Oui, et c'est vrai : vous êtes cité ${i.citationsCible} fois, ce qui vous place déjà devant beaucoup d'entreprises de votre secteur.`,
              `Le problème n'est pas d'apparaître, c'est d'apparaître au moment où quelqu'un choisit. Sur ${i.missedCount} des ${i.totalQueries} questions testées, vous n'apparaissez sur aucun moteur, et ce sont justement des questions d'achat. Pendant ce temps ${rival} y est, avec ${pct(i.topCompetitor?.share ?? 0)} de part de voix contre ${pct(i.brandShare)} pour vous.`,
              `C'est plutôt une bonne situation : quand une marque existe déjà mais manque les bonnes questions, il s'agit de combler des trous identifiés, pas de tout construire. C'est là que le travail paye le plus vite.`,
              `${BOOKING()}`,
              fin(),
            ),
          },
        ]
      : []),
  ];
}
