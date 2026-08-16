import { dateFr, verdict as motVerdict } from "@/lib/typo";
import {
  hoteDeSource,
  questionsGagnables,
  reponsesRecommandees,
  type DonneesDocument,
  type LigneSourceReponse,
} from "@/lib/rapport-complet";
import type { LigneMention, LigneQuestion } from "@/lib/rapport-apercu";
import type { AnalyseIa } from "@/lib/analyse.server";

/**
 * LA VISIO : le support de présentation du scan complet.
 *
 * Refonte de contenu du 16/08/2026 (architecture validée par Luigi après un
 * panel de juges) : vingt écrans en six actes, et une règle au-dessus des
 * autres — chaque écran porte une donnée propre à CE prospect ET un
 * enseignement stratégique, jamais une reformulation du chiffre. Les écrans
 * de méthode, les généralités et les promesses de résultat n'existent pas :
 * on garantit des actions et une remesure datée, jamais un score.
 *
 * Les six actes : LE VERDICT (garde, score aux deux protocoles étiquetés,
 * l'annonce des constats, la carte des réponses), VOS ACHETEURS (les
 * moments d'achat avec leur score, la question décisive), POURQUOI EUX (la
 * chaîne causale : recommandations, identité perçue, ce que les moteurs
 * lisent, ce qu'ils y trouvent, le pivot « votre image est bonne, votre
 * présence est vide »), LE PLAN (le terrain, fondations, pages, adresses),
 * CETTE SEMAINE (les gestes offerts, l'honnêteté), LA DÉCISION (le Sprint
 * ligne par ligne, l'offre, la remesure datée EN DERNIER — c'est l'écran qui
 * reste affiché pendant la discussion).
 *
 * Comme partout : aucun chiffre en dur, aucune donnée simulée, un écran sans
 * donnée sort du déroulé.
 */

type EtatCellule = "cite" | "absent" | "erreur";

export type EcranVisio =
  | {
      type: "garde";
      marque: string;
      date: string;
      questions: number;
      moteurs: number;
      reponsesLues: number;
    }
  | {
      type: "score";
      score: number;
      verdictMot: string;
      vosReponses: number;
      lues: number;
      questions: number;
      moteurs: number;
      /** L'aperçu gratuit du même domaine ; les protocoles diffèrent et
       *  l'écran les étiquette tous les deux. */
      apercu: { score: number; date: string } | null;
    }
  | {
      /** Les constats qu'on va prouver : des faits mesurés, jamais une
       *  promesse. L'unité est LA RÉPONSE, partout. */
      type: "annonce";
      constats: string[];
    }
  | {
      /** La carte des réponses, plein écran : l'ampleur de la mesure,
       *  sans texte. L'anti-« montage d'extraits ». */
      type: "matrice";
      moteurs: string[];
      lignes: { rang: number; etats: EtatCellule[] }[];
      reponsesLues: number;
    }
  | {
      /** Les moments d'achat reconstitués depuis les questions POSÉES,
       *  chacun avec son score : où le prospect perd. */
      type: "moments";
      lignes: { titre: string; citees: number; mesurees: number; exemple: string }[];
      /** L'anti-objection canal : les adresses qu'il connaît déjà. */
      canal: { annuaires: string[]; lectures: number } | null;
    }
  | {
      type: "decisive";
      question: string;
      rang: number;
      moteurs: number;
      marques: number;
    }
  | {
      /** Les recommandations explicites : les deux rivaux et lui. */
      type: "reco";
      lignes: { nom: string; reco: number }[];
      vous: number;
    }
  | {
      type: "identite";
      marque: string;
      lignes: { moteur: string; metier: string; citation: string }[];
      llmstxt: boolean;
    }
  | {
      /** Secours de l'écran identité quand l'analyse n'est pas disponible. */
      type: "preuve-identite";
      moteur: string;
      extrait: string;
      llmstxt: boolean;
    }
  | {
      /** Le classement unifié des sources lues : adresses tierces, sites
       *  concurrents, le sien. L'écran-photo central. */
      type: "sources";
      lignes: { hote: string; lectures: number; genre: "vous" | "concurrent" | "tiers" }[];
      totalLectures: number;
      lecturesVotreSite: number;
      /** true = robots.txt ouvert (la porte est innocentée), null = non relevé. */
      robotsOuverts: boolean | null;
    }
  | {
      type: "rival-pourquoi";
      rival: string;
      arguments: { resume: string; citation: string; moteur: string }[];
    }
  | {
      /** Le pivot : quand on le lit, on le choisit. C'est ce qui rend le
       *  plan crédible. Chaque affirmation est gardée par sa donnée. */
      type: "pivot";
      vosReponses: number;
      recoVous: number;
      rival: { nom: string; reponses: number; reco: number };
      /** Taux de recommandation par réponse ≥ celui du rival. */
      memeTaux: boolean;
      /** Aucune mention négative relevée sur la marque. */
      aucunNegatif: boolean;
      /** Plancher entier de rival.reponses / vosReponses. */
      facteur: number;
    }
  | {
      /** Le retournement du chiffre du rival : l'espace où se battre. */
      type: "terrain";
      lues: number;
      rival: { nom: string; reponses: number };
      sansRival: number;
      gagnables: { texte: string; tenants: string }[];
    }
  | { type: "plan-fondations"; actions: string[] }
  | { type: "plan-pages"; pages: { titre: string; lus: string[] }[] }
  | { type: "plan-citations"; cibles: string[] }
  | {
      /** Les gestes que le prospect fait seul cette semaine : un cadeau
       *  réel, tiré de SES données. */
      type: "semaine";
      gestes: { titre: string; detail: string }[];
    }
  | {
      /** L'honnêteté : les gestes rendent lisible, ils ne garantissent ni
       *  place ni score. */
      type: "honnetete";
      rival: { nom: string; reponses: number };
      lues: number;
      dateRemesure: string;
    }
  | {
      /** Le Sprint ligne par ligne : chaque constat (SES données) en face
       *  du livrable qui l'exécute. Différentiel explicite avec les gestes
       *  offerts. */
      type: "sprint-lignes";
      lignes: { constat: string; livrable: string }[];
    }
  | { type: "offre"; places: number | null }
  | {
      type: "remesure";
      dateRemesure: string;
      questionsExemple: string[];
      vosReponses: number;
      lues: number;
    };

