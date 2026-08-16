import { MOTEURS } from "@/lib/typo";
import {
  adversairePrincipal,
  partDeVoix,
  reponsesAvecLaMarque,
  reponsesRetenues,
  type Adversaire,
  type LigneMention,
  type LigneQuestion,
  type LigneReponse,
} from "@/lib/rapport-apercu";
import { carteConcurrent, marquerConcurrent } from "@/lib/rapport-sequence";

/**
 * Assemblage du DOCUMENT DE MESURE (modes `complet` et `controle`).
 *
 * Refonte du 15/08/2026 : le document servait des tableaux bruts, il sert
 * désormais un déroulé de visio. Tout est calculé ici, en fonctions pures et
 * testées ; la page ne fait qu'afficher. Les règles de la maison
 * s'appliquent sans exception :
 *
 * - l'unité est la RÉPONSE, jamais la citation : les comptages viennent de
 *   `mentions` regroupées par `response_id`, jamais de `share_of_voice` ;
 * - une réponse en erreur ne compte dans aucun dénominateur ;
 * - le rival mis en avant est atteignable (`concurrent_classes`), les
 *   institutions ne prennent la place de personne ;
 * - chaque titre de section énonce le constat avec les chiffres réels : si
 *   une donnée manque, la section sort du document, elle n'affiche jamais
 *   un gabarit vide.
 */

export type LigneSourceReponse = LigneReponse & { sources?: unknown };

export type CelluleMatrice = {
  etat: "cite" | "absent" | "erreur";
  /** Meilleure position de la marque dans la réponse (1 = citée en premier). */
  position: number | null;
  recommande: boolean;
};

export type LigneMatrice = {
  id: string;
  rang: number;
  texte: string;
  intent: string;
  citee: boolean;
  /**
   * Au moins un moteur a réellement répondu. Une question dont TOUTES les
   * cellules sont en erreur (panne, ou collecte arrêtée par le plafond de
   * coût) n'est pas « perdue » : elle n'est pas mesurée, et elle ne doit
   * entrer dans aucun dénominateur ni aucun classement.
   */
  mesuree: boolean;
  /** Qui occupe la question : rival de préférence, sinon géant, sinon outil. */
  tenant: { nom: string; classe: string; reponses: number } | null;
  cellules: Record<string, CelluleMatrice>;
};

export type Matrice = {
  moteurs: string[];
  lignes: LigneMatrice[];
  /** Par moteur : questions où la marque est citée / questions mesurées. */
  totaux: Record<string, { citees: number; mesurees: number }>;
  questionsCitees: number;
  questionsMesurees: number;
};

export type SourceAgregee = {
  hote: string;
  lectures: number;
  moteurs: string[];
  votreSite: boolean;
};

export type SourcesDocument = {
  domaines: SourceAgregee[];
  totalLectures: number;
  totalDomaines: number;
  lecturesVotreSite: number;
  moteursAvecSources: string[];
};

export type QuestionGagnable = {
  id: string;
  rang: number;
  texte: string;
  intent: string;
  raison: string;
  tenants: { nom: string; classe: string; reponses: number }[];
};

export type FaceMoteur = {
  moteur: string;
  erreur: boolean;
  extrait: string | null;
  coupe: boolean;
  statut: string;
  marques: string[];
};

export type QuestionCle = {
  id: string;
  rang: number;
  texte: string;
  enjeu: string;
  faces: FaceMoteur[];
} | null;

export type Piece = {
  question: string;
  rang: number;
  moteur: string;
  concurrent: string;
  /** Verbatim nettoyé, concurrent marqué `*...*`, coupé pour l'écran. */
  texte: string;
  coupe: boolean;
  statut: string;
};

export type ActionPlan = { chantier: string; titre: string; pourquoi: string; effort: string };

export type CiblePlan = { titre: string; detail: string };

export type PhasePlan = {
  nom: string;
  periode: string;
  /** Le fait MESURÉ qui justifie la phase : jamais une promesse. */
  constat: string;
  actions: ActionPlan[];
  cibles: CiblePlan[];
};

