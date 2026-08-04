import { pct, type ScanInsights } from "./insights.js";

/**
 * Les emails envoyés après un scan gratuit.
 *
 * Un seul module pour tous les messages : le ton doit être le même du premier
 * au dernier, et une copie dispersée dans plusieurs fichiers dérive toujours.
 *
 * Trois partis pris tiennent tout le reste :
 *
 *  1. **Aucun chiffre inventé.** Tout sort de `buildScanInsights`, donc de la
 *     base. Un email de prospection qui avance un chiffre faux est mort, et il
 *     tue la crédibilité de la mesure avec lui.
 *  2. **Ses données plutôt que des statistiques.** « 46 % des acheteurs
 *     démarrent sur une IA » est le chiffre de quelqu'un d'autre. « Vos
 *     concurrents cités 253 fois, vous 19 » est le sien, et c'est ce qui fait
 *     ouvrir le rapport.
 *  3. **Le message suit la situation, pas le score.** Un site qui bloque
 *     GPTBot n'a pas un problème de visibilité, il a une cause technique qui
 *     explique tout le reste. Le dire d'abord nous place en expert et non en
 *     vendeur.
 */

const BOOKING = () => process.env.BOOKING_URL || "[LIEN DE RÉSERVATION]";
const SIGNATURE = () => process.env.FOUNDER_SIGNATURE || "Luigi\nCitari";

export interface Email {
  /** 0 = envoyé dès la fin du scan. 1 à 3 = relances programmées. */
  step: number;
  offsetDays: number;
  subject: string;
  body: string;
}

/**
 * Quatre situations, dans cet ordre de priorité.
 *
 * `bloque` passe avant tout, y compris avant un bon score : c'est une cause,
 * pas un symptôme, et elle se vérifie en trente secondes. `solide` protège la
 * promesse faite sur le site, « si votre score est bon, nous vous le dirons et
 * nous ne vous vendrons rien ».
 */
export type Situation = "bloque" | "invisible" | "marginal" | "solide";

export function situationDuScan(i: ScanInsights): Situation {
  if (i.botsBloques.length > 0) return "bloque";
  if (i.score >= 55) return "solide";
  // Le partage invisible/marginal se joue sur la PRÉSENCE, pas sur le score.
  // Le score mélange présence, rang, recommandation et tonalité : une marque
  // citée vingt fois mais mal placée y tombe sous 25, et recevrait alors un
  // message lui expliquant qu'elle n'existe pas, ce qu'elle constaterait faux
  // en ouvrant son propre rapport. Sous 5 % de part de voix, on est du bruit ;
  // au-dessus, on existe et le problème est ailleurs.
  if (i.citationsCible === 0 || i.brandShare < 0.05) return "invisible";
  return "marginal";
}

/* ─────────────────────────── briques communes ─────────────────────────── */

const lienRapport = (i: ScanInsights) =>
  i.reportUrl ? `Votre rapport complet est ici :\n${i.reportUrl}` : "";

/** Le concurrent nommé, ou une formule neutre si aucun ne ressort. */
const rival = (i: ScanInsights) => i.topCompetitor?.name ?? "vos concurrents";

/**
 * Le verbatim : la phrase exacte où une IA recommande un concurrent.
 *
 * C'est notre pièce la plus forte, et de loin. Lire « je recommanderais de
 * contacter Cabinet Perrin-Lacaze » quand on est son concurrent produit un
 * effet qu'aucun argumentaire n'obtient.
 */
/**
 * Nettoie un extrait de réponse pour un email en texte brut.
 *
 * Les moteurs répondent en markdown : « **Evol**, **Comète** ». Recopié tel
 * quel dans un email, l'astérisque saute aux yeux et fait bricolage. On coupe
 * aussi sur une frontière de mot, jamais au milieu d'un mot.
 */
function citation(texte: string, max = 320): string {
  const propre = texte
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (propre.length <= max) return propre;
  const coupe = propre.slice(0, max);
  const dernierEspace = coupe.lastIndexOf(" ");
  return (dernierEspace > max * 0.6 ? coupe.slice(0, dernierEspace) : coupe).replace(/[,;:]$/, "") + "...";
}

function verbatim(i: ScanInsights): string {
  if (!i.killerQuote) return "";
  const { engine, query, excerpt, competitor } = i.killerQuote;
  const extrait = citation(excerpt);
  return `Voici ce que ${engine} répond, mot pour mot, à la question « ${query} » :

« ${extrait} »

${competitor} est nommé. ${i.brand} n'apparaît pas.`;
}

