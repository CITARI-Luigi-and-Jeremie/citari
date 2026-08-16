import { dateFr, verdict as motVerdict } from "@/lib/typo";
import {
  piecesAConviction,
  type DonneesDocument,
  type Piece,
} from "@/lib/rapport-complet";
import type { LigneMention, LigneQuestion } from "@/lib/rapport-apercu";

/**
 * LA VISIO : le support de présentation du scan complet, 16/08/2026.
 *
 * Ce n'est PAS le rapport web en autonomie : c'est un déroulé que LUIGI
 * commente en partage d'écran pendant 30 minutes, à la fin duquel le
 * dirigeant doit vouloir signer le Sprint. Un écran = UN message qu'il peut
 * dire en 60 à 90 secondes. Cinq actes imposés : le verdict, la preuve, les
 * causes, le plan, la décision.
 *
 * LA RÈGLE DE PERTINENCE prime sur tout : chaque écran porte au moins une
 * donnée qui n'existe que pour CE prospect. Un écran montrable à un autre
 * client est un écran générique : il n'existe pas ici. Et comme partout :
 * aucun chiffre en dur, aucune donnée simulée, une pièce sans donnée sort
 * du déroulé.
 */

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
      /** L'aperçu gratuit du même domaine, pour l'écart mémoire → web ouvert. */
      apercu: { score: number; date: string } | null;
    }
  | {
      type: "voix";
      lignes: { nom: string; reponses: number; cible: boolean }[];
      /** Plancher du ratio rival/vous, entier : « au moins N fois plus ». */
      facteur: number | null;
      lues: number;
    }
  | {
      type: "reco";
      adversaire: string;
      recoAdversaire: number;
      recoVous: number;
    }
  | { type: "piece"; piece: Piece; indexPiece: number; totalPieces: number }
  | {
      type: "decisive";
      question: string;
      rang: number;
      moteurs: number;
      marques: number;
    }
  | { type: "cause"; numero: 1 | 2 | 3; titre: string; phrase: string }
  | { type: "preuve-matiere"; lectures: number; votreSite: number; questionsPerdues: string[] }
  | {
      type: "preuve-adresses";
      adresses: { hote: string; lectures: number }[];
    }
  | {
      type: "preuve-identite";
      moteur: string;
      extrait: string;
      llmstxt: boolean;
    }
  | { type: "plan-calendrier"; questions: number }
  | { type: "plan-fondations"; actions: string[] }
  | { type: "plan-contenus"; contenus: string[] }
  | { type: "plan-citations"; cibles: string[] }
  | {
      type: "remesure";
      dateRemesure: string;
      questionsExemple: string[];
      vosReponses: number;
      lues: number;
    }
  | { type: "offre"; places: number | null };

export type ActeVisio = { nom: string; debut: number };

