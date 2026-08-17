import { dateFr } from "@/lib/typo";
import {
  extrait,
  hoteClient,
  hoteDeSource,
  questionsGagnables,
  type DonneesDocument,
  type LigneSourceReponse,
} from "@/lib/rapport-complet";
import type { LigneMention, LigneQuestion } from "@/lib/rapport-apercu";
import type { AnalyseIa } from "@/lib/analyse.server";

/**
 * LA VISIO : le support de présentation du scan complet.
 *
 * Refonte de CONTENU du 17/08/2026, sur le document étalon de Luigi. La règle
 * de composition est désormais un GABARIT EN TROIS BLOCS, identique sur les
 * dix-sept écrans :
 *
 *   LE MESSAGE — ce que le consultant dit à voix haute, une phrase.
 *   LA DONNÉE  — les chiffres bruts, cités, vérifiables dans le scan.
 *   LE SENS    — l'enseignement stratégique, jamais une paraphrase du chiffre.
 *
 * Un écran sans les trois n'est pas terminé, et un écran dont la donnée
 * manque sort du déroulé. Tout est assemblé ici, en fonctions pures : la
 * page ne fait qu'afficher.
 *
 * Ce que le passage sur données réelles a corrigé du document étalon, et qui
 * ne doit pas revenir : les comptages en CITATIONS (« Wojo 92, Morning 91 »)
 * sont ceux de `share_of_voice`, la colonne que la maison interdit ; l'unité
 * est la réponse (Wojo 86, Morning 83). Et la somme des rivaux double-compte
 * les réponses où ils coexistent : on affiche leur UNION.
 */

type EtatCellule = "cite" | "absent" | "erreur";

/** Le socle commun à tous les écrans : les trois blocs du gabarit. */
export type Socle = {
  /** Le rôle de l'écran, en mono capitales : nomme le contenu, jamais le bloc. */
  kicker: string;
  /** La phrase dite à voix haute. */
  message: string;
  /** L'enseignement. Deux à trois lignes, français courant, zéro jargon. */
  sens: string;
};

export type EcranVisio = Socle &
  (
    | {
        type: "score";
        score: number;
        vosReponses: number;
        lues: number;
        /** Les rivaux, et surtout l'UNION de leurs réponses (jamais la somme). */
        rivaux: { nom: string; reponses: number }[];
        unionRivaux: number;
        partDeVoix: number | null;
        apercu: { score: number; date: string } | null;
      }
    | { type: "sommaire"; points: string[] }
    | {
        type: "demandes";
        lignes: { titre: string; posees: number; citees: number; exemple: string }[];
        total: number;
      }
    | {
        type: "vocabulaire";
        termes: { terme: string; reponses: number; questions: number; camp: string }[];
        lues: number;
      }
    | {
        type: "risque";
        sujets: string[];
        posees: number;
        total: number;
        citees: number;
      }
    | {
        type: "podium";
        lignes: { nom: string; reponses: number; reco: number; cible: boolean }[];
        lues: number;
        positionMoyenne: number | null;
      }
    | {
        /** L'écran le plus fort du dossier : le site du client est LU comme
         *  source, et la réponse ne le nomme pas. */
        type: "lu-pas-cite";
        hote: string;
        reponsesQuiLisent: number;
        sansCitation: { question: string; moteur: string; rang: number; premiere: boolean }[];
        premiereSource: number;
      }
    | {
        type: "portes";
        lignes: { hote: string; lectures: number; genre: "vous" | "concurrent" | "tiers" }[];
        totalLectures: number;
        totalDomaines: number;
        lecturesVotreSite: number;
        exAequo: string | null;
      }
    | {
        type: "moteurs";
        lignes: { moteur: string; score: number | null; citations: number; sources: number }[];
        sansSource: string[];
      }
    | {
        type: "inventions";
        lignes: { moteur: string; phrase: string; nature: string }[];
        secteurDeclare: string | null;
      }
    | {
        type: "percees";
        lignes: { question: string; moteur: string; position: number; verbatim: string }[];
        questionsPortantes: number;
        total: number;
        moteursQuiCitent: string[];
      }
    | {
        type: "territoires";
        lignes: { titre: string; detail: string }[];
      }
    | { type: "portes5"; cibles: { hote: string; lectures: number }[]; totalLectures: number }
    | { type: "contenus"; pages: { titre: string; lus: string[] }[] }
    | { type: "gratuit"; gestes: { titre: string; detail: string }[] }
    | { type: "bascule"; rival: string; reponsesRival: number; lues: number }
    | {
        type: "sprint";
        chantiers: { titre: string; seul: string; avecNous: string[] }[];
        preuve: string[];
      }
    | { type: "decision"; dateRemesure: string; vosReponses: number; lues: number; places: number | null }
  );

