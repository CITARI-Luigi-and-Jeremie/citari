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
 * LA VISIO : le dossier posé sur la table (17/08/2026, cinquième et
 * définitive direction, synthèse d'un panel produit/design/vente/dataviz/
 * honnêteté après quatre rejets).
 *
 * LA RÈGLE QUI TRANCHE TOUT : le PAPIER ne porte que ce qu'une machine a
 * réellement écrit (réponses, listes de sources ordonnées, questions,
 * verbatims, miroirs), reproduit mot pour mot avec sa chaîne de possession
 * (numéro de pièce, moteur, version figée du modèle, question, date) et ses
 * coupes annoncées en mots comptés. L'ENCRE porte tout ce que NOUS avons
 * compté. Le papier est un événement, pas un thème : quand il apparaît,
 * une machine a écrit ça.
 *
 * Le gabarit MESSAGE / DONNÉE / SENS survit ici comme discipline
 * d'écriture : le `message` est la ligne dite à voix haute (affichée en
 * légende serif), le `sens` est le TEXTE ORAL du consultant, il ne
 * s'affiche JAMAIS (l'écrire volerait la parole et ferait une diapositive).
 *
 * Comme partout : aucune donnée inventée, l'unité est la RÉPONSE, une
 * réponse en erreur ne compte dans aucun dénominateur, un écran sans donnée
 * sort du déroulé.
 */

/** Les versions FIGÉES des modèles, pour la chaîne de possession des
 *  pièces. La liste est verrouillée par `packages/toolkit/tests/modeles.test.ts`. */
export const MODELES: Record<string, string> = {
  ChatGPT: "gpt-5.6-terra",
  Claude: "claude-sonnet-5",
  Gemini: "gemini-3.6-flash",
  Perplexity: "sonar",
  Grok: "grok-4.5",
  "Le Chat": "mistral-large-2512",
};

type EtatCellule = "cite" | "absent" | "erreur";

/** La chaîne de possession d'une pièce papier. */
export type Possession = {
  numero: number;
  moteur: string | null;
  modele: string | null;
  rangQ: number | null;
  totalQ: number;
  date: string;
  libelle?: string;
};

export type Socle = {
  kicker: string;
  /** La légende serif, dite à voix haute. 40 mots max. */
  message: string;
  /** Le texte ORAL du consultant. Jamais affiché. */
  sens: string;
};

