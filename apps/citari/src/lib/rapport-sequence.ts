import { dateFr } from "@/lib/typo";
import {
  adversairePrincipal,
  partDeVoix,
  reponsesAvecLaMarque,
  reponsesRetenues,
  type LigneMention,
  type LigneQuestion,
  type LigneReponse,
} from "@/lib/rapport-apercu";

/**
 * Adaptateur de la séquence de résultat (les pop-ups de Jérémie).
 *
 * Sa maquette tournait sur un jeu d'exemple (« Ledgio, 9 fois sur 36 ») ;
 * chaque champ est ici dérivé des lignes réelles du scan, avec les règles de
 * la maison : les comptages viennent de `mentions` (jamais de
 * `share_of_voice`, tronqué), l'unité est la RÉPONSE, l'adversaire mis en
 * avant est un rival atteignable, et une réponse en panne ne compte nulle
 * part.
 */

export interface DonneesSequence {
  marque: string;
  domaine: string;
  date: string;
  score: number;
  moteurs: number;
  totalQuestions: number;
  adversaire: { nom: string; reponses: number; total: number } | null;
  vosReponses: number;
  laPlusDure: {
    question: string;
    rangQuestion: number;
    totalQuestions: number;
    moteur: string;
    texte: string;
    concurrent: string | null;
    rangConcurrent: string | null;
    votreStatut: string;
  } | null;
  voix: { nom: string; reponses: number; vous: boolean }[];
  voixMeta: {
    questions: number;
    moteurs: number;
    marquesTotal: number;
    /**
     * Le dénominateur des `reponsesPerdues`, en RÉPONSES lues. La carte
     * titrait « Sur 20 questions, 18 réponses… » : deux unités dans la même
     * phrase, et un lecteur qui venait de voir « 11 / 20 questions » à
     * l'étape suivante y lisait une contradiction. Les deux chiffres étaient
     * justes ; la phrase mélangeait leurs unités (retour de Luigi,
     * 15/08/2026, vérifié en SQL sur le scan Agoravox : 39 réponses lues,
     * 18 avec la marque, 18 avec un concurrent seul, 3 sans aucune marque).
     */
    reponsesLues: number;
    reponsesPerdues: number;
    termeSecteur: string;
  };
  /**
   * Les quatre composantes du score, calculées sur l'aperçu depuis toujours
   * et jamais montrées : elles transforment un chiffre opaque en diagnostic
   * lisible, sans rien livrer de ce que le rendez-vous apporte. Les taux sont
   * des ratios 0-1, la position une moyenne.
   */
  composantes: {
    presence: number;
    rang: number | null;
    recommandation: number;
    tonalite: number;
    reponsesRetenues: number;
    reponsesEnErreur: number;
  } | null;
  /**
   * La question miroir : ce qu'une IA répond quand on lui donne le nom de la
   * marque. Hors méthodologie et assumée comme telle (c'est la seule question
   * qui prononce le nom), mais c'est la pièce la plus personnelle du scan.
   */
  miroir: { moteur: string; texte: string } | null;
  /**
   * L'audit flash : les robots d'IA peuvent-ils seulement lire le site ? Il
   * tourne déjà pendant le scan gratuit, et son résultat dormait en base.
   */
  technique: {
    bloques: string[];
    /** Autorisés explicitement, ou non mentionnés donc permis par défaut. */
    autorises: { nom: string; explicite: boolean }[];
    llmstxt: boolean;
  } | null;
}

/** « Cabinet comptable » → « cabinet » : le mot qu'on glisse dans une phrase. */
export function termeSecteur(secteur: string | null): string {
  const s = (secteur ?? "").toLowerCase();
  if (s.includes("cabinet")) return "cabinet";
  if (s.includes("agence")) return "agence";
  if (s.includes("artisan")) return "artisan";
  if (s.includes("commerce")) return "commerce";
  return "prestataire";
}

const ordinal = (n: number) =>
  n === 1 ? "citée en premier" : n === 2 ? "citée en deuxième" : `citée en position ${n}`;

/**
 * Le titre et l'accroche de la carte « concurrent », en fonction du rapport
 * de forces RÉEL. Fonction pure, testée : la première version n'avait pas de
 * branche « vous menez » et titrait « Abritel est nommé plus souvent que
 * vous » au-dessus de barres qui montraient 5 contre 14 (scan Airbnb du
 * 14/08/2026). Un titre qui contredit ses propres chiffres coûte toute la
 * crédibilité de la mesure.
 */