export type ActeVisio = { nom: string; debut: number };

const ACTES = [
  "LE VERDICT",
  "VOS ACHETEURS",
  "POURQUOI EUX",
  "LE PLAN",
  "VOUS, SEUL",
  "LA DÉCISION",
] as const;

/** completed_at + 90 jours, calculé depuis la donnée, jamais depuis l'horloge. */
export function dateRemesure(completedAt: string): string {
  const d = new Date(completedAt);
  d.setDate(d.getDate() + 90);
  return dateFr(d);
}

/**
 * Les domaines où une citation est POSSIBLE : on écarte les sites détenus
 * par un rival ou un géant (on ne sera jamais inscrit sur deskeo.com), en
 * rapprochant l'hôte des noms de marques classées. Heuristique assumée :
 * elle peut laisser passer un domaine concurrent inconnu, jamais en inventer.
 */
export function domainesCitables(
  domaines: { hote: string; lectures: number; votreSite: boolean }[],
  classes: Record<string, string>,
  alias: Record<string, string>,
): { hote: string; lectures: number }[] {
  const noms = new Set<string>();
  for (const [marque, classe] of Object.entries(classes)) {
    if (classe === "rival" || classe === "geant") {
      noms.add(marque.toLowerCase().replace(/[^a-z0-9]/g, ""));
    }
  }
  for (const [variante, canonique] of Object.entries(alias)) {
    const classe = classes[canonique];
    if (classe === "rival" || classe === "geant") {
      noms.add(variante.toLowerCase().replace(/[^a-z0-9]/g, ""));
    }
  }
  return domaines
    .filter((d) => {
      if (d.votreSite) return false;
      const racine = (d.hote.split(".")[0] ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!racine) return false;
      for (const nom of noms) {
        if (nom.length >= 4 && (racine === nom || racine.startsWith(nom))) return false;
      }
      return true;
    })
    .map(({ hote, lectures }) => ({ hote, lectures }));
}

/**
 * Les sites que les moteurs ont RÉELLEMENT lus pour répondre à UNE question,
 * classés par nombre de lectures. Calcul pur sur les sources stockées.
 */
export function sourcesParQuestion(
  reponses: LigneSourceReponse[],
  queryId: string,
  max = 3,
): string[] {
  const parHote = new Map<string, number>();
  for (const r of reponses) {
    if (r.error || r.query_id !== queryId) continue;
    const liste = Array.isArray(r.sources) ? (r.sources as { url?: unknown }[]) : [];
    for (const src of liste) {
      if (typeof src?.url !== "string") continue;
      const hote = hoteDeSource(src.url);
      if (!hote) continue;
      parHote.set(hote, (parHote.get(hote) ?? 0) + 1);
    }
  }
  return [...parHote.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([hote]) => hote);
}

/**
 * LE FAIT LE PLUS VENDEUR DU DOSSIER : les réponses qui ont LU le site du
 * client sans jamais le nommer. Deux mesures, toutes deux pures : combien de
 * réponses l'ont lu, et parmi elles lesquelles ne le citent pas — avec le
 * rang de la source dans la liste, parce que « première source lue, marque
 * absente du texte » est le constat qui fait taire une salle.
 */
export function luSansEtreCite(
  reponses: LigneSourceReponse[],
  mentions: LigneMention[],
  site: string | null,
  questions: LigneQuestion[],
): {
  hote: string;
  reponsesQuiLisent: number;
  premiereSource: number;
  sansCitation: { question: string; moteur: string; rang: number; premiere: boolean }[];
} | null {
  const client = hoteClient(site);
  if (!client) return null;

  const citee = new Set(mentions.filter((m) => m.is_target).map((m) => m.response_id));
  const qParId = new Map(questions.map((q) => [q.id, q]));
  let reponsesQuiLisent = 0;
  let premiereSource = 0;
  const sansCitation: { question: string; moteur: string; rang: number; premiere: boolean }[] = [];

  for (const r of reponses) {
    if (r.error) continue;
    const liste = Array.isArray(r.sources) ? (r.sources as { url?: unknown }[]) : [];
    let rang = 0;
    for (let i = 0; i < liste.length; i += 1) {
      const url = liste[i]?.url;
      if (typeof url !== "string") continue;
      const hote = hoteDeSource(url);
      if (hote && (hote === client || hote.endsWith(`.${client}`))) {
        rang = i + 1;
        break;
      }
    }
    if (!rang) continue;
    reponsesQuiLisent += 1;
    if (rang === 1) premiereSource += 1;
    if (!citee.has(r.id)) {
      const q = qParId.get(r.query_id);
      sansCitation.push({
        question: q?.text ?? "",
        moteur: r.engine,
        rang,
        premiere: rang === 1,
      });
    }
  }

  if (!reponsesQuiLisent) return null;
  sansCitation.sort((a, b) => a.rang - b.rang || a.moteur.localeCompare(b.moteur));
  return { hote: client, reponsesQuiLisent, premiereSource, sansCitation };
}