/**
 * L'invitation à vérifier soi-même.
 *
 * Contre-intuitif mais décisif : on donne une vraie question du scan et on
 * l'invite à la poser lui-même. Ça ne coûte rien, ça installe une crédibilité
 * qu'aucune promesse n'achète, et la mise en garde sur la variabilité désamorce
 * d'avance la seule objection possible, « moi je me vois cité ».
 */
function defiVerifiable(i: ScanInsights): string {
  const question = i.missedQueries[0] ?? i.killerQuote?.query;
  if (!question) return "";
  return `Ne me croyez pas sur parole. Ouvrez ChatGPT, copiez cette question, regardez la réponse :

« ${question} »

Les réponses varient d'une fois sur l'autre, c'est précisément pourquoi nous en posons ${i.totalQueries} à plusieurs moteurs plutôt qu'une seule. Mais l'ordre de grandeur, vous le verrez tout de suite.`;
}

/**
 * La demande.
 *
 * On ne vend pas un rendez-vous, on offre un diagnostic. C'est vrai au sens
 * strict : le scan complet n'est lancé que lorsqu'un créneau est réservé, et il
 * coûte réellement de l'argent. Le rendez-vous n'est que la façon de le remettre.
 */
function offreDiagnostic(): string {
  return `Je vous offre le diagnostic complet : les 6 moteurs, 24 questions, 144 réponses, l'audit technique de votre site, et les sources exactes sur lesquelles les IA s'appuient pour recommander vos concurrents.

Il me faut trente minutes avec vous pour vous le présenter, parce qu'un tableau de chiffres sans lecture ne sert à rien.

${BOOKING()}`;
}

const pied = (avecStop = true) =>
  `${SIGNATURE()}${
    avecStop
      ? `

--
Vous recevez cet email parce que vous avez demandé un scan de visibilité IA. Pour ne plus être contacté, répondez « STOP ».`
      : ""
  }`;

/** Assemble en supprimant les blocs vides, pour ne jamais laisser de trou. */
const bloc = (...parties: string[]) => parties.filter((p) => p.trim()).join("\n\n");

/* ───────────────────── l'email immédiat, par situation ───────────────────── */

/**
 * Envoyé dès la fin du scan, pas deux jours après.
 *
 * C'est le seul message dont l'ouverture est quasi certaine : il est attendu,
 * et le prospect vient de voir son score. Deux jours plus tard, l'émotion est
 * retombée et l'ouverture avec elle.
 */
