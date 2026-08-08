import { MOTEURS, type Moteur } from "@/lib/typo";

/**
 * Dérivations de la page de rapport d'aperçu.
 *
 * La maquette de Jérémie (`CitariReportScreen`) attend un objet tout préparé,
 * qu'il remplissait avec un jeu d'exemple (« Ledgio », « 9 fois sur 36 »).
 * Ce fichier fabrique le même objet à partir de NOS lignes réelles : `scans`,
 * `queries`, `responses`, `mentions`.
 *
 * Deux règles s'appliquent partout ici :
 *
 * 1. On ne compte jamais les citations sur `share_of_voice`, qui est tronqué
 *    aux dix premiers plus la ligne du client. On compte sur `mentions`.
 * 2. Un moteur non interrogé n'a AUCUN texte. La maquette d'origine floutait
 *    une vraie réponse ; ici il n'y a rien à flouter, et il ne faut surtout
 *    rien inventer pour remplir la carte.
 */

export type LigneMention = {
  id: string;
  query_id: string;
  response_id: string;
  engine: string;
  brand: string;
  is_target: boolean;
  position: number | null;
  recommended: boolean;
  sentiment: string | null;
  verbatim: string | null;
};

export type LigneReponse = {
  id: string;
  query_id: string;
  engine: string;
  raw_text: string | null;
  error: string | null;
};

export type LigneQuestion = { id: string; rank: number; text: string; intent: string };

/** État d'une case (question × moteur) dans la maquette. */
export type Case =
  | { etat: "verrouille"; moteur: string }
  | { etat: "panne"; moteur: string }
  | { etat: "absent"; moteur: string; extrait: string | null; concurrents: string[] }
  | { etat: "cite"; moteur: string; extrait: string; concurrents: string[]; rang: number | null; recommande: boolean };

export type QuestionPreparee = {
  id: string;
  rang: number;
  texte: string;
  cases: Case[];
  /** Moteurs interrogés qui ne citent pas la marque. */
  sansVous: number;
  /** Moteurs interrogés, tout court. */
  ouverts: number;
};

/**
 * Extrait le plus parlant d'une réponse où la marque n'apparaît pas : on
 * privilégie une recommandation explicite, puis la meilleure position.
 */
function meilleurConcurrent(lignes: LigneMention[]): LigneMention | null {
  const avecTexte = lignes.filter((m) => !m.is_target && m.verbatim && m.verbatim.length > 20);
  if (avecTexte.length === 0) return null;
  const recommande = avecTexte.find((m) => m.recommended);
  if (recommande) return recommande;
  return [...avecTexte].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0] ?? null;
}

/** L'extrait où la marque est nommée, le mieux placé possible. */
function meilleureCitation(lignes: LigneMention[]): LigneMention | null {
  const cibles = lignes.filter((m) => m.is_target && m.verbatim && m.verbatim.length > 20);
  if (cibles.length === 0) return null;
  return [...cibles].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0] ?? null;
}

function coupe(texte: string | null, max = 260): string | null {
  if (!texte) return null;
  const propre = texte.replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  return `${propre.slice(0, max).replace(/[\s,;:]+\S*$/, "")}…`;
}