/**
 * Le vocabulaire du marché : le modèle a PROPOSÉ les termes, le code les
 * COMPTE. Unité : la réponse (un terme employé trois fois dans une réponse
 * compte pour une). Un terme jamais employé sort de la liste.
 */
export function compterLexique(
  termes: { terme: string; camp: string }[],
  reponses: LigneSourceReponse[],
  questions: LigneQuestion[],
): { terme: string; reponses: number; questions: number; camp: string }[] {
  // Singularisation grossière mais nécessaire : sans elle, « bureau opéré »
  // ne voit pas « bureaux opérés » et sous-compte d'un cinquième.
  const normal = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/(\w)[sx]\b/g, "$1")
      .replace(/\s+/g, " ");
  const textes = reponses.filter((r) => !r.error && r.raw_text).map((r) => normal(String(r.raw_text)));
  const textesQ = questions.map((q) => normal(q.text));

  return termes
    .map((t) => {
      const cible = normal(t.terme);
      return {
        terme: t.terme,
        camp: t.camp,
        reponses: textes.filter((x) => x.includes(cible)).length,
        questions: textesQ.filter((x) => x.includes(cible)).length,
      };
    })
    .filter((t) => t.reponses > 0)
    .sort((a, b) => b.reponses - a.reponses || a.terme.localeCompare(b.terme));
}

/** Le libellé « moment d'achat » d'une intention, en langage courant. */
function momentDe(intent: string, ville: string | null): string {
  switch (intent) {
    case "comparative":
      return "Ils comparent les offres";
    case "probleme":
      return "Ils cherchent les pièges";
    case "locale":
      return ville ? `Ils cherchent à ${ville}` : "Ils cherchent près de chez eux";
    case "confiance":
      return "Ils vérifient avant de signer";
    default:
      return intent;
  }
}

/** Accord au pluriel, sans encombrer les gabarits. */
const s_ = (n: number) => (n > 1 ? "s" : "");