export type ActeVisio = { nom: string; debut: number };

const ACTES = [
  "LE VERDICT",
  "VOS ACHETEURS",
  "POURQUOI EUX",
  "LE PLAN",
  "CETTE SEMAINE",
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
 * classés par nombre de lectures. Calcul pur sur les sources stockées :
 * c'est la cause précise d'une question perdue, adresse par adresse.
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

/** Le libellé « moment d'achat » d'une intention, en langage courant. */
function momentDe(intent: string, ville: string | null): string {
  switch (intent) {
    case "comparative":
      return "Ils comparent les offres";
    case "probleme":
      return "Ils ont un problème à régler";
    case "locale":
      return ville ? `Ils cherchent à ${ville}` : "Ils cherchent près de chez eux";
    case "confiance":
      return "Ils vérifient avant de signer";
    default:
      return intent;
  }
}

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
  /** Les réponses avec leurs sources, pour la cause par question perdue. */
  reponses: LigneSourceReponse[];
  /** L'analyse complémentaire (identité perçue, arguments du rival), ou null
   *  si le modèle d'extraction était indisponible : les écrans sortent. */
  analyse: AnalyseIa | null;
  /** Places restantes du mois : un chiffre RÉEL saisi par Luigi, jamais déduit. */
  places: number | null;
}): { ecrans: EcranVisio[]; actes: ActeVisio[] } {
  const { donnees, score } = entree;
  const lues = donnees.echantillon.reponsesLues;
  const vous = donnees.voix.vosReponses;
  const rival = donnees.duel?.adversaire ?? null;
  const ecrans: EcranVisio[] = [];
  const actes: ActeVisio[] = [];
  const ouvrirActe = (n: number) => actes.push({ nom: ACTES[n]!, debut: ecrans.length });

  // Calculs partagés entre plusieurs écrans.
  const gagnables = questionsGagnables(
    donnees.matrice,
    entree.mentions,
    entree.classes,
    entree.alias,
    6,
  );
  const citables = domainesCitables(donnees.sources.domaines, entree.classes, entree.alias);
  const quand = dateRemesure(entree.completedAt);

  /* ---------------------------------------------- acte 1 · le verdict */
  ouvrirActe(0);

  ecrans.push({
    type: "garde",
    marque: donnees.marque,
    date: entree.date,
    questions: donnees.echantillon.questions,
    moteurs: donnees.echantillon.moteurs,
    reponsesLues: lues,
  });

  ecrans.push({
    type: "score",
    score,
    verdictMot: motVerdict(score),
    vosReponses: vous,
    lues,
    questions: donnees.echantillon.questions,
    moteurs: donnees.echantillon.moteurs,
    apercu: entree.apercu,
  });

  // L'annonce : uniquement des faits déjà mesurés, à l'unité RÉPONSE.
  const constats = [
    `Votre nom apparaît dans ${vous} réponse${vous > 1 ? "s" : ""} sur ${lues}.`,
    rival ? `${rival.nom} apparaît dans ${rival.reponses}.` : null,
    donnees.sources.totalLectures
      ? `Tout ce que les moteurs ont lu est enregistré : ${donnees.sources.totalLectures} lectures. On sait où la partie se joue.`
      : "Chaque réponse est conservée mot pour mot : la preuve se relit.",
  ].filter((c): c is string => c !== null);
  ecrans.push({ type: "annonce", constats });

  // La carte des réponses : une case par réponse mesurée, zéro texte.
  ecrans.push({
    type: "matrice",
    moteurs: donnees.matrice.moteurs,
    lignes: donnees.matrice.lignes.map((l) => ({
      rang: l.rang,
      etats: donnees.matrice.moteurs.map((m) => l.cellules[m]?.etat ?? "erreur"),
    })),
    reponsesLues: lues,
  });

  /* ------------------------------------------- acte 2 · vos acheteurs */
  ouvrirActe(1);

  const moments = donnees.intentions
    .filter((i) => i.posees > 0)
    .map((i) => {
      // L'exemple le plus parlant : une question PERDUE de ce moment,
      // sinon la première posée.
      const perdue = donnees.matrice.lignes.find(
        (l) => l.intent === i.intent && l.mesuree && !l.citee,
      );
      const premiere = entree.questions.find((q) => q.intent === i.intent);
      return {
        titre: momentDe(i.intent, donnees.portee.ville),
        citees: i.citees,
        mesurees: i.posees - i.nonMesurees,
        exemple: perdue?.texte ?? premiere?.text ?? "",
      };
    })
    .filter((m) => m.mesurees > 0);
  if (moments.length) {
    ecrans.push({
      type: "moments",
      lignes: moments,
      canal: donnees.sources.totalLectures
        ? {
            annuaires: citables.slice(0, 2).map((c) => c.hote),
            lectures: donnees.sources.totalLectures,
          }
        : null,
    });
  }

  if (donnees.questionCle) {
    const marques = new Set(
      entree.mentions
        .filter((m) => m.query_id === donnees.questionCle!.id && !m.is_target)
        .map((m) => entree.alias[m.brand] ?? m.brand),
    ).size;
    ecrans.push({
      type: "decisive",
      question: donnees.questionCle.texte,
      rang: donnees.questionCle.rang,
      moteurs: donnees.questionCle.faces.filter((f) => !f.erreur).length,
      marques,
    });
  }

  /* --------------------------------------------- acte 3 · pourquoi eux */
  ouvrirActe(2);

  // La chaîne causale s'ouvre sur l'effet : les recommandations explicites,
  // les deux premiers rivaux face au client.
  if (donnees.duel && donnees.duel.recoAdversaire > donnees.duel.recoVous) {
    const lignesReco = [{ nom: donnees.duel.adversaire.nom, reco: donnees.duel.recoAdversaire }];
    const rival2 = donnees.voix.lignes.find(
      (l) => !l.cible && l.classe === "rival" && l.nom !== donnees.duel!.adversaire.nom,
    );
    if (rival2) {
      const reco2 = reponsesRecommandees(entree.mentions, rival2.nom, entree.alias);
      if (reco2 > donnees.duel.recoVous) lignesReco.push({ nom: rival2.nom, reco: reco2 });
    }
    ecrans.push({ type: "reco", lignes: lignesReco, vous: donnees.duel.recoVous });
  }

  // Parce qu'elles ne vous comprennent pas : l'identité perçue.
  const identites = entree.analyse?.identites ?? [];
  const miroir = donnees.miroir[0];
  if (identites.length >= 2) {
    ecrans.push({
      type: "identite",
      marque: donnees.marque,
      lignes: identites,
      llmstxt: donnees.technique?.llmstxt ?? false,
    });
  } else if (miroir) {
    ecrans.push({
      type: "preuve-identite",
      moteur: miroir.moteur,
      extrait: miroir.extrait,
      llmstxt: donnees.technique?.llmstxt ?? false,
    });
  }

  // Alors elles lisent ailleurs : le classement unifié des sources, avec la
  // ligne du client garantie même hors du haut du classement.
  if (donnees.sources.totalLectures) {
    const citableSet = new Set(citables.map((c) => c.hote));
    const genreDe = (d: { hote: string; votreSite: boolean }): "vous" | "concurrent" | "tiers" =>
      d.votreSite ? "vous" : citableSet.has(d.hote) ? "tiers" : "concurrent";
    const tete = donnees.sources.domaines.slice(0, 6);
    const lignes = tete.map((d) => ({ hote: d.hote, lectures: d.lectures, genre: genreDe(d) }));
    if (!lignes.some((l) => l.genre === "vous")) {
      const votre = donnees.sources.domaines.find((d) => d.votreSite);
      if (votre) {
        lignes.push({ hote: votre.hote, lectures: votre.lectures, genre: "vous" });
      } else if (donnees.domaine) {
        lignes.push({ hote: donnees.domaine, lectures: 0, genre: "vous" });
      }
    }
    ecrans.push({
      type: "sources",
      lignes,
      totalLectures: donnees.sources.totalLectures,
      lecturesVotreSite: donnees.sources.lecturesVotreSite,
      robotsOuverts: donnees.technique ? donnees.technique.bloques.length === 0 : null,
    });
  }

  // Ce qu'elles y trouvent : les arguments du rival, chacun prouvé.
  const rivalAnalyse = entree.analyse?.rival;
  if (rivalAnalyse && rivalAnalyse.arguments.length >= 2) {
    ecrans.push({
      type: "rival-pourquoi",
      rival: rivalAnalyse.nom,
      arguments: rivalAnalyse.arguments,
    });
  }

  // Le pivot : quand on vous lit, on vous choisit. Chaque moitié de la
  // phrase est gardée par sa donnée ; sans aucune des deux, l'écran sort.
  if (donnees.duel && vous > 0 && donnees.duel.recoVous > 0 && rival && rival.reponses > 0) {
    const memeTaux =
      donnees.duel.recoVous / vous >= donnees.duel.recoAdversaire / rival.reponses;
    const aucunNegatif = donnees.tonalite ? donnees.tonalite.negatives === 0 : false;
    if (memeTaux || aucunNegatif) {
      ecrans.push({
        type: "pivot",
        vosReponses: vous,
        recoVous: donnees.duel.recoVous,
        rival: { nom: rival.nom, reponses: rival.reponses, reco: donnees.duel.recoAdversaire },
        memeTaux,
        aucunNegatif,
        facteur: Math.floor(rival.reponses / vous),
      });
    }
  }

  /* ------------------------------------------------ acte 4 · le plan */
  ouvrirActe(3);

  // Le terrain : le retournement du chiffre du rival.
  if (rival && lues - rival.reponses > 0) {
    ecrans.push({
      type: "terrain",
      lues,
      rival: { nom: rival.nom, reponses: rival.reponses },
      sansRival: lues - rival.reponses,
      gagnables: gagnables.slice(0, 5).map((g) => ({
        texte: g.texte,
        tenants: g.tenants.length
          ? `tenue aujourd'hui par ${g.tenants
              .slice(0, 2)
              .map((t) => `${t.nom} (${t.reponses} réponse${t.reponses > 1 ? "s" : ""})`)
              .join(" et ")}`
          : "personne ne tient cette question : la place est vide",
      })),
    });
  }

  const actionsDe = (chantier: string) =>
    donnees.plan
      .flatMap((p) => p.actions)
      .filter((a) => a.chantier === chantier)
      .map((a) => a.titre);
  const fondations = actionsDe("Technique").slice(0, 3);
  if (fondations.length) ecrans.push({ type: "plan-fondations", actions: fondations });

  const pages = gagnables.slice(0, 5).map((g) => ({
    titre: g.texte,
    lus: sourcesParQuestion(entree.reponses, g.id),
  }));
  if (pages.length) ecrans.push({ type: "plan-pages", pages });

  // Les adresses du Sprint : HORS les trois offertes à l'acte 5, pour que
  // le prospect ne trouve pas le recouvrement lui-même.
  const ciblesSprint = [
    ...citables.slice(3, 11).map((c) => c.hote),
    ...actionsDe("Citations").slice(0, 2),
  ].slice(0, 8);
  if (ciblesSprint.length) ecrans.push({ type: "plan-citations", cibles: ciblesSprint });

  /* ------------------------------------------- acte 5 · cette semaine */
  ouvrirActe(4);

  const gestes: { titre: string; detail: string }[] = [];
  if (donnees.technique && !donnees.technique.llmstxt) {
    gestes.push({
      titre: "Posez un fichier llms.txt",
      detail:
        "absent lors de la mesure : une page de texte brut qui dit aux machines qui vous êtes et ce que vous vendez",
    });
  }
  const offerts = citables.slice(0, 3);
  if (offerts.length >= 2) {
    gestes.push({
      titre: `Demandez votre inscription sur ${offerts.map((o) => o.hote).join(", ")}`,
      detail: `les adresses tierces les plus lues de votre mesure (${offerts.reduce((s, o) => s + o.lectures, 0)} lectures à elles ${offerts.length})`,
    });
  }
  if (gagnables[0]) {
    gestes.push({
      titre: `Publiez la page qui répond à : « ${gagnables[0].texte} »`,
      detail: gagnables[0].raison,
    });
  }
  if (gestes.length >= 2) {
    ecrans.push({ type: "semaine", gestes });
    if (rival) {
      ecrans.push({
        type: "honnetete",
        rival: { nom: rival.nom, reponses: rival.reponses },
        lues,
        dateRemesure: quand,
      });
    }
  }

  /* -------------------------------------------- acte 6 · la décision */
  ouvrirActe(5);

  // Le Sprint ligne par ligne : constat mesuré → livrable qui l'exécute.
  const lignesSprint: { constat: string; livrable: string }[] = [];
  const inconnues = identites.filter((i) => i.metier.toLowerCase().includes("non précisé")).length;
  if (inconnues > 0) {
    lignesSprint.push({
      constat: `${inconnues} moteur${inconnues > 1 ? "s" : ""} sur ${identites.length} ne ${inconnues > 1 ? "savent" : "sait"} pas dire votre métier`,
      livrable: "Fondations : llms.txt et données structurées, posés chez vous",
    });
  } else if (donnees.technique && !donnees.technique.llmstxt) {
    lignesSprint.push({
      constat: "votre identité n'est écrite nulle part pour les machines",
      livrable: "Fondations : llms.txt et données structurées, posés chez vous",
    });
  }
  if (rival && gagnables.length > 1) {
    lignesSprint.push({
      constat: `${lues - rival.reponses} réponses se jouent sans ${rival.nom}`,
      livrable: "5 contenus : les questions suivantes du classement, la première est déjà à vous",
    });
  }
  if (citables[0]) {
    lignesSprint.push({
      constat: `${citables[0].hote} lu ${citables[0].lectures} fois pendant votre mesure`,
      livrable: "8 inscriptions demandées et suivies, hors les 3 offertes",
    });
  }
  lignesSprint.push({
    constat: `votre nom dans ${vous} réponse${vous > 1 ? "s" : ""} sur ${lues}`,
    livrable: `remesure du ${quand} incluse : mêmes questions, chiffres publiés`,
  });
  if (lignesSprint.length >= 2) {
    ecrans.push({ type: "sprint-lignes", lignes: lignesSprint });
  }

  ecrans.push({ type: "offre", places: entree.places });

  // La remesure ferme le déroulé : le seul engagement vérifiable du dossier,
  // c'est l'écran qui reste affiché pendant la discussion finale.
  ecrans.push({
    type: "remesure",
    dateRemesure: quand,
    questionsExemple: entree.questions.slice(0, 2).map((q) => q.text),
    vosReponses: vous,
    lues,
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
