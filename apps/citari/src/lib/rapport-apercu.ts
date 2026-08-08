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

export type Adversaire = { nom: string; citations: number; total: number };

/**
 * Le concurrent qui prend la place, compté sur `mentions` et non sur la part
 * de voix : celle-ci est tronquée et ne permet aucun comptage.
 */
export function adversairePrincipal(mentions: LigneMention[]): Adversaire | null {
  const compte = new Map<string, number>();
  for (const m of mentions) {
    if (m.is_target) continue;
    compte.set(m.brand, (compte.get(m.brand) ?? 0) + 1);
  }
  const tri = [...compte.entries()].sort((a, b) => b[1] - a[1]);
  const premier = tri[0];
  if (!premier) return null;
  return { nom: premier[0], citations: premier[1], total: mentions.length };
}

export function citationsCible(mentions: LigneMention[]): number {
  return mentions.filter((m) => m.is_target).length;
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