export function emailImmediat(i: ScanInsights): Email {
  const situation = situationDuScan(i);
  const base = { step: 0, offsetDays: 0 };

  if (situation === "bloque") {
    const liste = i.botsBloques.join(", ");
    const site = (i.url ?? "").replace(/\/$/, "");
    return {
      ...base,
      subject: `${i.brand} : votre site bloque ${i.botsBloques[0]}`,
      body: bloc(
        `Bonjour,`,
        `Votre scan de visibilité IA est terminé.`,
        lienRapport(i),
        `Avant même de parler du score, il y a plus urgent, et c'est une bonne nouvelle déguisée.`,
        `Votre fichier robots.txt bloque ${liste}. Ces robots sont ceux par lesquels les IA lisent le web. Tant qu'ils sont bloqués, ces moteurs ne peuvent tout simplement pas lire votre site : quoi que vous publiiez, ils ne le verront jamais.`,
        site
          ? `Vérifiez en trente secondes : ouvrez ${site}/robots.txt et cherchez ${i.botsBloques[0]}.`
          : `Vérifiez en trente secondes : ouvrez votre robots.txt et cherchez ${i.botsBloques[0]}.`,
        `C'est presque toujours involontaire. Beaucoup de sites ont hérité ce réglage d'un CMS ou d'une extension installée en 2023, à une époque où bloquer les robots d'IA passait pour une précaution. Depuis, ces robots sont devenus le chemin par lequel vos clients vous trouvent.`,
        `Pourquoi c'est une bonne nouvelle : c'est une ligne à changer, votre développeur le fait en dix minutes, et c'est le préalable à tout le reste.`,
        verbatim(i),
        offreDiagnostic(),
        pied(),
      ),
    };
  }

  if (situation === "invisible") {
    const jamais = i.citationsCible === 0;
    return {
      ...base,
      subject: i.topCompetitor
        ? `${i.topCompetitor.name} est cité ${i.topCompetitor.count} fois. ${i.brand}, ${jamais ? "jamais" : String(i.citationsCible)}.`
        : `${i.brand} : ${i.score}/100 de visibilité dans les IA`,
      body: bloc(
        `Bonjour,`,
        `Votre scan est terminé : ${i.score}/100.`,
        lienRapport(i),
        `Le chiffre qui compte n'est pas le score, c'est l'écart. Sur les ${i.totalQueries} questions d'achat testées dans votre secteur, ${i.brand} est cité ${jamais ? "zéro fois" : `${i.citationsCible} fois`}. Vos concurrents comparables, ${i.citationsRivaux} fois.${
          i.topCompetitor ? ` ${i.topCompetitor.name} à lui seul en récolte ${i.topCompetitor.count}.` : ""
        }`,
        i.missedCount >= i.totalQueries
          ? `Sur les ${i.totalQueries} questions, sans exception, aucun moteur ne mentionne ${i.brand}. Ce sont des questions que vos prospects posent vraiment, avec l'intention d'acheter.`
          : i.missedCount > 0
            ? `Sur ${i.missedCount} de ces ${i.totalQueries} questions, aucun moteur ne mentionne ${i.brand}. Ce sont des questions que vos prospects posent vraiment, avec l'intention d'acheter.`
            : "",
        verbatim(i),
        defiVerifiable(i),
        `Ce n'est presque jamais une question de budget ni de notoriété. Dans la grande majorité des cas que nous mesurons, l'essentiel vient de trois causes techniques et éditoriales identifiables en une vingtaine de minutes.`,
        offreDiagnostic(),
        pied(),
      ),
    };
  }

  if (situation === "marginal") {
    return {
      ...base,
      subject: `${i.brand} : absent sur ${i.missedCount} des ${i.totalQueries} questions testées`,
      body: bloc(
        `Bonjour,`,
        `Votre scan est terminé : ${i.score}/100.`,
        lienRapport(i),
        `${i.brand} est cité ${i.citationsCible} fois, ce qui vous place déjà devant beaucoup d'entreprises de votre secteur. Votre problème est ailleurs, et il est plus précis.`,
        i.missedCount > 0
          ? `Vous êtes totalement absent sur ${i.missedCount} des ${i.totalQueries} questions testées. Par exemple : « ${i.missedQueries[0]} ». Sur celle-là, les moteurs citent ${rival(i)} et pas vous.`
          : `Vos concurrents comparables sont cités ${i.citationsRivaux} fois contre ${i.citationsCible} pour vous.`,
        verbatim(i),
        defiVerifiable(i),
        `C'est la situation où le travail paye le plus vite. Quand une marque existe déjà mais manque les bonnes questions, il s'agit de combler des trous identifiés, pas de tout construire.`,
        offreDiagnostic(),
        pied(),
      ),
    };
  }

  // solide : on tient la promesse faite sur le site, et on ne vend rien.
  return {
    ...base,
    subject: `${i.brand} : ${i.score}/100, et je n'ai rien à vous vendre`,
    body: bloc(
      `Bonjour,`,
      `Votre scan est terminé : ${i.score}/100.`,
      lienRapport(i),
      `Je vais être direct : c'est un bon score, et je n'ai rien à vous vendre.`,
      `${i.brand} est cité ${i.citationsCible} fois au fil des ${i.totalQueries} questions testées, tous moteurs confondus. La plupart des entreprises que nous mesurons sont très en dessous. Vous faites déjà ce qu'il faut, peut-être sans l'avoir cherché.`,
      i.missedCount > 0
        ? `Un seul angle mort, gratuitement : vous restez absent sur ${i.missedCount} questions, dont « ${i.missedQueries[0]} ». Si ce sujet compte pour votre activité, c'est là qu'il y a quelque chose à récupérer.`
        : "",
      i.llmstxtAbsent
        ? `Détail technique, sans urgence : votre site n'a pas de fichier llms.txt. C'est un résumé court que les moteurs lisent en priorité. Une heure de travail, et ça consolide une position que vous avez déjà.`
        : "",
      `Votre score de départ est archivé avec ses questions. Si vous refaites un scan dans six mois, vous aurez une comparaison exacte, mêmes questions, même formule. C'est la seule façon honnête de savoir si votre position tient.`,
      `Si un jour vous voulez qu'on en parle, mon agenda est ouvert : ${BOOKING()}. Mais dans votre situation, rien ne presse.`,
      pied(),
    ),
  };
}