export type TechniqueDocument = {
  bloques: string[];
  autorises: { nom: string; explicite: boolean }[];
  llmstxt: boolean;
} | null;

export interface DonneesDocument {
  marque: string;
  domaine: string | null;
  echantillon: {
    questions: number;
    moteurs: number;
    reponsesLues: number;
    reponsesEnErreur: number;
  };
  composantes: {
    presence: number;
    rang: number | null;
    recommandation: number;
    tonalite: number;
  } | null;
  matrice: Matrice;
  titreMatrice: string;
  duel: { kicker: string; titre: string; vous: number; adversaire: Adversaire } | null;
  voix: {
    lignes: { nom: string; reponses: number; cible: boolean; classe: string | null }[];
    marquesTotal: number;
    reponsesPerdues: number;
    vosReponses: number;
  };
  pieces: Piece[];
  questionCle: QuestionCle;
  miroir: { moteur: string; extrait: string; coupe: boolean; texte: string }[];
  technique: TechniqueDocument;
  sources: SourcesDocument;
  titreSources: string | null;
  plan: PhasePlan[];
}

/* ------------------------------------------------------------------ outils */

/** Coupe au mot, sans jamais tronquer en plein milieu d'un terme. */
export function extrait(texte: string, max = 320): { texte: string; coupe: boolean } {
  const propre = texte.trim();
  if (propre.length <= max) return { texte: propre, coupe: false };
  let morceau = propre.slice(0, max);
  const dernierEspace = morceau.lastIndexOf(" ");
  if (dernierEspace > max * 0.6) morceau = morceau.slice(0, dernierEspace);
  return { texte: `${morceau.trim()} …`, coupe: true };
}