export function preparerQuestions(
  questions: LigneQuestion[],
  reponses: LigneReponse[],
  mentions: LigneMention[],
  moteursInterroges: string[],
): QuestionPreparee[] {
  const verrouilles = MOTEURS.filter((m) => !moteursInterroges.includes(m));

  return questions.map((q) => {
    const cases: Case[] = [];

    for (const moteur of moteursInterroges) {
      const reponse = reponses.find((r) => r.query_id === q.id && r.engine === moteur);
      if (!reponse || reponse.error) {
        cases.push({ etat: "panne", moteur });
        continue;
      }
      const lignes = mentions.filter((m) => m.response_id === reponse.id);
      const concurrents = [...new Set(lignes.filter((m) => !m.is_target).map((m) => m.brand))];
      const citation = meilleureCitation(lignes);

      if (citation) {
        cases.push({
          etat: "cite",
          moteur,
          extrait: coupe(citation.verbatim) ?? "",
          concurrents,
          rang: citation.position,
          recommande: citation.recommended,
        });
      } else {
        const rival = meilleurConcurrent(lignes);
        cases.push({
          etat: "absent",
          moteur,
          extrait: coupe(rival?.verbatim ?? reponse.raw_text),
          concurrents,
        });
      }
    }

    for (const moteur of verrouilles) cases.push({ etat: "verrouille", moteur });

    const ouverts = moteursInterroges.length;
    const sansVous = cases.filter((c) => c.etat === "absent" || c.etat === "panne").length;

    return { id: q.id, rang: q.rank, texte: q.text, cases, sansVous, ouverts };
  });
}

/** Les moteurs réellement présents dans les réponses, dans l'ordre canonique. */
export function moteursDesReponses(reponses: LigneReponse[]): string[] {
  const vus = new Set(reponses.map((r) => r.engine));
  return MOTEURS.filter((m: Moteur) => vus.has(m));
}

export type Adversaire = { nom: string; reponses: number; total: number; geant: boolean };

/**
 * Le concurrent qui prend la place.
 *
 * Deux précautions, toutes deux payées d'avance ailleurs dans le projet :
 *
 * - On compte en RÉPONSES, pas en citations. « 33 fois sur 280 » oblige le
 *   lecteur à deviner ce qu'est 280 ; « cité dans 33 réponses sur 40 » se lit
 *   sans effort, et c'est le même dénominateur que le reste de la page.
 * - On privilégie un RIVAL. Le plus cité dans l'absolu est souvent un géant
 *   (Deloitte, KPMG) : l'annoncer à un cabinet de quinze personnes est exact et
 *   décourageant, ça écrase au lieu d'indiquer une action. `concurrent_classes`
 *   vide signifie « tout est rival », le parti pris prudent.
 */
export function adversairePrincipal(
  mentions: LigneMention[],
  reponsesRetenues: number,
  classes: Record<string, string> = {},
  alias: Record<string, string> = {},
): Adversaire | null {
  const classeDe = (marque: string) => classes[alias[marque] ?? marque] ?? "rival";

  const parMarque = new Map<string, Set<string>>();
  for (const m of mentions) {
    if (m.is_target) continue;
    // Les institutions (ordres, chambres) sont citées comme références, jamais
    // comme prestataires à choisir : elles ne prennent la place de personne.
    if (classeDe(m.brand) === "institution") continue;
    const vu = parMarque.get(m.brand) ?? new Set<string>();
    vu.add(m.response_id);
    parMarque.set(m.brand, vu);
  }

  const tri = [...parMarque.entries()]
    .map(([nom, reponses]) => ({ nom, reponses: reponses.size, classe: classeDe(nom) }))
    .sort((a, b) => b.reponses - a.reponses);

  const rival = tri.find((c) => c.classe === "rival") ?? tri[0];
  if (!rival) return null;

  return {
    nom: rival.nom,
    reponses: rival.reponses,
    total: reponsesRetenues,
    geant: rival.classe === "geant",
  };
}

/** Réponses dans lesquelles la marque suivie apparaît, et non nombre de citations. */
export function reponsesAvecLaMarque(mentions: LigneMention[]): number {
  return new Set(mentions.filter((m) => m.is_target).map((m) => m.response_id)).size;
}

export type LignePdv = { nom: string; reponses: number; cible: boolean };

/**
 * La part de voix, comptée en RÉPONSES comme le reste de la page.
 *
 * On ne réutilise pas `share_of_voice` ici, pour deux raisons : il compte en
 * citations (un moteur qui nomme deux fois la même marque dans une réponse en
 * vaut deux), et il est tronqué aux dix premiers. Juxtaposer « cité dans 30
 * réponses sur 40 » et « 33 mentions » sur le même écran donne l'impression que
 * la page se contredit, alors que les deux nombres sont justes.
 *
 * Les variantes d'écriture sont regroupées avec `brand_aliases`, sans quoi
 * « Exco » et « Exco Lyon » feraient deux barres.
 */