export type EcranVisio = Socle &
  (
    | {
        type: "verdict";
        score: number;
        vosReponses: number;
        lues: number;
        rivaux: { nom: string; reponses: number }[];
        unionRivaux: number;
        apercu: { score: number; date: string } | null;
      }
    | {
        /** PIÈCE A : une vraie réponse, entière, où l'absence se voit. */
        type: "piece-reponse";
        possession: Possession;
        question: string;
        texte: string;
        coupe: boolean;
        motsTotal: number;
        motsExtrait: number;
        variantes: string[];
        clientCite: boolean;
        marque: string;
      }
    | {
        /** LE MUR : les 134 réponses, une case chacune, questions en rail. */
        type: "mur";
        moteurs: string[];
        lignes: { rang: number; texte: string; etats: EtatCellule[] }[];
        reponsesLues: number;
        vosReponses: number;
      }
    | {
        /** L'INVENTAIRE DU DOSSIER : les tranches vues sur chant. */
        type: "inventaire";
        tranches: { compte: number; etiquette: string }[];
      }
    | {
        type: "moments";
        lignes: { titre: string; posees: number; citees: number; exemple: string }[];
      }
    | {
        type: "vocabulaire";
        termes: { terme: string; reponses: number; questions: number }[];
        lues: number;
        extraits: { moteur: string; phrase: string; terme: string }[];
      }
    | {
        /** Le bordereau des questions du dernier moment, en pièce. */
        type: "risque";
        possession: Possession;
        questions: { rang: number; texte: string; marques: string[]; vousAbsent: boolean }[];
        citees: number;
      }
    | {
        /** Le décompte en unités : un trait = une réponse. */
        type: "tally";
        lignes: { nom: string; reponses: number; cible: boolean }[];
        lues: number;
        union: number;
      }
    | {
        /** PIÈCE B : la liste de lecture + la réponse qu'elle a produite. */
        type: "piece-lecture";
        possessionGauche: Possession;
        possessionDroite: Possession;
        question: string;
        sources: { rang: number; hote: string; chemin: string; votre: boolean }[];
        totalSources: number;
        rangClient: number;
        texte: string;
        coupe: boolean;
        motsTotal: number;
        motsExtrait: number;
        variantes: string[];
        clientCite: boolean;
        marque: string;
      }
    | {
        /** La bibliothèque des moteurs : lectures en traits-unités. */
        type: "bibliotheque";
        lignes: { hote: string; lectures: number; genre: "vous" | "concurrent" | "tiers" }[];
        totalLectures: number;
        totalDomaines: number;
        exAequo: string | null;
      }
    | {
        /** PIÈCE C : deux miroirs face à face, le meilleur et le pire. */
        type: "piece-miroir";
        bon: { possession: Possession; texte: string; phrase: string } | null;
        mauvais: { possession: Possession; texte: string; phrase: string } | null;
      }
    | {
        /** L'invention : le fait précis qu'aucune source ne soutient. */
        type: "piece-invention";
        possession: Possession;
        texte: string;
        phrase: string;
        sansSource: boolean;
      }
    | {
        /** Les têtes de pont : la machine sait déjà vous choisir. */
        type: "percees";
        cartes: {
          possession: Possession;
          position: number;
          verbatim: string;
          coupe: boolean;
          question: string;
        }[];
        questionsPortantes: number;
        marque: string;
      }
    | {
        /** Six juges, une question : la place à écrire. */
        type: "six-juges";
        question: string;
        rangQ: number;
        totalQ: number;
        date: string;
        faces: {
          moteur: string;
          modele: string;
          erreur: boolean;
          extrait: string | null;
          marques: string[];
          statut: string;
        }[];
      }
    | {
        /** Le bon de commande éditorial : cinq pages, cinq questions. */
        type: "bon-commande";
        possession: Possession;
        pages: { titre: string; lus: string[] }[];
      }
    | {
        type: "portes-sprint";
        lignes: { hote: string; lectures: number }[];
        note: string;
      }
    | {
        /** Trois artefacts, pas trois consignes. */
        type: "gestes";
        panneaux: { entete: string; lignes: string[]; creux: boolean; minium: string | null }[];
      }
    | {
        /** La bascule : l'arithmétique du fossé entre ce qu'il fait seul et
         *  ce que le terrain demande. Des volumes réels des deux côtés. */
        type: "bascule";
        seul: { compte: number; libelle: string }[];
        terrain: { compte: number; libelle: string }[];
      }
    | {
        type: "sprint";
        chantiers: { titre: string; seul: string; avecNous: string[] }[];
        preuve: string[];
      }
    | {
        /** La pièce à venir : le panneau vide de la remesure. */
        type: "piece-a-venir";
        date: string;
        vosReponses: number;
        lues: number;
        questions: number;
        moteurs: number;
      }
    | {
        type: "decision";
        dateRemesure: string;
        rappel: { moteur: string; rangQ: number; marque: string } | null;
        places: number | null;
      }
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
 * Les hôtes d'INFRASTRUCTURE : des adresses techniques que les moteurs
 * traversent (proxys de recherche, caches, traducteurs, redirecteurs). On
 * ne s'inscrit pas dessus, et les proposer comme cible de citation détruit
 * la crédibilité de la liste devant un dirigeant. Vu en réel :
 * `vertexaisearch.cloud.google.com` classé parmi les adresses à conquérir.
 */
const INFRASTRUCTURE = [
  "vertexaisearch.cloud.google.com",
  "googleusercontent.com",
  "webcache.googleusercontent.com",
  "translate.google.com",
  "google.com",
  "bing.com",
  "duckduckgo.com",
  "search.marcia.com",
  "r.jina.ai",
  "web.archive.org",
  "t.co",
  "lnkd.in",
];

/** true si l'hôte est une adresse technique, jamais une cible de citation. */
export function estInfrastructure(hote: string): boolean {
  const h = hote.toLowerCase();
  return INFRASTRUCTURE.some((i) => h === i || h.endsWith(`.${i}`));
}

/**
 * Les domaines où une citation est POSSIBLE : on écarte les sites détenus
 * par un rival ou un géant, en rapprochant l'hôte des noms de marques
 * classées, ET les hôtes d'infrastructure. Heuristique assumée : elle peut
 * laisser passer un domaine concurrent inconnu, jamais en inventer.
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
      if (estInfrastructure(d.hote)) return false;
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
 * Nettoie un texte de moteur pour l'EXPOSITION en pièce : le markdown saute
 * (gras, titres, puces décoratives), les paragraphes restent. On reproduit
 * notre document de mesure, jamais l'interface d'un chatbot.
 */
export function nettoyerTexte(texte: string): string {
  return texte
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,4}\s*/gm, "")
    .replace(/^[-*]\s+/gm, "· ")
    .replace(/[*_`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Le nombre de mots d'un texte, pour les coupes annoncées. */
export function compterMots(texte: string): number {
  const t = texte.trim();
  return t ? t.split(/\s+/).length : 0;
}

export type PieceReponse = {
  moteur: string;
  question: string;
  rang: number;
  texte: string;
  coupe: boolean;
  marques: string[];
  variantes: string[];
  clientCite: boolean;
};

/**
 * LA RÉPONSE À EXPOSER : une vraie réponse, entière, où l'absence du client
 * se voit dans le texte. On choisit celle qui cite le plus de concurrents
 * (le marché entier dans un paragraphe) tout en tenant à l'écran.
 */
export function reponseExposable(
  questions: LigneQuestion[],
  reponses: LigneSourceReponse[],
  mentions: LigneMention[],
  alias: Record<string, string>,
  options: { queryId?: string; maxLongueur?: number } = {},
): PieceReponse | null {
  const maxLongueur = options.maxLongueur ?? 1500;
  const qParId = new Map(questions.map((q) => [q.id, q]));
  const candidates = reponses.filter(
    (r) => !r.error && r.raw_text && (options.queryId ? r.query_id === options.queryId : true),
  );
  if (!candidates.length) return null;

  const notee = candidates
    .map((r) => {
      const siennes = mentions.filter((m) => m.response_id === r.id);
      const concurrents = siennes.filter((m) => !m.is_target);
      const texte = nettoyerTexte(String(r.raw_text));
      return {
        r,
        concurrents,
        clientCite: siennes.some((m) => m.is_target),
        texte,
        note: concurrents.length - Math.max(0, texte.length - maxLongueur) / 400,
      };
    })
    .sort((a, b) => b.note - a.note)[0];
  if (!notee || !notee.concurrents.length) return null;

  const q = qParId.get(notee.r.query_id);
  const coupe = notee.texte.length > maxLongueur;
  const texte = coupe ? extrait(notee.texte, maxLongueur).texte : notee.texte;
  const canoniques = [...new Set(notee.concurrents.map((m) => alias[m.brand] ?? m.brand))];
  const variantes = [...new Set(notee.concurrents.map((m) => m.brand))];
  return {
    moteur: notee.r.engine,
    question: q?.text ?? "",
    rang: q?.rank ?? 0,
    texte,
    coupe,
    marques: canoniques,
    variantes,
    clientCite: notee.clientCite,
  };
}

export type LectureExposee = {
  responseId: string;
  moteur: string;
  question: string;
  rang: number;
  clientCite: boolean;
  rangClient: number | null;
  sources: { rang: number; hote: string; chemin: string; votre: boolean }[];
  totalSources: number;
};

/**
 * LA LISTE DE LECTURE à exposer : la réponse où le site du client est le
 * mieux placé dans les sources, avec chaque URL à son rang. C'est la pièce
 * qui rend « lu en premier, jamais cité » VISIBLE au lieu de raconté.
 */
export function listeDeLecture(
  questions: LigneQuestion[],
  reponses: LigneSourceReponse[],
  mentions: LigneMention[],
  site: string | null,
  max = 8,
): LectureExposee | null {
  const client = hoteClient(site);
  if (!client) return null;
  const qParId = new Map(questions.map((q) => [q.id, q]));
  const citee = new Set(mentions.filter((m) => m.is_target).map((m) => m.response_id));

  let choisie: { r: LigneSourceReponse; rangClient: number; urls: string[] } | null = null;
  for (const r of reponses) {
    if (r.error) continue;
    const urls = (Array.isArray(r.sources) ? (r.sources as { url?: unknown }[]) : [])
      .map((x) => x?.url)
      .filter((u): u is string => typeof u === "string");
    const rangClient = urls.findIndex((u) => {
      const hote = hoteDeSource(u);
      return Boolean(hote && (hote === client || hote.endsWith(`.${client}`)));
    });
    if (rangClient < 0) continue;
    const meilleure =
      !choisie ||
      rangClient < choisie.rangClient ||
      (rangClient === choisie.rangClient && citee.has(choisie.r.id) && !citee.has(r.id));
    if (meilleure) choisie = { r, rangClient, urls };
  }
  if (!choisie) return null;

  const q = qParId.get(choisie.r.query_id);
  const sources = choisie.urls.slice(0, max).map((u, i) => {
    const hote = hoteDeSource(u) ?? "";
    let chemin = "";
    try {
      chemin = new URL(u.startsWith("http") ? u : `https://${u}`).pathname;
    } catch {
      chemin = "";
    }
    if (chemin === "/") chemin = "";
    return {
      rang: i + 1,
      hote,
      chemin: chemin.length > 46 ? `${chemin.slice(0, 46)}…` : chemin,
      votre: Boolean(hote && (hote === client || hote.endsWith(`.${client}`))),
    };
  });
  return {
    responseId: choisie.r.id,
    moteur: choisie.r.engine,
    question: q?.text ?? "",
    rang: q?.rank ?? 0,
    clientCite: citee.has(choisie.r.id),
    rangClient: choisie.rangClient + 1,
    sources,
    totalSources: choisie.urls.length,
  };
}