export function carteConcurrent(
  nom: string,
  reponsesAdversaire: number,
  vosReponses: number,
): { kicker: string; titre: string; regime: "jamais" | "derriere" | "egal" | "devant" } {
  if (vosReponses === 0) {
    return { kicker: "QUI PREND VOTRE PLACE", titre: `${nom} est nommé. Vous, jamais.`, regime: "jamais" };
  }
  if (reponsesAdversaire > vosReponses) {
    const multiple = reponsesAdversaire / vosReponses;
    const titre =
      multiple >= 2
        ? `${nom} est nommé ${Math.floor(multiple) === 2 ? "deux" : Math.floor(multiple) === 3 ? "trois" : Math.floor(multiple)} fois plus souvent que vous.`
        : `${nom} est nommé plus souvent que vous.`;
    return { kicker: "QUI PREND VOTRE PLACE", titre, regime: "derriere" };
  }
  if (reponsesAdversaire === vosReponses) {
    return { kicker: "QUI VISE VOTRE PLACE", titre: `${nom} fait jeu égal avec vous.`, regime: "egal" };
  }
  return {
    kicker: "QUI VISE VOTRE PLACE",
    titre: `Vous menez. ${nom} reste dans la conversation.`,
    regime: "devant",
  };
}

/** Les robots d'IA testés par l'audit flash, dans l'ordre d'affichage. */
const ROBOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"] as const;