export function partDeVoix(
  mentions: LigneMention[],
  alias: Record<string, string> = {},
  max = 5,
): LignePdv[] {
  const parNom = new Map<string, { reponses: Set<string>; cible: boolean }>();
  for (const m of mentions) {
    const nom = m.is_target ? m.brand : (alias[m.brand] ?? m.brand);
    const entree = parNom.get(nom) ?? { reponses: new Set<string>(), cible: m.is_target };
    entree.reponses.add(m.response_id);
    entree.cible = entree.cible || m.is_target;
    parNom.set(nom, entree);
  }

  const toutes = [...parNom.entries()]
    .map(([nom, v]) => ({ nom, reponses: v.reponses.size, cible: v.cible }))
    .sort((a, b) => b.reponses - a.reponses);

  // La ligne du client est garantie présente, même hors du haut de tableau :
  // sans elle, un client classé onzième apparaissait à zéro.
  const tete = toutes.slice(0, max);
  const cible = toutes.find((l) => l.cible);
  if (cible && !tete.some((l) => l.cible)) tete.push(cible);
  return tete;
}

/** Questions où la marque n'apparaît sur AUCUN moteur : l'argument du manque. */
export function questionsPerdues(questions: LigneQuestion[], mentions: LigneMention[]): number {
  const citee = new Set(mentions.filter((m) => m.is_target).map((m) => m.query_id));
  return questions.filter((q) => !citee.has(q.id)).length;
}

/** Réponses réellement obtenues : une panne ne compte pas au dénominateur. */
export function reponsesRetenues(reponses: LigneReponse[]): number {
  return reponses.filter((r) => !r.error && r.raw_text).length;
}

/**
 * Ce que l'audit a déjà relevé sur le site, et rien d'autre.
 *
 * Si tout est en ordre, on ne dit rien : inventer un problème pour donner du
 * grain à l'appel final serait exactement ce que la méthode reproche aux
 * autres.
 */
export function constatsDuSite(
  audit: { ok?: boolean; bots?: Record<string, string>; llmstxt?: boolean } | null,
): string[] {
  if (!audit?.ok) return [];
  const constats: string[] = [];
  const bloques = Object.entries(audit.bots ?? {})
    .filter(([, etat]) => etat === "bloque")
    .map(([nom]) => nom);
  if (bloques.length > 0) {
    constats.push(
      `Votre site bloque ${bloques.join(", ")} : ${bloques.length > 1 ? "ces robots" : "ce robot"} ne peuvent pas vous lire.`,
    );
  }
  if (audit.llmstxt === false) {
    constats.push("Votre site n’a pas de fichier llms.txt, qui indique aux moteurs quoi lire.");
  }
  return constats;
}

/**
 * La réponse la plus dure : un concurrent explicitement recommandé sur une
 * question où la marque n'apparaît sur AUCUN moteur. C'est la même sélection
 * que celle de l'aguiche, pour que les deux écrans racontent la même chose.
 */
export function reponseLaPlusDure(
  mentions: LigneMention[],
): { moteur: string; texte: string; marque: string } | null {
  const questionsCitees = new Set(mentions.filter((m) => m.is_target).map((m) => m.query_id));
  const candidates = mentions.filter(
    (m) =>
      !m.is_target &&
      m.verbatim &&
      m.verbatim.length > 60 &&
      !questionsCitees.has(m.query_id),
  );
  const recommande = candidates.find((m) => m.recommended) ?? candidates[0];
  if (!recommande) return null;
  return {
    moteur: recommande.engine,
    texte: coupe(recommande.verbatim, 320) ?? "",
    marque: recommande.brand,
  };
}