const ACTES = ["LE VERDICT", "LA PREUVE", "LES CAUSES", "LE PLAN", "LA DÉCISION"] as const;

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
  /** Places restantes du mois : un chiffre RÉEL saisi par Luigi, jamais déduit. */
  places: number | null;
}): { ecrans: EcranVisio[]; actes: ActeVisio[] } {
  const { donnees, score } = entree;
  const lues = donnees.echantillon.reponsesLues;
  const ecrans: EcranVisio[] = [];
  const actes: ActeVisio[] = [];
  const ouvrirActe = (n: number) => actes.push({ nom: ACTES[n]!, debut: ecrans.length });

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
    vosReponses: donnees.voix.vosReponses,
    lues,
    apercu: entree.apercu,
  });

  // Les trois premiers RIVAUX (à défaut, les trois premiers concurrents),
  // puis la ligne du client : le duel élargi, compté en réponses.
  const rivaux = donnees.voix.lignes.filter((l) => !l.cible && (l.classe === "rival" || l.classe === null));
  const adversaires = (rivaux.length >= 3 ? rivaux : donnees.voix.lignes.filter((l) => !l.cible)).slice(0, 3);
  const vous = donnees.voix.lignes.find((l) => l.cible);
  if (adversaires.length && vous) {
    const facteur =
      vous.reponses > 0
        ? Math.floor(Math.min(...adversaires.map((a) => a.reponses)) / vous.reponses)
        : null;
    ecrans.push({
      type: "voix",
      lignes: [...adversaires, vous].map(({ nom, reponses, cible }) => ({ nom, reponses, cible })),
      facteur: facteur && facteur >= 2 ? facteur : null,
      lues,
    });
  }

  /* ----------------------------------------------- acte 2 · la preuve */
  ouvrirActe(1);

  if (donnees.duel && donnees.duel.recoAdversaire > donnees.duel.recoVous) {
    ecrans.push({
      type: "reco",
      adversaire: donnees.duel.adversaire.nom,
      recoAdversaire: donnees.duel.recoAdversaire,
      recoVous: donnees.duel.recoVous,
    });
  }

  // Cinq pièces au plus, la question décisive gardée pour son propre écran.
  const pieces = piecesAConviction(
    entree.questions,
    entree.mentions,
    donnees.marque,
    entree.classes,
    entree.alias,
    donnees.questionCle?.id ?? null,
    5,
  );
  pieces.forEach((piece, i) =>
    ecrans.push({ type: "piece", piece, indexPiece: i + 1, totalPieces: pieces.length }),
  );

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

  /* ---------------------------------------------- acte 3 · les causes */
  ouvrirActe(2);

  const portesOuvertes = donnees.technique !== null && donnees.technique.bloques.length === 0;
  ecrans.push({
    type: "cause",
    numero: 1,
    titre: portesOuvertes
      ? "La porte est ouverte. La maison est vide."
      : "La porte est fermée à clé.",
    phrase: portesOuvertes
      ? "Les IA sont entrées chez vous, et n'ont presque rien trouvé à lire."
      : "Une partie des robots d'IA n'a même pas le droit de lire votre site.",
  });

  const gagnables = donnees.plan
    .flatMap((p) => p.cibles)
    .filter((c) => c.titre.startsWith("«"))
    .slice(0, 3)
    .map((c) => c.titre.replace(/^«\s?|\s?»$/g, ""));
  if (donnees.sources.totalLectures) {
    ecrans.push({
      type: "preuve-matiere",
      lectures: donnees.sources.totalLectures,
      votreSite: donnees.sources.lecturesVotreSite,
      questionsPerdues: gagnables,
    });
  }

  const citables = domainesCitables(donnees.sources.domaines, entree.classes, entree.alias);
  if (citables.length) {
    ecrans.push({
      type: "cause",
      numero: 2,
      titre: "Les IA ont leurs adresses. Vous n'y êtes pas.",
      phrase: "Avant de répondre, elles vont lire des places de marché et des classements.",
    });
    ecrans.push({ type: "preuve-adresses", adresses: citables.slice(0, 5) });
  }

  const miroir = donnees.miroir[0];
  if (miroir) {
    ecrans.push({
      type: "cause",
      numero: 3,
      titre: "Votre identité est floue. Alors les IA inventent.",
      phrase: `Quand on donne votre nom à ${miroir.moteur}, voici ce qu'il raconte.`,
    });
    ecrans.push({
      type: "preuve-identite",
      moteur: miroir.moteur,
      extrait: miroir.extrait,
      llmstxt: donnees.technique?.llmstxt ?? false,
    });
  }

  /* ------------------------------------------------ acte 4 · le plan */
  ouvrirActe(3);

  ecrans.push({ type: "plan-calendrier", questions: donnees.echantillon.questions });

  const actionsDe = (chantier: string) =>
    donnees.plan
      .flatMap((p) => p.actions)
      .filter((a) => a.chantier === chantier)
      .map((a) => a.titre);
  const fondations = actionsDe("Technique").slice(0, 3);
  if (fondations.length) ecrans.push({ type: "plan-fondations", actions: fondations });

  const contenus = [
    ...gagnables.map((q) => `Une page qui répond à : « ${q} »`),
    ...actionsDe("Contenu").slice(0, 2),
  ].slice(0, 5);
  if (contenus.length) ecrans.push({ type: "plan-contenus", contenus });

  const citations = [
    ...citables.slice(0, 4).map((c) => c.hote),
    ...actionsDe("Citations").slice(0, 2),
  ].slice(0, 6);
  if (citations.length) ecrans.push({ type: "plan-citations", cibles: citations });

  /* -------------------------------------------- acte 5 · la décision */
  ouvrirActe(4);

  ecrans.push({
    type: "remesure",
    dateRemesure: dateRemesure(entree.completedAt),
    questionsExemple: entree.questions.slice(0, 2).map((q) => q.text),
    vosReponses: donnees.voix.vosReponses,
    lues,
  });

  ecrans.push({ type: "offre", places: entree.places });

  return { ecrans, actes };
}

/** L'acte d'un écran, pour le chrome (« ACTE 2 · LA PREUVE »). */
export function acteDe(actes: ActeVisio[], index: number): { nom: string; numero: number } {
  let courant = { nom: actes[0]?.nom ?? "", numero: 1 };
  actes.forEach((a, i) => {
    if (index >= a.debut) courant = { nom: a.nom, numero: i + 1 };
  });
  return courant;
}