export function construireSequence(entree: {
  marque: string;
  domaine: string | null;
  date: string | null;
  score: number;
  secteur: string | null;
  questions: LigneQuestion[];
  reponses: LigneReponse[];
  mentions: LigneMention[];
  classes: Record<string, string>;
  alias: Record<string, string>;
  /** Les quatre composantes du score, telles qu'écrites par `finaliser`. */
  mesures?: {
    mention_rate?: number | string | null;
    avg_position?: number | string | null;
    reco_rate?: number | string | null;
    sentiment_score?: number | string | null;
  } | null;
  /** `scans.miroir` : tableau de { moteur, texte }. */
  miroir?: unknown;
  /** `scans.audit` : { ok, bots: { GPTBot: "autorise"|"bloque", … }, llmstxt }. */
  audit?: unknown;
}): DonneesSequence {
  const { marque, questions, reponses, mentions, classes, alias } = entree;

  const retenues = reponsesRetenues(reponses);
  const vosReponses = reponsesAvecLaMarque(mentions);
  const moteurs = new Set(reponses.map((r) => r.engine)).size;

  const adversaireBrut = adversairePrincipal(mentions, retenues, classes, alias);
  const adversaire = adversaireBrut
    ? { nom: adversaireBrut.nom, reponses: adversaireBrut.reponses, total: adversaireBrut.total }
    : null;

  // La réponse la plus dure, en deux étages, parce que la douleur n'a pas la
  // même forme selon le score. La première sélection prenait « le concurrent
  // le mieux placé sur une question sans la marque », point — et sortait
  // GeoComply (un éditeur B2B de géolocalisation, non classé donc réputé
  // rival) sur une question de dépannage : une pièce exacte, zéro douleur
  // commerciale.
  //
  //   Étage 1 — L'ABSENCE : un concurrent crédible cité sur une question où
  //   la marque n'apparaît pas. Crédible = classé rival ou géant ; un
  //   concurrent NON CLASSÉ n'est retenu que sur une question d'achat
  //   (comparative, locale) — c'est le garde-fou anti-GeoComply.
  //
  //   Étage 2 — LE DÉPASSEMENT, pour les marques bien citées qui n'ont
  //   presque aucune question d'absence : la phrase où un RIVAL est cité
  //   DEVANT la marque dans la même réponse. « PokerStars cité en premier ·
  //   vous : en position 3 » est la vraie brèche d'un score à 85.
  //
  //   Aucun étage ne fournit ? La carte sort de la séquence, comme toujours :
  //   jamais de pièce tiède présentée comme une douleur.
  const questionsCitees = new Set(mentions.filter((m) => m.is_target).map((m) => m.query_id));
  const classeDe = (marqueMention: string): string | null =>
    classes[alias[marqueMention] ?? marqueMention] ?? null;
  const intentDe = new Map(questions.map((q) => [q.id, q.intent]));
  const intentAchat = (queryId: string) =>
    ["comparative", "locale"].includes(intentDe.get(queryId) ?? "");
  const POIDS_CLASSE: Record<string, number> = { rival: 40, geant: 10 };
  const POIDS_INTENT: Record<string, number> = { comparative: 12, locale: 9, confiance: 5, probleme: 0 };
  const interet = (m: LigneMention) =>
    (POIDS_CLASSE[classeDe(m.brand) ?? "rival"] ?? 0) +
    (POIDS_INTENT[intentDe.get(m.query_id) ?? ""] ?? 0) +
    (adversaire && m.brand === adversaire.nom ? 20 : 0) +
    (m.recommended ? 6 : 0) +
    (m.position === 1 ? 2 : 0);
  const credible = (m: LigneMention) => {
    const classe = classeDe(m.brand);
    if (classe === "rival" || classe === "geant") return true;
    return classe === null && intentAchat(m.query_id);
  };

  const exploitable = (m: LigneMention) => !m.is_target && m.verbatim && m.verbatim.length > 60;

  // Étage 1 — l'absence.
  const absences = mentions
    .filter((m) => exploitable(m) && !questionsCitees.has(m.query_id) && credible(m))
    .sort((a, b) => interet(b) - interet(a) || (a.position ?? 99) - (b.position ?? 99));

  // Étage 2 — le dépassement : position de la marque par réponse, puis les
  // rivaux crédibles placés strictement devant elle.
  const positionCible = new Map<string, number>();
  for (const m of mentions) {
    if (m.is_target && typeof m.position === "number") {
      const connue = positionCible.get(m.response_id);
      if (connue === undefined || m.position < connue) positionCible.set(m.response_id, m.position);
    }
  }
  const depassements = mentions
    .filter((m) => {
      if (!exploitable(m) || !credible(m)) return false;
      const cible = positionCible.get(m.response_id);
      return (
        typeof cible === "number" && typeof m.position === "number" && m.position < cible
      );
    })
    .sort((a, b) => interet(b) - interet(a) || (a.position ?? 99) - (b.position ?? 99));

  const dure = absences[0] ?? depassements[0] ?? null;
  const enAbsence = Boolean(absences[0]);
  const questionDure = dure ? questions.find((q) => q.id === dure.query_id) : null;

  const laPlusDure =
    dure && questionDure
      ? {
          question: questionDure.text,
          rangQuestion: questionDure.rank,
          totalQuestions: questions.length,
          moteur: dure.engine,
          // La convention de marquage de sa maquette : *Concurrent* ressort en
          // signal. On marque le nom du concurrent dans le texte réel.
          texte: marquerConcurrent(dure.verbatim as string, dure.brand),
          concurrent: dure.brand,
          rangConcurrent: typeof dure.position === "number" ? ordinal(dure.position) : null,
          votreStatut: enAbsence
            ? `${marque} : absent de cette réponse`
            : `${marque} : cité en position ${positionCible.get(dure.response_id)} de cette réponse`,
        }
      : null;

  const voix = partDeVoix(mentions, alias, 5, marque).map((l) => ({
    nom: l.nom,
    reponses: l.reponses,
    vous: l.cible,
  }));

  // Réponses où un concurrent est nommé et pas la marque : « l'utilisateur
  // repart avec un nom identifié, pas le vôtre ».
  const parReponse = new Map<string, { cible: boolean; concurrent: boolean }>();
  for (const m of mentions) {
    const e = parReponse.get(m.response_id) ?? { cible: false, concurrent: false };
    if (m.is_target) e.cible = true;
    else e.concurrent = true;
    parReponse.set(m.response_id, e);
  }
  const reponsesPerdues = [...parReponse.values()].filter((e) => e.concurrent && !e.cible).length;

  // Le nombre total de marques distinctes, alias regroupés, compté sur
  // `mentions` : `share_of_voice` est tronqué et ne sait pas répondre.
  const marquesTotal = new Set(
    mentions.map((m) => (m.is_target ? marque : (alias[m.brand] ?? m.brand))),
  ).size;

  // Les quatre composantes du score. `mention_rate` sert de sentinelle : si
  // elle manque, la mesure est d'avant leur enregistrement et on n'affiche
  // rien plutôt que des zéros qui ressembleraient à un mauvais score.
  const nombre = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const presence = nombre(entree.mesures?.mention_rate);
  const composantes =
    presence === null
      ? null
      : {
          presence,
          rang: nombre(entree.mesures?.avg_position),
          recommandation: nombre(entree.mesures?.reco_rate) ?? 0,
          tonalite: nombre(entree.mesures?.sentiment_score) ?? 0,
          reponsesRetenues: retenues,
          reponsesEnErreur: reponses.filter((r) => Boolean(r.error)).length,
        };

  // Le miroir : première entrée exploitable. Une réponse en erreur n'est pas
  // écrite en base (`finaliser` les filtre), mais on reste prudent.
  const miroirBrut = Array.isArray(entree.miroir) ? entree.miroir : [];
  const premierMiroir = miroirBrut.find(
    (m): m is { moteur?: string; texte: string } =>
      Boolean(m) && typeof (m as { texte?: unknown }).texte === "string" &&
      ((m as { texte: string }).texte.trim().length > 80),
  );
  const miroir = premierMiroir
    ? { moteur: premierMiroir.moteur ?? "ChatGPT", texte: premierMiroir.texte.trim() }
    : null;

  // L'audit flash. `ok: false` signifie que le robots.txt n'a pas pu être lu :
  // on n'affiche alors rien plutôt que d'annoncer des portes ouvertes qu'on
  // n'a pas vérifiées.
  const auditBrut = entree.audit as
    | { ok?: boolean; bots?: Record<string, string>; llmstxt?: boolean }
    | null
    | undefined;
  // Trois états, pas deux : `auditFlash` écrit aussi « non_mentionne » quand
  // le robots.txt ne dit rien du robot. C'est une AUTORISATION (ce qui n'est
  // pas interdit est permis), et la première version les perdait tous les
  // deux filtres — le tableau s'affichait vide sur un site parfaitement
  // ouvert (scan snapdesk.co du 14/08/2026).
  const bots = auditBrut?.ok && auditBrut.bots ? auditBrut.bots : null;
  const connus = bots ? ROBOTS.filter((r) => typeof bots[r] === "string") : [];
  const technique =
    bots && connus.length > 0
      ? {
          bloques: connus.filter((r) => bots[r] === "bloque"),
          autorises: connus
            .filter((r) => bots[r] !== "bloque")
            .map((r) => ({ nom: r, explicite: bots[r] === "autorise" })),
          llmstxt: Boolean(auditBrut?.llmstxt),
        }
      : null;

  return {
    marque,
    domaine: entree.domaine ?? marque,
    date: entree.date ? dateFr(entree.date) : "",
    score: entree.score,
    moteurs,
    totalQuestions: questions.length,
    adversaire,
    vosReponses,
    laPlusDure,
    voix,
    composantes,
    miroir,
    technique,
    voixMeta: {
      questions: questions.length,
      moteurs,
      marquesTotal,
      reponsesLues: retenues,
      reponsesPerdues,
      termeSecteur: termeSecteur(entree.secteur),
    },
  };
}