/* ─────────────────────── les trois relances de rattrapage ─────────────────────── */

/**
 * Pour ceux qui n'ont pas réservé. Le premier email a déjà tout dit du score :
 * répéter le même argument plus fort ne convainc personne. Chacune de ces trois
 * relances apporte donc autre chose, et la dernière sait s'arrêter.
 */
export function emailsDeRelance(i: ScanInsights): Email[] {
  const site = (i.url ?? "").replace(/\/$/, "");
  const sources = i.competitorSources.slice(0, 3);

  return [
    // J+2 : une seule question, très courte. C'est le format qui obtient des réponses.
    {
      step: 1,
      offsetDays: 2,
      subject: `Une question sur ${i.brand}`,
      body: bloc(
        `Bonjour,`,
        `Vous avez mesuré la visibilité IA de ${i.brand} il y a deux jours.`,
        i.missedCount > 0
          ? `Une question, sincèrement : saviez-vous que vous n'apparaissiez sur aucune des ${i.missedCount} questions où vos prospects comparent avant de choisir ?`
          : `Une question, sincèrement : saviez-vous que vos concurrents comparables étaient cités ${i.citationsRivaux} fois contre ${i.citationsCible} pour vous ?`,
        `Si la réponse est non, ça vaut trente minutes. Si c'est oui et que c'est assumé, dites-le-moi et je ne vous relance plus.`,
        `${BOOKING()}`,
        pied(),
      ),
    },

    // J+7 : de la valeur, sans rien demander. Change le rapport de force.
    {
      step: 2,
      offsetDays: 7,
      subject: `Une action à faire vous-même pour ${i.brand}`,
      body: bloc(
        `Bonjour,`,
        `Je reviens sans relancer sur notre offre, avec quelque chose que vous pouvez faire sans nous.`,
        i.botsBloques.length > 0
          ? `Priorité absolue dans votre cas : votre robots.txt bloque ${i.botsBloques.join(", ")}. Tant que ce n'est pas levé, aucun autre effort ne peut porter. Dix minutes pour votre développeur.`
          : `Ouvrez ${site || "votre site"}/robots.txt et cherchez GPTBot, ClaudeBot et PerplexityBot. S'ils y sont bloqués, aucune IA ne peut lire votre site, et tout le reste devient inutile tant que ce n'est pas corrigé.`,
        sources.length > 0
          ? `Autre chose, tirée de votre scan : quand les moteurs recommandent vos concurrents, ils s'appuient régulièrement sur ces sources :\n${sources.map((s) => `  . ${s}`).join("\n")}\n\nY figurer est souvent plus rentable qu'un mois de publicité. Vous pouvez commencer par la première cette semaine, sans nous.`
          : "",
        `Si vous préférez qu'on déroule ça ensemble sur ${i.brand} : ${BOOKING()}`,
        pied(),
      ),
    },

    // J+21 : la clôture. Souvent l'email qui obtient le plus de réponses,
    // parce qu'il rend la main au lieu de la forcer.
    {
      step: 3,
      offsetDays: 21,
      subject: `Je clos votre dossier ${i.brand} ?`,
      body: bloc(
        `Bonjour,`,
        `Sans nouvelles, je pars du principe que le sujet n'est pas prioritaire en ce moment, ce qui est parfaitement légitime.`,
        `Je clos donc votre dossier, sans relance supplémentaire. Trois choses avant :`,
        `1. Votre rapport reste accessible${i.reportUrl ? ` : ${i.reportUrl}` : ""}.
2. Votre score de départ (${i.score}/100) est archivé avec ses ${i.totalQueries} questions. Un scan dans six mois vous donnera une comparaison exacte.
3. Si la situation change, par exemple si un prospect vous dit avoir vu un concurrent dans ChatGPT, écrivez-moi et je reprends le dossier là où on l'a laissé.`,
        `Bonne continuation à ${i.brand}.`,
        `${SIGNATURE()}

--
Vous ne recevrez plus d'email de ma part concernant ce scan.`,
      ),
    },
  ];
}

/** Les quatre messages d'un lead, dans l'ordre. */
export function tousLesEmails(i: ScanInsights): Email[] {
  return [emailImmediat(i), ...emailsDeRelance(i)];
}