/**
 * Les réponses qui ont LU le site du client, et celles qui ne le nomment
 * pas. Deux mesures pures ; « première source lue, marque absente » est le
 * constat qui fait taire une salle.
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
 * COMPTE. Unité : la réponse. Un terme jamais employé sort de la liste.
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
  const textes = reponses
    .filter((r) => !r.error && r.raw_text)
    .map((r) => normal(String(r.raw_text)));
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

/**
 * Une phrase RÉELLE où un moteur emploie le terme : la preuve que le
 * vocabulaire vient du terrain. Recherche pure, aucune reformulation.
 */
export function phraseAvecTerme(
  terme: string,
  reponses: LigneSourceReponse[],
): { moteur: string; phrase: string } | null {
  const cible = terme.toLowerCase();
  for (const r of reponses) {
    if (r.error || !r.raw_text) continue;
    const phrases = nettoyerTexte(String(r.raw_text)).split(/(?:\.\s+|\n+)/);
    for (const p of phrases) {
      const propre = p.trim();
      if (propre.length >= 40 && propre.length <= 170 && propre.toLowerCase().includes(cible)) {
        return { moteur: r.engine, phrase: propre };
      }
    }
  }
  return null;
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
  secteur: string | null;
  places: number | null;
}): { ecrans: EcranVisio[]; actes: ActeVisio[] } {
  const { donnees, score } = entree;
  const lues = donnees.echantillon.reponsesLues;
  const vous = donnees.voix.vosReponses;
  const marque = donnees.marque;
  const totalQ = donnees.echantillon.questions;
  const ecrans: EcranVisio[] = [];
  const actes: ActeVisio[] = [];
  const ouvrirActe = (n: number) => actes.push({ nom: ACTES[n]!, debut: ecrans.length });

  // La chaîne de possession : chaque pièce papier reçoit son numéro.
  let compteurPieces = 0;
  const possession = (
    moteur: string | null,
    rangQ: number | null,
    libelle?: string,
  ): Possession => {
    compteurPieces += 1;
    return {
      numero: compteurPieces,
      moteur,
      modele: moteur ? (MODELES[moteur] ?? null) : null,
      rangQ,
      totalQ,
      date: entree.date,
      libelle,
    };
  };

  const gagnables = questionsGagnables(
    donnees.matrice,
    entree.mentions,
    entree.classes,
    entree.alias,
    6,
  );
  const citables = domainesCitables(donnees.sources.domaines, entree.classes, entree.alias);
  const quand = dateRemesure(entree.completedAt);

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

  /* ================================================= ACTE I · LE VERDICT */
  ouvrirActe(0);

  ecrans.push({
    type: "verdict",
    kicker: `mesure du ${entree.date} · ${totalQ} questions · ${donnees.echantillon.moteurs} moteurs · conservée mot pour mot`,
    message:
      rivaux.length >= 2
        ? `${score} sur 100. Sur les ${lues} réponses lues, vous êtes dans ${vous}. ${rivaux.map((r) => r.nom).join(", ")}, à eux ${rivaux.length}, dans ${unionRivaux}.`
        : `${score} sur 100. Sur les ${lues} réponses lues, vous êtes dans ${vous}.`,
    sens: "Vous n'êtes pas en retard dans une course : vous êtes absent du récit. Je vais vous montrer les pièces, une par une.",
    score,
    vosReponses: vous,
    lues,
    rivaux: rivaux.map((r) => ({ nom: r.nom, reponses: r.reponses })),
    unionRivaux,
    apercu: entree.apercu,
  });

  // PIÈCE A : la réponse où l'absence se voit.
  const pieceA = reponseExposable(entree.questions, entree.reponses, entree.mentions, entree.alias);
  let possessionA: Possession | null = null;
  if (pieceA) {
    possessionA = possession(pieceA.moteur, pieceA.rang);
    const brutA = entree.reponses.find(
      (r) =>
        r.engine === pieceA.moteur &&
        !r.error &&
        r.raw_text &&
        entree.questions.find((q) => q.id === r.query_id)?.rank === pieceA.rang,
    );
    const motsTotal = compterMots(nettoyerTexte(String(brutA?.raw_text ?? pieceA.texte)));
    ecrans.push({
      type: "piece-reponse",
      kicker: "la première pièce du dossier",
      message:
        "Voici, mot pour mot, ce qu'un acheteur a reçu le jour de la mesure. Prenez dix secondes. Cherchez-vous.",
      sens: "Dix secondes de silence. Le prospect se cherche et ne se trouve pas : c'est lui qui pose le diagnostic.",
      possession: possessionA,
      question: pieceA.question,
      texte: pieceA.texte,
      coupe: pieceA.coupe,
      motsTotal,
      motsExtrait: compterMots(pieceA.texte),
      variantes: pieceA.variantes,
      clientCite: pieceA.clientCite,
      marque,
    });
  }

  // LE MUR : la matrice complète avec le rail des questions.
  ecrans.push({
    type: "mur",
    kicker: `les ${lues} réponses mesurées · une case par réponse`,
    message: `Ce n'était pas une réponse malchanceuse. Voici les ${lues}. Chaque case vide est une conversation qui se passe sans vous.`,
    sens: "La rareté se voit, on ne la raconte pas. Les cases barrées sont les pannes, sorties des comptes : on ne compte jamais une panne contre vous.",
    moteurs: donnees.matrice.moteurs,
    lignes: donnees.matrice.lignes.map((l) => ({
      rang: l.rang,
      texte: l.texte,
      etats: donnees.matrice.moteurs.map((m) => l.cellules[m]?.etat ?? "erreur"),
    })),
    reponsesLues: lues,
    vosReponses: vous,
  });

  // L'INVENTAIRE : tout ce qui suit sort de ce dossier.
  ecrans.push({
    type: "inventaire",
    kicker: "le dossier",
    message:
      "Tout ce que je vais vous montrer sort de ce dossier. Et avant de parler d'un devis, je vous donnerai ce que vous pouvez faire seul.",
    sens: "L'annonce du cadeau désarme la défiance : ce n'est pas un pitch, c'est une instruction.",
    tranches: [
      { compte: lues, etiquette: "réponses lues, conservées mot pour mot" },
      { compte: entree.mentions.length, etiquette: "mentions de marques relevées, une à une" },
      { compte: donnees.sources.totalLectures, etiquette: "lectures de sources, URL par URL" },
      { compte: totalQ, etiquette: "questions d'acheteur posées" },
      { compte: donnees.miroir.length, etiquette: "interrogatoires miroir, hors score" },
    ].filter((t) => t.compte > 0),
  });

  /* ============================================ ACTE II · VOS ACHETEURS */
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
        exemple: extrait(perdue?.texte ?? premiere?.text ?? "", 110).texte,
      };
    })
    .filter((m) => m.posees > 0);
  if (moments.length) {
    ecrans.push({
      type: "moments",
      kicker: `les ${totalQ} questions posées pendant votre mesure, par moment d'achat`,
      message:
        "Voici les questions exactes que nous avons posées. Ce sont celles de vos prospects, aux quatre moments où ils choisissent.",
      sens: `L'acheteur ne demande plus « qui est ${marque} », il demande « lequel choisir ». Le chiffre en face de chaque moment dit où vous existez.`,
      lignes: moments,
    });
  }

  const lexique = compterLexique(entree.analyse?.lexique ?? [], entree.reponses, entree.questions);
  if (lexique.length >= 3) {
    const troisTermes = lexique.slice(0, 3);
    const extraits = troisTermes
      .slice(0, 2)
      .map((t) => {
        const p = phraseAvecTerme(t.terme, entree.reponses);
        return p ? { ...p, terme: t.terme } : null;
      })
      .filter((x): x is { moteur: string; phrase: string; terme: string } => x !== null);
    ecrans.push({
      type: "vocabulaire",
      kicker: `les mots employés dans vos ${lues} réponses · comptés à l'unité réponse`,
      message:
        "Vos acheteurs et les machines parlent la même langue. Celui qui possède la définition de ces mots possède la première réponse.",
      sens: "Le vocabulaire vient du terrain : les phrases à droite sont réelles. La définition de ces termes est un territoire, et il est pris.",
      termes: troisTermes.map(({ terme, reponses, questions }) => ({ terme, reponses, questions })),
      lues,
      extraits,
    });
  }

  // Le bordereau du dernier moment : les questions de pièges, en pièce.
  const lignesRisque = donnees.matrice.lignes.filter((l) => l.intent === "probleme" && l.mesuree);
  if (lignesRisque.length) {
    const citeesRisque = lignesRisque.filter((l) => l.citee).length;
    const questionsRisque = lignesRisque.slice(0, 6).map((l) => {
      const parMarque = new Map<string, Set<string>>();
      for (const m of entree.mentions) {
        if (m.query_id !== l.id || m.is_target) continue;
        const nom = entree.alias[m.brand] ?? m.brand;
        const vu = parMarque.get(nom) ?? new Set<string>();
        vu.add(m.response_id);
        parMarque.set(nom, vu);
      }
      const marques = [...parMarque.entries()]
        .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([nom]) => nom);
      return { rang: l.rang, texte: l.texte, marques, vousAbsent: !l.citee };
    });
    ecrans.push({
      type: "risque",
      kicker: "le dernier moment avant la signature",
      message: `Au moment où votre devis est déjà sur la table, votre prospect demande les pièges à éviter. ${lignesRisque.length} questions. ${citeesRisque === 0 ? "Zéro présence." : `Vous êtes dans ${citeesRisque}.`}`,
      sens: "Être absent ici, c'est laisser vos concurrents souffler les critères de décision pendant qu'il compare VOS offres.",
      possession: possession(
        null,
        null,
        `INTENTION PIÈGES · ${lignesRisque.length} QUESTIONS · ${citeesRisque} PRÉSENCE${s_(citeesRisque)}`,
      ),
      questions: questionsRisque,
      citees: citeesRisque,
    });
  }

  /* ============================================ ACTE III · POURQUOI EUX */
  ouvrirActe(2);

  const vousLigne = donnees.voix.lignes.find((l) => l.cible);
  if (rivaux.length && vousLigne) {
    ecrans.push({
      type: "tally",
      kicker: `présence comptée en réponses, sur ${lues} · un trait = une réponse`,
      message: `Ce ne sont pas des géants. ${rivaux.map((r) => `${r.nom} ${r.reponses}`).join(", ")} : des maisons de votre taille, qui publient.`,
      sens: "Ce qu'une maison comparable a pris, vous pouvez le prendre. Les traits se comptent : rien n'est une impression.",
      lignes: [
        ...rivaux.map((r) => ({ nom: r.nom, reponses: r.reponses, cible: false })),
        { nom: marque, reponses: vous, cible: true },
      ],
      lues,
      union: unionRivaux,
    });
  }

  // PIÈCE B : la liste de lecture et la réponse qu'elle a produite.
  const lecture = listeDeLecture(entree.questions, entree.reponses, entree.mentions, donnees.domaine);
  if (lecture && lecture.rangClient !== null) {
    const rep = entree.reponses.find((r) => r.id === lecture.responseId);
    const texteBrut = rep?.raw_text ? nettoyerTexte(String(rep.raw_text)) : "";
    const coupe = texteBrut.length > 900;
    const texte = coupe ? extrait(texteBrut, 900).texte : texteBrut;
    const variantes = [
      ...new Set(
        entree.mentions
          .filter((m) => m.response_id === lecture.responseId && !m.is_target)
          .map((m) => m.brand),
      ),
    ];
    ecrans.push({
      type: "piece-lecture",
      kicker: "la pièce centrale du dossier",
      message:
        lecture.rangClient === 1
          ? `Ils ont ouvert ${lecture.sources.find((s) => s.votre)?.hote ?? "votre site"} en première source. Ils ont lu votre page. ${lecture.clientCite ? "Voici ce qu'ils en ont fait." : "Et la réponse ne vous nomme pas."}`
          : `Ils ont lu votre site en ${lecture.rangClient}ᵉ source. ${lecture.clientCite ? "Voici ce qu'ils en ont fait." : "Et la réponse ne vous nomme pas."}`,
      sens: "Votre page a la bonne réponse : elle a été retenue. Ce qui manque n'est pas la qualité, c'est ce qui permet à une machine de relier votre texte à une entreprise nommable. C'est le chantier 1.",
      possessionGauche: possession(lecture.moteur, lecture.rang, "LISTE DE LECTURE"),
      possessionDroite: possession(lecture.moteur, lecture.rang, "LA RÉPONSE PRODUITE"),
      question: lecture.question,
      sources: lecture.sources,
      totalSources: lecture.totalSources,
      rangClient: lecture.rangClient,
      texte,
      coupe,
      motsTotal: compterMots(texteBrut),
      motsExtrait: compterMots(texte),
      variantes,
      clientCite: lecture.clientCite,
      marque,
    });
  }

  // La bibliothèque : ce que les moteurs lisent, en traits-unités.
  if (donnees.sources.totalLectures) {
    const citableSet = new Set(citables.map((c) => c.hote));
    const genreDe = (d: { hote: string; votreSite: boolean }): "vous" | "concurrent" | "tiers" =>
      d.votreSite ? "vous" : citableSet.has(d.hote) ? "tiers" : "concurrent";
    const tete = donnees.sources.domaines.slice(0, 8);
    const lignes = tete.map((d) => ({ hote: d.hote, lectures: d.lectures, genre: genreDe(d) }));
    if (!lignes.some((l) => l.genre === "vous")) {
      const votre = donnees.sources.domaines.find((d) => d.votreSite);
      if (votre) lignes.push({ hote: votre.hote, lectures: votre.lectures, genre: "vous" });
      else if (donnees.domaine) lignes.push({ hote: donnees.domaine, lectures: 0, genre: "vous" });
    }
    const dernier = tete[tete.length - 1];
    const exAequo = dernier
      ? donnees.sources.domaines.filter((d) => d.lectures === dernier.lectures && !tete.includes(d))
          .length
      : 0;
    ecrans.push({
      type: "bibliotheque",
      kicker: `${donnees.sources.totalLectures} lectures avant d'écrire une ligne · un trait = une lecture`,
      message: `Avant de répondre, les moteurs ont fait ${donnees.sources.totalLectures} lectures. Voici leur bibliothèque, classée, et votre rang dedans.`,
      sens: "Les adresses tierces soulignées sont les portes ouvertes : une inscription suffit. Les sites concurrents, eux, ne vous accueilleront jamais.",
      lignes,
      totalLectures: donnees.sources.totalLectures,
      totalDomaines: donnees.sources.totalDomaines,
      exAequo: exAequo > 0 ? `${exAequo} domaine${s_(exAequo)} à égalité hors écran` : null,
    });
  }

  // PIÈCE C : le meilleur et le pire miroir, face à face.
  const verdicts = entree.analyse?.verdicts ?? [];
  const miroirDe = (moteur: string) => donnees.miroir.find((m) => m.moteur === moteur);
  const bonV = verdicts.find((v) => v.nature === "confiance" && miroirDe(v.moteur));
  const mauvaisV = verdicts.find((v) => v.nature === "doute" && miroirDe(v.moteur));
  if (bonV || mauvaisV) {
    ecrans.push({
      type: "piece-miroir",
      kicker: "question miroir, hors méthodologie · on a donné votre nom aux moteurs",
      message:
        bonV && mauvaisV
          ? "Même question, même jour, deux machines. L'une vous vend. L'autre vous enterre. Aucune des deux ne ment : l'une a pu vous lire, l'autre pas."
          : mauvaisV
            ? "On a donné votre nom aux machines. Voici, mot pour mot, ce que la plus méfiante a répondu."
            : "On a donné votre nom aux machines. Voici, mot pour mot, la plus confiante. Les autres n'ont pas su trancher.",
      sens: "Le vide n'est pas neutre : il est rempli par la méfiance. Votre visibilité ne vit que dans la couche lecture ; la mémoire des modèles appartient encore à vos concurrents.",
      bon: bonV
        ? {
            possession: possession(bonV.moteur, null, "MIROIR"),
            texte: miroirDe(bonV.moteur)!.extrait,
            phrase: bonV.phrase,
          }
        : null,
      mauvais: mauvaisV
        ? {
            possession: possession(mauvaisV.moteur, null, "MIROIR"),
            texte: miroirDe(mauvaisV.moteur)!.extrait,
            phrase: mauvaisV.phrase,
          }
        : null,
    });
  }

  // L'invention : le fait précis qu'aucune source ne soutient. GARDE-FOU
  // STRUCTUREL, dans le code : le verdict « invention » du modèle n'est
  // recevable QUE si le moteur n'a consulté aucune source de tout le scan
  // (il parle de mémoire). Un moteur qui source ses réponses a pu lire le
  // fait quelque part, y compris chez le client : on ne l'accuse jamais
  // d'inventer.
  const sourcesParMoteur = (moteur: string) =>
    entree.reponses.filter(
      (r) => r.engine === moteur && !r.error && Array.isArray(r.sources) && r.sources.length,
    ).length;
  const inventionV = verdicts.find(
    (v) => v.nature === "invention" && miroirDe(v.moteur) && sourcesParMoteur(v.moteur) === 0,
  );
  if (inventionV) {
    const sourcesDuMoteur = sourcesParMoteur(inventionV.moteur);
    ecrans.push({
      type: "piece-invention",
      kicker: "question miroir, hors méthodologie",
      message: `${inventionV.moteur} avance sur vous des faits que vous n'avez jamais publiés. Et vos prospects les lisent.`,
      sens: "La seule façon de couvrir une invention est de publier la version officielle : une page que les machines peuvent lire et citer.",
      possession: possession(inventionV.moteur, null, "MIROIR"),
      texte: miroirDe(inventionV.moteur)!.extrait,
      phrase: inventionV.phrase,
      sansSource: sourcesDuMoteur === 0,
    });
  }

  /* ================================================ ACTE IV · LE PLAN */
  ouvrirActe(3);

  // Les têtes de pont : la machine sait déjà vous choisir.
  const percees = entree.mentions
    .filter((m) => m.is_target && m.position !== null && m.verbatim)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .slice(0, 3)
    .map((m) => {
      const q = entree.questions.find((x) => x.id === m.query_id);
      const verbatimPropre = nettoyerTexte(String(m.verbatim));
      const e = extrait(verbatimPropre, 220);
      return {
        possession: possession(m.engine, q?.rank ?? null, "EXTRAIT"),
        position: m.position ?? 0,
        verbatim: e.texte,
        coupe: e.coupe,
        question: extrait(q?.text ?? "", 100).texte,
      };
    });
  const questionsPortantes = new Set(
    entree.mentions.filter((m) => m.is_target).map((m) => m.query_id),
  ).size;
  if (percees.length) {
    ecrans.push({
      type: "percees",
      kicker: "vos têtes de pont, relevées dans la mesure",
      message: `La preuve que la machine sait vous choisir existe déjà : elle est dans vos ${vous} réponses. On ne part pas de zéro, on part d'ici.`,
      sens: "On consolide d'abord ce qui est acquis : ces pages-là montrent le ton qui vous fait gagner.",
      cartes: percees,
      questionsPortantes,
      marque,
    });
  }

  // Six juges, une question.
  if (donnees.questionCle) {
    ecrans.push({
      type: "six-juges",
      kicker: "une même question, six juges",
      message:
        "Une même question, six moteurs, et personne ne défend votre place. Voilà la première page qu'on écrit.",
      sens: "Chaque juge a rendu sa copie : les noms en pastilles occupent votre place. La page qui répond à cette question est le premier livrable.",
      question: donnees.questionCle.texte,
      rangQ: donnees.questionCle.rang,
      totalQ,
      date: entree.date,
      faces: donnees.questionCle.faces.map((f) => ({
        moteur: f.moteur,
        modele: MODELES[f.moteur] ?? "",
        erreur: f.erreur,
        extrait: f.extrait ? extrait(f.extrait, 210).texte : null,
        marques: f.marques,
        statut: f.statut,
      })),
    });
  }

  // Le bon de commande éditorial.
  const pages = gagnables.slice(0, 5).map((g) => ({
    titre: extrait(g.texte, 120).texte,
    lus: sourcesParQuestion(entree.reponses, g.id),
  }));
  if (pages.length) {
    ecrans.push({
      type: "bon-commande",
      kicker: "un titre = une question où vous étiez absent",
      message: `${pages.length} pages à écrire, pas une de plus. Ce sont les questions où les moteurs ont cherché, et lu quelqu'un d'autre.`,
      sens: "Ce n'est pas un calendrier éditorial : c'est la liste des réponses que les machines cherchent déjà et ne trouvent pas chez vous.",
      possession: possession(null, null, "BON DE COMMANDE ÉDITORIAL"),
      pages,
    });
  }

  const ciblesSprint = citables.slice(3, 11).map(({ hote, lectures }) => ({ hote, lectures }));
  if (ciblesSprint.length >= 3) {
    ecrans.push({
      type: "portes-sprint",
      kicker: "les adresses relevées dans vos propres sources",
      message:
        "Et huit adresses où votre nom doit figurer. Pas des backlinks : les portes que vos propres réponses ont ouvertes.",
      sens: "Chaque adresse vient des lectures de VOTRE mesure, et chaque inscription obtenue sera recrawlée : si le nom n'y figure pas, elle ne compte pas.",
      lignes: ciblesSprint.slice(0, 8),
      note: "hors les trois adresses qu'on vous offre à l'écran suivant",
    });
  }

  /* ============================================== ACTE V · VOUS, SEUL */
  ouvrirActe(4);

  const offerts = citables.slice(0, 3);
  const panneauxGestes: { entete: string; lignes: string[]; creux: boolean; minium: string | null }[] =
    [];
  if (donnees.technique && !donnees.technique.llmstxt && donnees.domaine) {
    panneauxGestes.push({
      entete: `${donnees.domaine}/llms.txt`,
      lignes: [],
      creux: true,
      minium: "FICHIER ABSENT LORS DE LA MESURE",
    });
  }
  if (offerts.length >= 2) {
    panneauxGestes.push({
      entete: "INSCRIPTIONS À DEMANDER",
      lignes: offerts.map((o) => `${o.hote} · lu ${o.lectures} fois pendant votre mesure`),
      creux: false,
      minium: null,
    });
  }
  if (inventionV) {
    panneauxGestes.push({
      entete: "PAGE TARIFS OFFICIELLE",
      lignes: [
        `${inventionV.moteur} avance déjà des chiffres à votre place`,
        "publier la vôtre est la seule correction possible",
      ],
      creux: false,
      minium: null,
    });
  } else if (gagnables[0]) {
    panneauxGestes.push({
      entete: "LA PREMIÈRE PAGE DU PLAN",
      lignes: [extrait(gagnables[0].texte, 110).texte],
      creux: false,
      minium: null,
    });
  }
  if (panneauxGestes.length >= 2) {
    ecrans.push({
      type: "gestes",
      kicker: "avant tout devis · à faire vous-même, cette semaine",
      message: `${panneauxGestes.length === 3 ? "Trois" : "Deux"} gestes, sans nous, tirés de vos propres données. Ils sont à vous, que vous signiez ou non.`,
      sens: "Le cadeau est réel et vérifiable : une demi-journée de développeur, deux courriels. C'est aussi la preuve qu'on ne vend pas du vent.",
      panneaux: panneauxGestes,
    });
    if (rival0) {
      // Les deux colonnes ne comparent que des volumes RÉELS : à gauche ce
      // qu'on vient d'offrir, à droite ce que la mesure a relevé. Aucune
      // projection, aucun « impact estimé ».
      const terrain = [
        { compte: pages.length, libelle: "pages à écrire, relevées dans vos questions perdues" },
        { compte: ciblesSprint.length, libelle: "adresses où votre nom doit figurer" },
        { compte: rival0.reponses, libelle: `réponses déjà tenues par ${rival0.nom}` },
      ].filter((x) => x.compte > 0);
      ecrans.push({
        type: "bascule",
        kicker: "la limite de ces gestes",
        message: "Lisible n'est pas premier.",
        sens: `${rival0.nom} tient ${rival0.reponses} réponses parce qu'il publie depuis des années. Déloger une position installée demande du contenu, des relances et de la mesure : un chantier suivi.`,
        seul: [
          { compte: panneauxGestes.length, libelle: "gestes cette semaine, à votre main" },
        ],
        terrain,
      });
    }
  }

  /* ============================================ ACTE VI · LA DÉCISION */
  ouvrirActe(5);

  ecrans.push({
    type: "sprint",
    kicker: "le sprint geo · 4 semaines de travail, 90 jours de mesure",
    message:
      "Le même plan, exécuté : cinq contenus livrés, huit citations obtenues, les accès réparés, et la preuve chaque vendredi.",
    sens: "Ce que vous faites seul est partiel, lent et sans mesure. Le Sprint ajoute l'exécution, la vérification en ligne de chaque livrable, et la preuve écrite.",
    chantiers: [
      {
        titre: "Technique",
        seul: "vous posez le llms.txt",
        avecNous: [
          "audit complet, lu comme un robot d'IA le lit",
          "robots.txt, llms.txt, schema.org posés et vérifiés EN LIGNE",
          "identité verrouillée : mêmes nom, adresse, téléphone partout, fiche Wikidata",
          "passages réels de GPTBot, ClaudeBot, PerplexityBot comptés dans vos logs",
        ],
      },
      {
        titre: "Pages",
        seul: "vous écrivez la première",
        avecNous: [
          "5 contenus rédigés, livrés en Markdown et en HTML prêts à intégrer",
          "sujets classés par gagnabilité, validés avec vous avant rédaction",
          "chaque page signalée à Bing le jour J : indexée en heures, pas en semaines",
          "recontrôle en ligne : elle répond et porte son balisage, sinon elle ne compte pas",
        ],
      },
      {
        titre: "Citations",
        seul: `vous demandez ${offerts.length || 3} inscriptions`,
        avecNous: [
          "8 cibles : annuaires, comparateurs, presse spécialisée, fiches",
          "inscriptions réalisées, pitchs écrits, envoyés, relancés deux fois",
          "chaque citation obtenue recrawlée : le nom y figure, ou elle est reclassée",
          "kit « dix avis en trente jours » : près d'un tiers du score",
        ],
      },
    ],
    preuve: [
      "un email de preuve chaque vendredi pendant 4 semaines, liens et captures",
      "rapport d'étape au jour 30 · contrôle interne au jour 45, jamais présenté comme un score",
      "le call de restitution a lieu même si le résultat est mauvais",
    ],
  });

  ecrans.push({
    type: "piece-a-venir",
    kicker: "la dernière pièce du dossier",
    message: `La dernière pièce n'existe pas encore. Le ${quand}, on repose exactement ces ${totalQ} questions, aux mêmes moteurs, mêmes versions, même formule.`,
    sens: "Le seul engagement du dossier : la remesure datée. On garantit les actions livrées et cette pièce-là, jamais un rang.",
    date: quand,
    vosReponses: vous,
    lues,
    questions: totalQ,
    moteurs: donnees.echantillon.moteurs,
  });

  ecrans.push({
    type: "decision",
    kicker: "une seule offre · sans abonnement",
    message: `2 900 euros hors taxes, 90 jours, un seul client par secteur. Si c'est vous, ce n'est pas ${rival0 ? rival0.nom : "votre concurrent"}. Si votre score est bon, on vous le dit et on ne vous vend rien.`,
    sens: "La boucle se ferme sur la pièce 01 : la conversation qui se passait sans lui. La signature n'achète pas une promesse de rang, elle achète l'exécution et la remesure.",
    dateRemesure: quand,
    rappel: pieceA && possessionA ? { moteur: pieceA.moteur, rangQ: pieceA.rang, marque } : null,
    places: entree.places,
  });

  return { ecrans, actes };
}

/** L'acte d'un écran, pour le chrome (« ACTE 3 · POURQUOI EUX »). */
export function acteDe(actes: ActeVisio[], index: number): { nom: string; numero: number } {
  let courant = { nom: actes[0]?.nom ?? "", numero: 1 };
  actes.forEach((a, i) => {
    if (index >= a.debut) courant = { nom: a.nom, numero: i + 1 };
  });
  return courant;
}