/**
 * Extrait affichable d'un verbatim marqué, centré sur le `*concurrent*`.
 *
 * La carte « phrase exacte » affichait le verbatim entier : certains font
 * plusieurs paragraphes et la carte débordait de l'écran (règle de Luigi,
 * 15/08/2026 : chaque carte tient en un écran). On coupe pour l'affichage,
 * JAMAIS pour la mesure : le texte intégral reste lisible à l'étape « Les N
 * questions », et la coupe est annoncée à l'écran quand elle a eu lieu.
 *
 * Deux précautions, sinon la coupe ment :
 * - si le nom marqué tombe après la fenêtre, on recentre la fenêtre sur lui
 *   (un extrait de cette carte SANS le concurrent ne prouve rien) ;
 * - on ne coupe jamais au milieu du marqueur `*...*`, sinon l'astérisque
 *   orpheline casse le rendu de `marked`.
 */
export function extraitVerbatim(
  texte: string,
  max = 380,
): { texte: string; coupe: boolean } {
  if (texte.length <= max) return { texte, coupe: false };

  const debutMarqueur = texte.indexOf("*");
  const finMarqueur = debutMarqueur === -1 ? -1 : texte.indexOf("*", debutMarqueur + 1);

  // Fenêtre par défaut : le début du texte. Si le marqueur complet existe et
  // dépasse la fenêtre, on la recentre pour qu'il y figure en entier.
  let debut = 0;
  if (finMarqueur !== -1 && finMarqueur + 1 > max) {
    debut = Math.max(0, debutMarqueur - Math.floor(max / 3));
    // Jamais commencer entre les deux astérisques.
    if (debut > debutMarqueur) debut = debutMarqueur;
  }
  let fin = Math.min(texte.length, debut + max);
  if (debutMarqueur !== -1 && fin > debutMarqueur && finMarqueur !== -1 && fin <= finMarqueur) {
    fin = Math.min(texte.length, finMarqueur + 1);
  }

  // Couper sur un espace pour ne pas trancher un mot.
  let morceau = texte.slice(debut, fin);
  if (fin < texte.length) {
    const dernierEspace = morceau.lastIndexOf(" ");
    if (dernierEspace > finMarqueur - debut && dernierEspace > max * 0.6) {
      morceau = morceau.slice(0, dernierEspace);
    }
  }

  return {
    texte: `${debut > 0 ? "… " : ""}${morceau.trim()}${debut + morceau.length < texte.length ? " …" : ""}`,
    coupe: true,
  };
}

/** Entoure la première occurrence du concurrent avec la marque `*...*`. */
export function marquerConcurrent(texte: string, concurrent: string): string {
  const propre = texte
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!concurrent) return propre;
  const index = propre.toLowerCase().indexOf(concurrent.toLowerCase());
  if (index === -1) return propre;
  const exact = propre.slice(index, index + concurrent.length);
  return `${propre.slice(0, index)}*${exact}*${propre.slice(index + concurrent.length)}`;
}