/** Le markdown des moteurs, aplati pour un extrait : gras et titres retirés. */
function aplatir(texte: string): string {
  return texte
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** « https://www.exemple.fr/page?utm_source=openai » → « exemple.fr ». */
export function hoteDeSource(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** L'hôte du site client, pour reconnaître ses propres pages dans les sources. */
export function hoteClient(site: string | null): string | null {
  if (!site) return null;
  const brut = site.trim().replace(/^https?:\/\//i, "").split("/")[0] ?? "";
  return brut ? brut.toLowerCase().replace(/^www\./, "") : null;
}

const classeDeFabrique = (classes: Record<string, string>, alias: Record<string, string>) =>
  (marque: string): string | null => classes[alias[marque] ?? marque] ?? null;

/* ---------------------------------------------------------------- matrice */

/**
 * La carte complète de la mesure : chaque question × chaque moteur, un état.
 * C'est la pièce centrale du partage d'écran : l'ampleur du trou se voit
 * avant d'être lue.
 */
export function construireMatrice(
  questions: LigneQuestion[],
  reponses: LigneReponse[],
  mentions: LigneMention[],
  classes: Record<string, string> = {},
  alias: Record<string, string> = {},
): Matrice {
  const moteurs = MOTEURS.filter((m) => reponses.some((r) => r.engine === m));
  const classeDe = classeDeFabrique(classes, alias);

  const parCle = new Map<string, LigneReponse>();
  for (const r of reponses) parCle.set(`${r.query_id}|${r.engine}`, r);

  const ciblesParReponse = new Map<string, { position: number | null; recommande: boolean }>();
  for (const m of mentions) {
    if (!m.is_target) continue;
    const connue = ciblesParReponse.get(m.response_id) ?? { position: null, recommande: false };
    if (typeof m.position === "number") {
      connue.position =
        connue.position === null ? m.position : Math.min(connue.position, m.position);
    }
    connue.recommande = connue.recommande || m.recommended;
    ciblesParReponse.set(m.response_id, connue);
  }

  const lignes: LigneMatrice[] = questions.map((q) => {
    const cellules: Record<string, CelluleMatrice> = {};
    for (const moteur of moteurs) {
      const rep = parCle.get(`${q.id}|${moteur}`);
      if (!rep || rep.error || !rep.raw_text) {
        cellules[moteur] = { etat: "erreur", position: null, recommande: false };
        continue;
      }
      const cible = ciblesParReponse.get(rep.id);
      cellules[moteur] = cible
        ? { etat: "cite", position: cible.position, recommande: cible.recommande }
        : { etat: "absent", position: null, recommande: false };
    }

    // Le tenant : la marque (hors institutions) la plus présente sur la
    // question, rivaux d'abord. Compté en réponses distinctes, comme partout.
    const parMarque = new Map<string, Set<string>>();
    for (const m of mentions) {
      if (m.is_target || m.query_id !== q.id) continue;
      const nom = alias[m.brand] ?? m.brand;
      if (classeDe(nom) === "institution") continue;
      const vu = parMarque.get(nom) ?? new Set<string>();
      vu.add(m.response_id);
      parMarque.set(nom, vu);
    }
    const candidats = [...parMarque.entries()]
      .map(([nom, r]) => ({ nom, classe: classeDe(nom) ?? "rival", reponses: r.size }))
      // Départage par nom : `mentions` arrive sans ORDER BY, deux rivaux ex
      // æquo nommeraient sinon un tenant différent d'une ouverture à l'autre.
      .sort((a, b) => b.reponses - a.reponses || a.nom.localeCompare(b.nom));
    const tenant =
      candidats.find((c) => c.classe === "rival") ??
      candidats.find((c) => c.classe === "geant") ??
      candidats[0] ??
      null;

    return {
      id: q.id,
      rang: q.rank,
      texte: q.text,
      intent: q.intent,
      citee: Object.values(cellules).some((c) => c.etat === "cite"),
      mesuree: Object.values(cellules).some((c) => c.etat !== "erreur"),
      tenant,
      cellules,
    };
  });

  const totaux: Record<string, { citees: number; mesurees: number }> = {};
  for (const moteur of moteurs) {
    const mesurees = lignes.filter((l) => l.cellules[moteur]?.etat !== "erreur").length;
    const citees = lignes.filter((l) => l.cellules[moteur]?.etat === "cite").length;
    totaux[moteur] = { citees, mesurees };
  }

  return {
    moteurs,
    lignes,
    totaux,
    questionsCitees: lignes.filter((l) => l.citee).length,
    questionsMesurees: lignes.filter((l) => l.mesuree).length,
  };
}

/**
 * Le dénominateur est le nombre de questions MESURÉES. Quand la collecte a
 * été amputée (panne, plafond de coût), le titre le dit au lieu de compter
 * des questions sans mesure comme des défaites.
 */
export function titreMatrice(citees: number, mesurees: number, posees: number): string {
  const cadre =
    mesurees === posees
      ? `Sur ${posees} questions posées,`
      : `Sur ${posees} questions posées, ${mesurees} ont pu être mesurées ;`;
  if (citees === 0) return `${cadre} votre marque n'apparaît jamais.`;
  if (citees === 1) return `${cadre} votre marque apparaît sur une seule.`;
  return `${cadre} votre marque apparaît sur ${citees}.`;
}

/* ---------------------------------------------------------------- sources */

/**
 * Les sites que les moteurs sont allés LIRE pour répondre, tous moteurs
 * confondus. La version précédente ne comptait que Perplexity : ChatGPT,
 * Claude et Gemini en renvoyaient aussi, et elles dormaient dans la base.
 */
export function agregerSources(
  reponses: LigneSourceReponse[],
  site: string | null,
): SourcesDocument {
  const client = hoteClient(site);
  const parHote = new Map<string, { lectures: number; moteurs: Set<string> }>();
  let totalLectures = 0;
  let lecturesVotreSite = 0;
  const moteursAvecSources = new Set<string>();

  for (const r of reponses) {
    if (r.error) continue;
    const liste = Array.isArray(r.sources) ? (r.sources as { url?: unknown }[]) : [];
    for (const s of liste) {
      if (typeof s?.url !== "string") continue;
      const hote = hoteDeSource(s.url);
      if (!hote) continue;
      totalLectures += 1;
      moteursAvecSources.add(r.engine);
      const entree = parHote.get(hote) ?? { lectures: 0, moteurs: new Set<string>() };
      entree.lectures += 1;
      entree.moteurs.add(r.engine);
      parHote.set(hote, entree);
      if (client && (hote === client || hote.endsWith(`.${client}`))) lecturesVotreSite += 1;
    }
  }

  const domaines = [...parHote.entries()]
    .map(([hote, v]) => ({
      hote,
      lectures: v.lectures,
      moteurs: MOTEURS.filter((m) => v.moteurs.has(m)),
      votreSite: Boolean(client && (hote === client || hote.endsWith(`.${client}`))),
    }))
    .sort((a, b) => b.lectures - a.lectures || a.hote.localeCompare(b.hote))
    .slice(0, 20);

  return {
    domaines,
    totalLectures,
    totalDomaines: parHote.size,
    lecturesVotreSite,
    moteursAvecSources: MOTEURS.filter((m) => moteursAvecSources.has(m)),
  };
}

export function titreSources(s: SourcesDocument): string | null {
  if (!s.totalLectures) return null;
  const votre =
    s.lecturesVotreSite === 0
      ? "Le vôtre : jamais."
      : s.lecturesVotreSite === 1
        ? "Le vôtre : une seule fois."
        : `Le vôtre : ${s.lecturesVotreSite} fois.`;
  return `Pour répondre, les moteurs ont lu ${s.totalDomaines} site${s.totalDomaines > 1 ? "s" : ""}. ${votre}`;
}

/* ----------------------------------------------------- questions gagnables */

const POIDS_INTENT: Record<string, number> = { comparative: 10, locale: 8, confiance: 4, probleme: 3 };

/**
 * Les questions perdues les plus prenables : intention d'achat d'abord, champ
 * faiblement tenu ensuite. Un géant sur la question la rend chère à prendre,
 * un rival isolé la rend accessible. C'est la logique de `prioriser`, réduite
 * à ce que le document doit montrer : cinq cibles, chacune avec sa raison.
 */
export function questionsGagnables(
  matrice: Matrice,
  mentions: LigneMention[],
  classes: Record<string, string> = {},
  alias: Record<string, string> = {},
  max = 5,
): QuestionGagnable[] {
  const classeDe = classeDeFabrique(classes, alias);

  return matrice.lignes
    // Une question non MESURÉE n'est pas une question perdue : sans aucune
    // réponse, « personne ne tient cette question » serait une affirmation
    // fabriquée à partir d'une panne, et elle sortirait en tête du plan.
    .filter((l) => !l.citee && l.mesuree)
    .map((l) => {
      const parMarque = new Map<string, Set<string>>();
      for (const m of mentions) {
        if (m.is_target || m.query_id !== l.id) continue;
        const nom = alias[m.brand] ?? m.brand;
        const classe = classeDe(nom);
        if (classe === "institution" || classe === "outil") continue;
        const vu = parMarque.get(nom) ?? new Set<string>();
        vu.add(m.response_id);
        parMarque.set(nom, vu);
      }
      const tenants = [...parMarque.entries()]
        .map(([nom, r]) => ({ nom, classe: classeDe(nom) ?? "rival", reponses: r.size }))
        .sort((a, b) => b.reponses - a.reponses || a.nom.localeCompare(b.nom));
      const geants = tenants.filter((t) => t.classe === "geant").length;
      const rivaux = tenants.filter((t) => t.classe !== "geant").length;
      const score = (POIDS_INTENT[l.intent] ?? 3) * 3 - geants * 4 - rivaux;
      return { ligne: l, tenants, geants, rivaux, score };
    })
    .sort((a, b) => b.score - a.score || a.ligne.rang - b.ligne.rang)
    .slice(0, max)
    .map(({ ligne, tenants, geants }) => ({
      id: ligne.id,
      rang: ligne.rang,
      texte: ligne.texte,
      intent: ligne.intent,
      tenants: tenants.slice(0, 3),
      raison: raisonGagnable(tenants, geants),
    }));
}

function raisonGagnable(
  tenants: { nom: string; classe: string; reponses: number }[],
  geants: number,
): string {
  if (!tenants.length) return "Personne ne tient cette question : la place est vide.";
  const premiers = tenants
    .slice(0, 2)
    .map((t) => `${t.nom} (${t.reponses} réponse${t.reponses > 1 ? "s" : ""})`)
    .join(" et ");
  if (geants === 0) return `Tenue par ${premiers}, aucun géant : une page ciblée peut prendre cette place.`;
  return `${premiers} occupe${tenants.length > 1 ? "nt" : ""} la réponse ; le terrain reste disputable, aucune marque n'y est installée partout.`;
}

/* -------------------------------------------------------- question décisive */

/**
 * LA question à montrer en visio : celle où le plus de prestataires se
 * disputent la réponse, de préférence une comparative où la marque est
 * absente. Les six réponses côte à côte valent tous les tableaux.
 */
export function choisirQuestionCle(
  questions: LigneQuestion[],
  reponses: LigneReponse[],
  mentions: LigneMention[],
  marque: string,
  classes: Record<string, string> = {},
  alias: Record<string, string> = {},
): QuestionCle {
  const classeDe = classeDeFabrique(classes, alias);
  const moteurs = MOTEURS.filter((m) => reponses.some((r) => r.engine === m));

  let choisie: { q: LigneQuestion; score: number } | null = null;
  for (const q of questions) {
    const valides = reponses.filter((r) => r.query_id === q.id && !r.error && r.raw_text);
    // Au moins la moitié des moteurs doivent avoir répondu : un face-à-face
    // amputé de plus de moitié ne montre pas un marché, il montre une panne.
    if (valides.length < Math.max(1, Math.ceil(moteurs.length / 2))) continue;
    const prestataires = new Set(
      mentions
        .filter((m) => m.query_id === q.id && !m.is_target)
        .map((m) => alias[m.brand] ?? m.brand)
        .filter((nom) => {
          const classe = classeDe(nom);
          return classe !== "institution" && classe !== "outil";
        }),
    );
    const citee = mentions.some((m) => m.query_id === q.id && m.is_target);
    const score =
      prestataires.size +
      (q.intent === "comparative" ? 4 : q.intent === "locale" ? 2 : 0) +
      (citee ? 0 : 3) +
      valides.length / 10;
    if (!choisie || score > choisie.score) choisie = { q, score };
  }
  if (!choisie) return null;

  const q = choisie.q;
  const faces: FaceMoteur[] = moteurs.map((moteur) => {
    const rep = reponses.find((r) => r.query_id === q.id && r.engine === moteur);
    if (!rep || rep.error || !rep.raw_text)
      return { moteur, erreur: true, extrait: null, coupe: false, statut: "réponse indisponible", marques: [] };
    const deLaReponse = mentions.filter((m) => m.response_id === rep.id);
    const cible = deLaReponse
      .filter((m) => m.is_target && typeof m.position === "number")
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0];
    const marques = [
      ...new Set(deLaReponse.filter((m) => !m.is_target).map((m) => alias[m.brand] ?? m.brand)),
    ].slice(0, 4);
    const e = extrait(aplatir(rep.raw_text), 300);
    return {
      moteur,
      erreur: false,
      extrait: e.texte,
      coupe: e.coupe,
      statut: cible
        ? `${marque} : cité en position ${cible.position}`
        : deLaReponse.some((m) => m.is_target)
          ? `${marque} : cité`
          : `${marque} : absent`,
      marques,
    };
  });

  const marquesTotal = new Set(
    mentions
      .filter((m) => m.query_id === q.id && !m.is_target)
      .map((m) => alias[m.brand] ?? m.brand),
  ).size;
  const citeeQuelquePart = mentions.some((m) => m.query_id === q.id && m.is_target);
  const enjeu = citeeQuelquePart
    ? `${marquesTotal} marques se partagent cette réponse ; la vôtre y figure.`
    : `${marquesTotal} marques se partagent cette réponse. La vôtre n'y est pas.`;

  return { id: q.id, rang: q.rank, texte: q.text, enjeu, faces };
}

/* -------------------------------------------------------------- les pièces */

/**
 * Les phrases exactes où un concurrent CRÉDIBLE prend la place. Même
 * sélection à deux étages que la carte de l'aperçu (l'absence d'abord, le
 * dépassement ensuite), mêmes garde-fous : un concurrent non classé n'est
 * retenu que sur une question d'achat, jamais sur un dépannage.
 */
export function piecesAConviction(
  questions: LigneQuestion[],
  mentions: LigneMention[],
  marque: string,
  classes: Record<string, string> = {},
  alias: Record<string, string> = {},
  exclure: string | null = null,
  max = 3,
): Piece[] {
  const classeDe = classeDeFabrique(classes, alias);
  const intentDe = new Map(questions.map((q) => [q.id, q.intent]));
  const questionsCitees = new Set(mentions.filter((m) => m.is_target).map((m) => m.query_id));

  const credible = (m: LigneMention) => {
    const classe = classeDe(m.brand);
    if (classe === "rival" || classe === "geant") return true;
    return classe === null && ["comparative", "locale"].includes(intentDe.get(m.query_id) ?? "");
  };
  const exploitable = (m: LigneMention) =>
    !m.is_target && Boolean(m.verbatim) && (m.verbatim as string).length > 60 && m.query_id !== exclure;

  const POIDS_CLASSE: Record<string, number> = { rival: 40, geant: 10 };
  const interet = (m: LigneMention) =>
    (POIDS_CLASSE[classeDe(m.brand) ?? "rival"] ?? 0) +
    (POIDS_INTENT[intentDe.get(m.query_id) ?? ""] ?? 0) +
    (m.recommended ? 6 : 0) +
    (m.position === 1 ? 2 : 0);

  const positionCible = new Map<string, number>();
  for (const m of mentions) {
    if (m.is_target && typeof m.position === "number") {
      const connue = positionCible.get(m.response_id);
      if (connue === undefined || m.position < connue) positionCible.set(m.response_id, m.position);
    }
  }

  const absences = mentions
    .filter((m) => exploitable(m) && !questionsCitees.has(m.query_id) && credible(m))
    .sort(
      (a, b) =>
        interet(b) - interet(a) ||
        (a.position ?? 99) - (b.position ?? 99) ||
        // Départage stable : `mentions` arrive sans ORDER BY, deux pièces ex
        // æquo changeraient sinon d'une ouverture du rapport à l'autre.
        a.id.localeCompare(b.id),
    );
  const depassements = mentions
    .filter((m) => {
      if (!exploitable(m) || !credible(m)) return false;
      const cible = positionCible.get(m.response_id);
      return typeof cible === "number" && typeof m.position === "number" && m.position < cible;
    })
    .sort(
      (a, b) =>
        interet(b) - interet(a) ||
        (a.position ?? 99) - (b.position ?? 99) ||
        // Départage stable : `mentions` arrive sans ORDER BY, deux pièces ex
        // æquo changeraient sinon d'une ouverture du rapport à l'autre.
        a.id.localeCompare(b.id),
    );

  const retenues: Piece[] = [];
  const questionsPrises = new Set<string>();
  for (const m of [...absences, ...depassements]) {
    if (retenues.length >= max) break;
    if (questionsPrises.has(m.query_id)) continue;
    const q = questions.find((x) => x.id === m.query_id);
    if (!q) continue;
    questionsPrises.add(m.query_id);
    const marqueTexte = marquerConcurrent(m.verbatim as string, m.brand);
    const e = extrait(marqueTexte, 340);
    const enAbsence = !questionsCitees.has(m.query_id);
    retenues.push({
      question: q.text,
      rang: q.rank,
      moteur: m.engine,
      concurrent: alias[m.brand] ?? m.brand,
      texte: e.texte,
      coupe: e.coupe,
      statut: enAbsence
        ? `${marque} : absent de cette réponse`
        : `${marque} : cité en position ${positionCible.get(m.response_id)}`,
    });
  }
  return retenues;
}

/* ------------------------------------------------------------------- plan */

/**
 * Le plan des 90 jours : trois phases, chacune ouverte par un CONSTAT mesuré,
 * remplie par les actions du scan et fermée par des cibles calculées. On ne
 * promet jamais un score, on liste ce qu'il y a à faire et pourquoi.
 */
export function construirePlan(entree: {
  actions: ActionPlan[];
  gagnables: QuestionGagnable[];
  sources: SourcesDocument;
  technique: TechniqueDocument;
  matrice: Matrice;
  site: string | null;
}): PhasePlan[] {
  const { actions, gagnables, sources, technique, matrice } = entree;
  const client = hoteClient(entree.site);
  const parChantier = (nom: string) => actions.filter((a) => a.chantier === nom);

  const constatTechnique = !technique
    ? "Le fichier robots.txt du site n'a pas pu être lu pendant la mesure : c'est la première chose à vérifier."
    : technique.bloques.length
      ? `${technique.bloques.join(", ")} ${technique.bloques.length > 1 ? "sont refusés" : "est refusé"} par votre serveur : tant que ce refus tient, rien de ce que vous publiez ne peut être lu.${technique.llmstxt ? "" : " Le fichier llms.txt est absent."}`
      : `Aucun robot d'IA n'est refusé par votre serveur${technique.llmstxt ? " et le fichier llms.txt est présent" : ", mais le fichier llms.txt est absent"} : ce qui manque n'est pas l'autorisation, c'est la matière à lire.`;

  const perdues = matrice.questionsMesurees - matrice.questionsCitees;
  const constatContenu =
    perdues === 0
      ? "Votre marque apparaît sur toutes les questions mesurées : le chantier consiste à consolider ces positions."
      : `${perdues} question${perdues > 1 ? "s" : ""} sur ${matrice.questionsMesurees} mesurée${matrice.questionsMesurees > 1 ? "s" : ""} se ${perdues > 1 ? "jouent" : "joue"} sans vous. ${gagnables.length ? `Les ${gagnables.length} plus prenables sont listées ci-dessous, avec qui les tient aujourd'hui.` : ""}`.trim();

  const constatCitations = sources.totalLectures
    ? `Pour répondre, les moteurs ont lu ${sources.totalDomaines} sites (${sources.totalLectures} lectures). Votre site : ${sources.lecturesVotreSite === 0 ? "aucune" : sources.lecturesVotreSite}. Être présent sur ces sites, c'est être dans la matière première des réponses.`
    : "Les moteurs interrogés n'ont pas exposé leurs sources sur cet échantillon : les cibles de citation seront établies à partir de l'audit.";

  const ciblesCitations: CiblePlan[] = sources.domaines
    .filter((d) => !d.votreSite && (!client || d.hote !== client))
    .slice(0, 8)
    .map((d) => ({
      titre: d.hote,
      detail: `${d.lectures} lecture${d.lectures > 1 ? "s" : ""} pendant la mesure · ${d.moteurs.join(", ")}`,
    }));

  return [
    {
      nom: "Ouvrir les portes",
      periode: "J1 à J15",
      constat: constatTechnique,
      actions: parChantier("Technique"),
      cibles: [],
    },
    {
      nom: "Écrire ce qui manque",
      periode: "J8 à J45",
      constat: constatContenu,
      actions: parChantier("Contenu"),
      cibles: gagnables.map((g) => ({ titre: `« ${g.texte} »`, detail: g.raison })),
    },
    {
      nom: "Être cité là où les IA lisent",
      periode: "J30 à J90",
      constat: constatCitations,
      actions: parChantier("Citations"),
      cibles: ciblesCitations,
    },
  ];
}

/* -------------------------------------------------------------- assemblage */

/** Les robots testés par l'audit flash, dans l'ordre d'affichage. */
const ROBOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"] as const;

/** `scans.audit` → trois états par robot ; `null` si le relevé a échoué. */
export function lireAudit(audit: unknown): TechniqueDocument {
  const brut = audit as { ok?: boolean; bots?: Record<string, string>; llmstxt?: boolean } | null;
  const bots = brut?.ok && brut.bots ? brut.bots : null;
  if (!bots) return null;
  const connus = ROBOTS.filter((r) => typeof bots[r] === "string");
  if (!connus.length) return null;
  return {
    bloques: connus.filter((r) => bots[r] === "bloque"),
    autorises: connus
      .filter((r) => bots[r] !== "bloque")
      .map((r) => ({ nom: r, explicite: bots[r] === "autorise" })),
    llmstxt: Boolean(brut?.llmstxt),
  };
}

export function construireDocument(entree: {
  marque: string;
  site: string | null;
  questions: LigneQuestion[];
  reponses: LigneSourceReponse[];
  mentions: LigneMention[];
  classes: Record<string, string>;
  alias: Record<string, string>;
  mesures?: {
    mention_rate?: number | string | null;
    avg_position?: number | string | null;
    reco_rate?: number | string | null;
    sentiment_score?: number | string | null;
  } | null;
  miroir?: unknown;
  audit?: unknown;
  actions?: unknown;
}): DonneesDocument {
  const { marque, questions, reponses, mentions, classes, alias } = entree;

  const retenues = reponsesRetenues(reponses);
  const vosReponses = reponsesAvecLaMarque(mentions);
  const matrice = construireMatrice(questions, reponses, mentions, classes, alias);

  const adversaire = adversairePrincipal(mentions, retenues, classes, alias);
  const duel = adversaire
    ? { ...carteConcurrent(adversaire.nom, adversaire.reponses, vosReponses), vous: vosReponses, adversaire }
    : null;

  const classeDe = classeDeFabrique(classes, alias);
  const voixLignes = partDeVoix(mentions, alias, 8, marque).map((l) => ({
    ...l,
    classe: l.cible ? null : classeDe(l.nom),
  }));

  // Réponses où un concurrent est nommé et pas la marque.
  const parReponse = new Map<string, { cible: boolean; concurrent: boolean }>();
  for (const m of mentions) {
    const e = parReponse.get(m.response_id) ?? { cible: false, concurrent: false };
    if (m.is_target) e.cible = true;
    else e.concurrent = true;
    parReponse.set(m.response_id, e);
  }
  const reponsesPerdues = [...parReponse.values()].filter((e) => e.concurrent && !e.cible).length;

  const marquesTotal = new Set(
    mentions.map((m) => (m.is_target ? marque : (alias[m.brand] ?? m.brand))),
  ).size;

  const questionCle = choisirQuestionCle(questions, reponses, mentions, marque, classes, alias);
  const pieces = piecesAConviction(
    questions,
    mentions,
    marque,
    classes,
    alias,
    questionCle?.id ?? null,
  );

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
        };

  const miroir = (Array.isArray(entree.miroir) ? entree.miroir : [])
    .filter(
      (m): m is { moteur?: string; texte: string } =>
        Boolean(m) &&
        typeof (m as { texte?: unknown }).texte === "string" &&
        (m as { texte: string }).texte.trim().length > 40,
    )
    .map((m) => {
      const texte = m.texte.trim();
      const e = extrait(aplatir(texte), 360);
      return { moteur: m.moteur ?? "moteur", extrait: e.texte, coupe: e.coupe, texte };
    });

  const technique = lireAudit(entree.audit);
  const sources = agregerSources(reponses, entree.site);

  const actions = (Array.isArray(entree.actions) ? entree.actions : []).filter(
    (a): a is ActionPlan =>
      Boolean(a) &&
      typeof (a as ActionPlan).titre === "string" &&
      typeof (a as ActionPlan).chantier === "string",
  );
  const gagnables = questionsGagnables(matrice, mentions, classes, alias);
  const plan = construirePlan({
    actions,
    gagnables,
    sources,
    technique,
    matrice,
    site: entree.site,
  });

  return {
    marque,
    domaine: entree.site,
    echantillon: {
      questions: questions.length,
      moteurs: matrice.moteurs.length,
      reponsesLues: retenues,
      reponsesEnErreur: reponses.filter((r) => Boolean(r.error)).length,
    },
    composantes,
    matrice,
    titreMatrice: titreMatrice(
      matrice.questionsCitees,
      matrice.questionsMesurees,
      matrice.lignes.length,
    ),
    duel,
    voix: { lignes: voixLignes, marquesTotal, reponsesPerdues, vosReponses },
    pieces,
    questionCle,
    miroir,
    technique,
    sources,
    titreSources: titreSources(sources),
    plan,
  };
}