export function construireVisio(entree: {
  donnees: DonneesDocument;
  questions: LigneQuestion[];
  mentions: LigneMention[];
  classes: Record<string, string>;
  alias: Record<string, string>;
  date: string;
  completedAt: string;
  apercu: { score: number; date: string } | null;
  score: number;
  reponses: LigneSourceReponse[];
  analyse: AnalyseIa | null;
  /** Le secteur DÉCLARÉ au scan : affiché tel quel, sans jugement. */
  secteur: string | null;
  places: number | null;
}): { ecrans: EcranVisio[]; actes: ActeVisio[] } {
  const { donnees, score } = entree;
  const lues = donnees.echantillon.reponsesLues;
  const vous = donnees.voix.vosReponses;
  const marque = donnees.marque;
  const ecrans: EcranVisio[] = [];
  const actes: ActeVisio[] = [];
  const ouvrirActe = (n: number) => actes.push({ nom: ACTES[n]!, debut: ecrans.length });

  const gagnables = questionsGagnables(
    donnees.matrice,
    entree.mentions,
    entree.classes,
    entree.alias,
    6,
  );
  const citables = domainesCitables(donnees.sources.domaines, entree.classes, entree.alias);
  const quand = dateRemesure(entree.completedAt);

  // Les rivaux : les trois premiers concurrents atteignables, comptés en
  // réponses, et surtout l'UNION de leurs réponses.
  const rivaux = donnees.voix.lignes
    .filter((l) => !l.cible && (l.classe === "rival" || l.classe === null))
    .slice(0, 3);
  const nomsRivaux = new Set(rivaux.map((r) => r.nom));
  const unionRivaux = new Set(
    entree.mentions
      .filter((m) => !m.is_target && nomsRivaux.has(entree.alias[m.brand] ?? m.brand))
      .map((m) => m.response_id),
  ).size;
  const rival0 = rivaux[0] ?? null;

  /* ---------------------------------------------- acte 1 · le verdict */
  ouvrirActe(0);

  ecrans.push({
    type: "score",
    kicker: `mesure du ${entree.date} · ${donnees.echantillon.questions} questions · ${donnees.echantillon.moteurs} moteurs`,
    message: `${score} sur 100. Et ce chiffre est presque optimiste.`,
    sens:
      unionRivaux > 0
        ? `Vous n'êtes pas en retard dans une course, vous êtes absent du récit que les IA font de votre marché. Quand un dirigeant leur demande vers qui aller, la conversation se passe sans vous ${lues - vous} fois sur ${lues}.`
        : `Vous n'êtes pas en retard dans une course, vous êtes absent du récit que les IA font de votre marché.`,
    score,
    vosReponses: vous,
    lues,
    rivaux: rivaux.map((r) => ({ nom: r.nom, reponses: r.reponses })),
    unionRivaux,
    partDeVoix: donnees.voix.marquesTotal ? vous / lues : null,
    apercu: entree.apercu,
  });

  ecrans.push({
    type: "sommaire",
    kicker: "le déroulé",
    message: "Quatre choses, dans l'ordre.",
    sens:
      "Rien de ce qui suit ne vient d'une étude de marché : tout est relevé dans vos propres réponses, et chaque chiffre se retrouve dans le document de mesure.",
    points: [
      "Qui pose ces questions, et avec quels mots",
      `Pourquoi ce sont ${rival0 ? rival0.nom : "vos concurrents"} et pas vous qui y répondez`,
      "Comment reprendre la place, question par question",
      "Ce que vous pouvez faire seul dès cette semaine",
    ],
  });

  /* ------------------------------------------- acte 2 · vos acheteurs */
  ouvrirActe(1);

  const moments = donnees.intentions
    .filter((i) => i.posees > 0)
    .map((i) => {
      const perdue = donnees.matrice.lignes.find(
        (l) => l.intent === i.intent && l.mesuree && !l.citee,
      );
      const premiere = entree.questions.find((q) => q.intent === i.intent);
      return {
        titre: momentDe(i.intent, donnees.portee.ville),
        posees: i.posees - i.nonMesurees,
        citees: i.citees,
        exemple: extrait(perdue?.texte ?? premiere?.text ?? "", 120).texte,
      };
    })
    .filter((m) => m.posees > 0);
  if (moments.length) {
    const pire = [...moments].sort((a, b) => a.citees - b.citees || b.posees - a.posees)[0]!;
    ecrans.push({
      type: "demandes",
      kicker: `les ${donnees.echantillon.questions} questions posées pendant votre mesure`,
      message: "Votre marché ne pose pas de questions sur vous. Il pose des questions de comparaison.",
      sens: `L'acheteur ne demande plus « qui est ${marque} », il demande « lequel choisir ». Si vous n'existez pas dans les réponses-listes, vous n'entrez jamais dans la considération, quelle que soit la qualité de votre offre.${pire.citees === 0 ? ` Sur « ${pire.titre.toLowerCase()} », vous êtes absent des ${pire.posees} questions.` : ""}`,
      lignes: moments,
      total: donnees.echantillon.questions,
    });
  }

  // Le vocabulaire : proposé par le modèle, compté par le code.
  const lexique = compterLexique(entree.analyse?.lexique ?? [], entree.reponses, entree.questions);
  if (lexique.length >= 3) {
    const roi = lexique[0]!;
    const sousExploite = lexique.find((t) => t.questions === 0 || t.reponses / lues > 0.3);
    ecrans.push({
      type: "vocabulaire",
      kicker: `les mots employés dans vos ${lues} réponses`,
      message: `Le mot qui décide, sur votre marché, c'est « ${roi.terme} ».`,
      sens: `Les moteurs emploient ce vocabulaire spontanément : c'est la porte d'entrée de votre marché. Celui qui possède la définition de ces termes possède la première réponse.${sousExploite && sousExploite.questions === 0 ? ` « ${sousExploite.terme} » revient dans ${sousExploite.reponses} réponses sans qu'aucune question ne l'emploie : les moteurs l'ajoutent d'eux-mêmes.` : ""}`,
      termes: lexique.slice(0, 6),
      lues,
    });
  }

  // Les questions de risque et de vérification : le moment tardif.
  const intentionsRisque = donnees.intentions.filter(
    (i) => i.intent === "probleme" || i.intent === "confiance",
  );
  const poseesRisque = intentionsRisque.reduce((s, i) => s + (i.posees - i.nonMesurees), 0);
  const citeesRisque = intentionsRisque.reduce((s, i) => s + i.citees, 0);
  const sujetsRisque = donnees.matrice.lignes
    .filter((l) => (l.intent === "probleme" || l.intent === "confiance") && l.mesuree)
    .slice(0, 6)
    .map((l) => extrait(l.texte, 110).texte);
  if (poseesRisque > 0 && sujetsRisque.length) {
    ecrans.push({
      type: "risque",
      kicker: "les questions du dernier moment",
      message: `${poseesRisque} de vos ${donnees.echantillon.questions} questions portent sur le risque et la vérification.`,
      sens: `L'IA est consultée jusque dans la dernière ligne droite, quand votre offre est déjà sur la table. Être absent de ces réponses-là, c'est laisser vos concurrents souffler les critères de décision à votre prospect pendant qu'il vous compare.`,
      sujets: sujetsRisque,
      posees: poseesRisque,
      total: donnees.echantillon.questions,
      citees: citeesRisque,
    });
  }

  /* --------------------------------------------- acte 3 · pourquoi eux */
  ouvrirActe(2);

  const podium = donnees.voix.lignes
    .filter((l) => !l.cible)
    .slice(0, 5)
    .map((l) => ({
      nom: l.nom,
      reponses: l.reponses,
      reco: 0,
      cible: false,
    }));
  const vousLigne = donnees.voix.lignes.find((l) => l.cible);
  if (podium.length && vousLigne) {
    const geants = podium.filter((p) => {
      const classe = entree.classes[p.nom];
      return classe === "geant";
    }).length;
    ecrans.push({
      type: "podium",
      kicker: `présence comptée en réponses, sur ${lues}`,
      message:
        geants < podium.length
          ? "Ce ne sont pas les géants qui vous prennent vos clients. Ce sont des maisons de votre taille."
          : "Voici qui occupe les réponses de votre marché.",
      sens: `La place de tête n'est pas achetée par la taille : elle est prise par ce qui est publié et lisible. C'est une mauvaise nouvelle pour l'ego et une excellente pour la stratégie, parce que ce qu'une maison comparable a pris, vous pouvez le prendre.`,
      lignes: [...podium, { nom: marque, reponses: vous, reco: 0, cible: true }],
      lues,
      positionMoyenne: donnees.composantes?.rang ?? null,
    });
  }

  // Lu, et pas cité : le fait le plus fort du dossier.
  const luPasCite = luSansEtreCite(
    entree.reponses,
    entree.mentions,
    donnees.domaine,
    entree.questions,
  );
  if (luPasCite && luPasCite.sansCitation.length) {
    const premieresSansCitation = luPasCite.sansCitation.filter((s) => s.premiere).length;
    ecrans.push({
      type: "lu-pas-cite",
      kicker: `votre site dans les sources lues par les moteurs`,
      message:
        premieresSansCitation > 0
          ? `Ils ont lu votre site en premier. Et ils ne vous ont pas cité.`
          : `Ils ont lu votre site. Et ils ne vous ont pas cité.`,
      sens: `Votre page a la bonne réponse : elle a été retenue comme source. Ce qui manque n'est pas la qualité, c'est ce qui permet à une machine de faire le lien entre le texte qu'elle lit et une entreprise qu'elle peut nommer. C'est exactement ce que corrige le premier chantier.`,
      hote: luPasCite.hote,
      reponsesQuiLisent: luPasCite.reponsesQuiLisent,
      sansCitation: luPasCite.sansCitation
        .slice(0, 4)
        .map((s) => ({ ...s, question: extrait(s.question, 100).texte })),
      premiereSource: luPasCite.premiereSource,
    });
  }

  if (donnees.sources.totalLectures) {
    const citableSet = new Set(citables.map((c) => c.hote));
    const genreDe = (d: { hote: string; votreSite: boolean }): "vous" | "concurrent" | "tiers" =>
      d.votreSite ? "vous" : citableSet.has(d.hote) ? "tiers" : "concurrent";
    const tete = donnees.sources.domaines.slice(0, 6);
    const lignes = tete.map((d) => ({ hote: d.hote, lectures: d.lectures, genre: genreDe(d) }));
    if (!lignes.some((l) => l.genre === "vous")) {
      const votre = donnees.sources.domaines.find((d) => d.votreSite);
      if (votre) lignes.push({ hote: votre.hote, lectures: votre.lectures, genre: "vous" });
      else if (donnees.domaine) lignes.push({ hote: donnees.domaine, lectures: 0, genre: "vous" });
    }
    // L'honnêteté du classement : si le dernier affiché a des ex aequo hors
    // écran, on le dit, sinon le prospect qui recompte trouve le trou.
    const dernier = tete[tete.length - 1];
    const exAequo = dernier
      ? donnees.sources.domaines.filter(
          (d) => d.lectures === dernier.lectures && !tete.includes(d),
        ).length
      : 0;
    const tiers = lignes.filter((l) => l.genre === "tiers").length;
    ecrans.push({
      type: "portes",
      kicker: `${donnees.sources.totalLectures} lectures faites pour vous répondre`,
      message: "Voici ce que les moteurs lisent avant de répondre.",
      sens: `C'est la carte des endroits où il faut exister. Les sites de vos concurrents en occupent une partie, mais ${tiers > 0 ? `les adresses neutres, elles, sont ouvertes : une inscription suffit` : `les adresses restantes sont ouvertes`}. Rien ici n'est une supposition : ce sont les sources que vos propres réponses ont consultées.`,
      lignes,
      totalLectures: donnees.sources.totalLectures,
      totalDomaines: donnees.sources.totalDomaines,
      lecturesVotreSite: donnees.sources.lecturesVotreSite,
      exAequo: exAequo > 0 ? `${exAequo} autre${s_(exAequo)} domaine${s_(exAequo)} à égalité hors écran` : null,
    });
  }

  // Le problème n'est pas uniforme : moteur par moteur.
  const parMoteur = donnees.matrice.moteurs.map((m) => {
    const cle = `score_${m.toLowerCase().replace(/[^a-z]/g, "")}`;
    const mesures = donnees.matrice.totaux[m];
    const sources = entree.reponses.filter(
      (r) => r.engine === m && !r.error && Array.isArray(r.sources) && r.sources.length,
    ).length;
    return {
      moteur: m,
      score: null as number | null,
      citations: mesures?.citees ?? 0,
      sources,
      cle,
    };
  });
  const sansSource = parMoteur.filter((m) => m.sources === 0).map((m) => m.moteur);
  const meilleur = [...parMoteur].sort((a, b) => b.citations - a.citations)[0];
  const zero = parMoteur.filter((m) => m.citations === 0).map((m) => m.moteur);
  if (meilleur && zero.length) {
    ecrans.push({
      type: "moteurs",
      kicker: "votre présence, moteur par moteur",
      message: `${meilleur.moteur} vous cite. ${zero[0]} ne sait pas que vous existez.`,
      sens: `Les moteurs qui vont lire le web au moment de répondre vous trouvent ; ceux qui répondent de mémoire vous ignorent. Votre visibilité ne vit aujourd'hui que dans la couche « lecture en direct » : la mémoire des modèles, celle qui répond en premier et sans source, appartient encore à vos concurrents.${sansSource.length ? ` ${sansSource.join(" et ")} n'${sansSource.length > 1 ? "ont" : "a"} consulté aucune source de tout le scan.` : ""}`,
      lignes: parMoteur.map(({ moteur, score, citations, sources }) => ({
        moteur,
        score,
        citations,
        sources,
      })),
      sansSource,
    });
  }

  // Ce que les IA racontent quand on leur donne le nom.
  const verdicts = entree.analyse?.verdicts ?? [];
  if (verdicts.length >= 2) {
    const inventions = verdicts.filter((v) => v.nature === "invention").length;
    const doutes = verdicts.filter((v) => v.nature === "doute").length;
    ecrans.push({
      type: "inventions",
      kicker: "quand on leur donne votre nom · hors score",
      message:
        doutes > 0
          ? "En l'absence de votre version, les IA écrivent la leur."
          : "Voici ce qu'ils racontent de vous, mot pour mot.",
      sens: `Le vide n'est pas neutre : il est rempli.${doutes ? ` ${doutes} moteur${s_(doutes)} sur ${verdicts.length} vous répond${doutes > 1 ? "ent" : ""} par la méfiance` : ""}${inventions ? `, et ${inventions} avance${s_(inventions) ? "nt" : ""} des faits que personne n'a publiés` : ""}. Chaque semaine sans version officielle de votre histoire, ce sont ces phrases-là que lisent des dirigeants.`,
      lignes: verdicts.map((v) => ({
        moteur: v.moteur,
        phrase: extrait(v.phrase, 115).texte,
        nature: v.nature,
      })),
      secteurDeclare: entree.secteur,
    });
  }

  /* ------------------------------------------------ acte 4 · le plan */
  ouvrirActe(3);

  // Où vous percez déjà : les meilleures positions réelles.
  const percees = entree.mentions
    .filter((m) => m.is_target && m.position !== null && m.verbatim)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .slice(0, 3)
    .map((m) => {
      const q = entree.questions.find((x) => x.id === m.query_id);
      return {
        question: extrait(q?.text ?? "", 110).texte,
        moteur: m.engine,
        position: m.position ?? 0,
        verbatim: extrait(String(m.verbatim), 200).texte,
      };
    });
  const moteursQuiCitent = [
    ...new Set(entree.mentions.filter((m) => m.is_target).map((m) => m.engine)),
  ];
  const questionsPortantes = new Set(
    entree.mentions.filter((m) => m.is_target).map((m) => m.query_id),
  ).size;
  if (percees.length) {
    ecrans.push({
      type: "percees",
      kicker: "vos têtes de pont, relevées dans la mesure",
      message: `Vous percez déjà sur ${questionsPortantes} question${s_(questionsPortantes)}. Voilà par où on commence.`,
      sens: `On n'attaque pas d'abord les forteresses de vos concurrents : on consolide les endroits où une machine vous a déjà choisi, parce que la preuve que ça fonctionne pour vous existe. Ces réponses-là montrent aussi le ton qui vous fait gagner.`,
      lignes: percees,
      questionsPortantes,
      total: donnees.echantillon.questions,
      moteursQuiCitent,
    });
  }

  const territoires: { titre: string; detail: string }[] = [];
  if (percees[0]) {
    territoires.push({
      titre: "Consolider où vous percez déjà",
      detail: `${percees[0].moteur} vous place ${percees[0].position}ᵉ sur « ${percees[0].question} ». On étend cette page et on la fait lire ailleurs.`,
    });
  }
  if (gagnables[0]) {
    territoires.push({
      titre: "Occuper le terrain vacant",
      detail: `${gagnables.length} question${s_(gagnables.length)} où aucune marque n'est installée partout, à commencer par « ${extrait(gagnables[0].texte, 90).texte} ».`,
    });
  }
  if (lexique[0]) {
    territoires.push({
      titre: `Reprendre la définition de « ${lexique[0].terme} »`,
      detail: `Le terme revient dans ${lexique[0].reponses} de vos ${lues} réponses. Celui qui écrit sa définition la voit récitée.`,
    });
  }
  if (territoires.length >= 2) {
    ecrans.push({
      type: "territoires",
      kicker: "trois territoires, par ordre de rentabilité",
      message: "Où attaquer d'abord.",
      sens: `L'ordre compte autant que la liste : on part de ce qui est déjà acquis, on prend ensuite ce que personne ne tient, et on ne s'attaque au terrain occupé qu'en dernier, quand la marque a de quoi être citée.`,
      lignes: territoires,
    });
  }

  if (citables.length >= 3) {
    ecrans.push({
      type: "portes5",
      kicker: "les adresses tierces de votre mesure",
      message: "Les portes où votre nom doit apparaître.",
      sens: `Ce ne sont pas des « backlinks » : ce sont les pages que les moteurs ont ouvertes pour construire vos réponses. Une inscription, une fiche ou un comparatif suffit à y entrer, et chacune est vérifiable après coup.`,
      cibles: citables.slice(0, 5),
      totalLectures: donnees.sources.totalLectures,
    });
  }

  const pages = gagnables.slice(0, 5).map((g) => ({
    titre: extrait(g.texte, 120).texte,
    lus: sourcesParQuestion(entree.reponses, g.id),
  }));
  if (pages.length) {
    ecrans.push({
      type: "contenus",
      kicker: "un titre = une question où vous étiez absent",
      message: "Les pages à écrire, nommées.",
      sens: `Ce n'est pas un calendrier éditorial : c'est la liste des réponses que les moteurs cherchent déjà et ne trouvent pas chez vous. Sous chaque ligne, les sites qu'ils ont lus à votre place.`,
      pages,
    });
  }

  /* ---------------------------------------------- acte 5 · vous, seul */
  ouvrirActe(4);

  const gestes: { titre: string; detail: string }[] = [];
  if (donnees.technique && !donnees.technique.llmstxt) {
    gestes.push({
      titre: "Posez un fichier llms.txt à la racine",
      detail:
        "absent lors de la mesure : une page de texte brut qui dit aux machines qui vous êtes, ce que vous vendez et à qui",
    });
  }
  const offerts = citables.slice(0, 3);
  if (offerts.length >= 2) {
    gestes.push({
      titre: `Demandez votre inscription sur ${offerts.map((o) => o.hote).join(", ")}`,
      detail: `les adresses tierces les plus lues de votre mesure, ${offerts.reduce((s, o) => s + o.lectures, 0)} lectures à elles ${offerts.length}`,
    });
  }
  const inventionPrix = verdicts.find((v) => v.nature === "invention");
  if (inventionPrix) {
    gestes.push({
      titre: "Publiez une page de tarifs officielle",
      detail: `${inventionPrix.moteur} avance déjà des chiffres que vous n'avez jamais publiés : c'est la seule façon de couvrir une invention`,
    });
  } else if (gagnables[0]) {
    gestes.push({
      titre: `Publiez la page qui répond à : « ${extrait(gagnables[0].texte, 80).texte} »`,
      detail: gagnables[0].raison,
    });
  }
  if (gestes.length >= 2) {
    ecrans.push({
      type: "gratuit",
      kicker: "avant tout devis · à faire vous-même",
      message: `${gestes.length === 3 ? "Trois" : "Deux"} gestes, cette semaine, sans nous.`,
      sens: `Ils sont tirés de vos données et ils sont à vous, que vous travailliez avec nous ou non. Comptez une demi-journée de développeur pour le premier, deux courriels pour le deuxième.`,
      gestes,
    });
    if (rival0) {
      ecrans.push({
        type: "bascule",
        kicker: "la limite de ces trois gestes",
        message: "Lisible n'est pas premier.",
        sens: `Ces gestes vous rendent lisible par les machines. Ils ne vous mettent pas devant : ${rival0.nom} occupe ${rival0.reponses} réponses sur ${lues} parce qu'il publie depuis des années. Déloger une marque installée demande du contenu, des relances et de la mesure, c'est-à-dire un chantier suivi.`,
        rival: rival0.nom,
        reponsesRival: rival0.reponses,
        lues,
      });
    }
  }

  /* -------------------------------------------- acte 6 · la décision */
  ouvrirActe(5);

  // Le Sprint, chantier par chantier : à gauche ce qu'il fait seul, à droite
  // ce que nous livrons. Les volumes viennent de proposition.ts, qui fait foi.
  const chantiers = [
    {
      titre: "Chantier 1 · votre site parle aux machines",
      seul: "vous posez le llms.txt et ouvrez le robots.txt",
      avecNous: [
        "audit technique complet, lu comme un robot d'IA le lit",
        "robots.txt, llms.txt et balisage schema.org posés et vérifiés EN LIGNE",
        "identité verrouillée partout : mêmes nom, adresse, téléphone, fiche Wikidata",
        "comptage des passages réels de GPTBot, ClaudeBot et PerplexityBot dans vos logs",
      ],
    },
    {
      titre: "Chantier 2 · les pages qui manquent",
      seul: gagnables[0] ? "vous écrivez la première page" : "vous écrivez une page",
      avecNous: [
        "5 contenus rédigés et livrés, en Markdown et en HTML prêts à intégrer",
        "sujets classés par gagnabilité, validés avec vous avant rédaction",
        "chaque page signalée à Bing le jour de sa publication : indexée en heures, pas en semaines",
        "recontrôle en ligne : elle répond, elle porte son balisage, sinon elle ne compte pas",
      ],
    },
    {
      titre: "Chantier 3 · exister là où ils lisent",
      seul: `vous demandez ${offerts.length || 3} inscriptions`,
      avecNous: [
        "8 cibles prioritaires : annuaires, comparateurs, presse spécialisée, fiches",
        "inscriptions réalisées, pitchs presse écrits, envoyés et relancés deux fois",
        "chaque citation obtenue est recrawlée : si votre nom n'y figure pas, elle est reclassée",
        "kit « dix avis en trente jours » : tonalité et recommandation pèsent près d'un tiers du score",
      ],
    },
  ];
  ecrans.push({
    type: "sprint",
    kicker: "le sprint geo · 4 semaines de travail, 90 jours de mesure",
    message: "Le même plan, exécuté.",
    sens: `Ce que vous faites seul est partiel, lent et sans mesure. Ce que le Sprint ajoute, ce n'est pas de l'ambition : c'est l'exécution, la vérification en ligne de chaque livrable, et la preuve écrite chaque semaine.`,
    chantiers,
    preuve: [
      "un email de preuve chaque vendredi pendant les 4 semaines, avec liens et captures",
      "un rapport d'étape au jour 30, un contrôle interne au jour 45 (jamais présenté comme un score)",
      `la remesure du ${quand} incluse : mêmes ${donnees.echantillon.questions} questions, mêmes ${donnees.echantillon.moteurs} moteurs, même formule`,
      "le call de restitution a lieu même si le résultat est mauvais",
    ],
  });

  ecrans.push({
    type: "decision",
    kicker: "la décision · une seule offre, sans abonnement",
    message: "Un seul client par secteur, trois sprints par mois.",
    sens: `On garantit les actions livrées et la remesure, jamais un rang : personne ne contrôle ce que répondront les moteurs. Si votre score est bon, on vous le dit et on ne vous vend rien.`,
    dateRemesure: quand,
    vosReponses: vous,
    lues,
    places: entree.places,
  });

  return { ecrans, actes };
}

/** L'acte d'un écran, pour le chrome (« ACTE 2 · VOS ACHETEURS »). */
export function acteDe(actes: ActeVisio[], index: number): { nom: string; numero: number } {
  let courant = { nom: actes[0]?.nom ?? "", numero: 1 };
  actes.forEach((a, i) => {
    if (index >= a.debut) courant = { nom: a.nom, numero: i + 1 };
  });
  return courant;
}
