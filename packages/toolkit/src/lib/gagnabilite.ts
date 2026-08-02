/**
 * Gagnabilité d'une question perdue : peut-on raisonnablement y faire entrer
 * le client avant le re-scan J+90 ?
 *
 * Toutes les questions perdues ne se valent pas. « Meilleur logiciel comptable
 * France » face à des géants est ingagnable en 90 jours ; « cabinet spécialisé
 * BTP à Villeurbanne » se gagne en trois semaines. Les 5 contenus du sprint
 * doivent viser les gagnables : c'est ce qui maximise le delta mesuré à J+90,
 * qui est précisément ce qu'on vend.
 *
 * C'est une heuristique, pas une mesure : elle ordonne, elle ne prédit pas.
 */

/** Domaines éditoriaux ou agrégateurs qu'un contenu de PME ne délogera pas en 90 jours. */
export const FORTERESSES = [
  "wikipedia.org",
  "pagesjaunes.fr",
  "trustpilot.com",
  "capterra.fr",
  "capterra.com",
  "g2.com",
  "appvizer.fr",
  "seloger.com",
  "doctolib.fr",
  "tripadvisor.fr",
  "tripadvisor.com",
  "booking.com",
  "lesnumeriques.com",
  "journaldunet.com",
];

export interface QuestionPerdue {
  texte: string;
  intent: string | null;
  /** Marques distinctes citées par les moteurs sur cette question. */
  marquesCitees: string[];
  /** Le concurrent dominant du scan (1er en part de voix) y est-il cité ? */
  dominantPresent: boolean;
  /** Domaines des sources consultées par les moteurs sur cette question. */
  domainesSources: string[];
}

export interface Gagnabilite {
  score: number; // 0..100, plus haut = plus gagnable
  raisons: string[];
  format: string; // format de contenu suggéré
}

const BASE_PAR_INTENT: Record<string, number> = {
  locale: 40,
  confiance: 30,
  probleme: 25,
  comparative: 15,
};

const FORMAT_PAR_INTENT: Record<string, string> = {
  locale: "page locale (ville + spécialité, NAP cohérent)",
  confiance: "page preuves : certifications, avis, méthode",
  probleme: "guide ou FAQ métier balisée schema.org",
  comparative: "comparatif honnête hébergé chez le client (tableau factuel, concurrents inclus)",
};

export function scoreGagnabilite(q: QuestionPerdue): Gagnabilite {
  const raisons: string[] = [];
  let score = BASE_PAR_INTENT[q.intent ?? ""] ?? 20;
  raisons.push(`intention ${q.intent ?? "inconnue"} (base ${score})`);

  if (q.marquesCitees.length === 0) {
    score += 25;
    raisons.push("terrain vide : aucun moteur ne cite personne (+25)");
  } else {
    const malus = Math.min(30, q.marquesCitees.length * 3);
    score -= malus;
    raisons.push(`${q.marquesCitees.length} marques déjà citées (−${malus})`);
  }

  if (q.dominantPresent) {
    score -= 10;
    raisons.push("le concurrent dominant y est installé (−10)");
  } else if (q.marquesCitees.length > 0) {
    score += 10;
    raisons.push("le dominant n'y est pas : pas de forteresse locale (+10)");
  }

  const forteresses = q.domainesSources.filter((d) =>
    FORTERESSES.some((f) => d === f || d.endsWith(`.${f}`))
  );
  if (forteresses.length > 0) {
    score -= 15;
    raisons.push(`sources verrouillées par ${[...new Set(forteresses)].slice(0, 2).join(", ")} (−15)`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    raisons,
    format: FORMAT_PAR_INTENT[q.intent ?? ""] ?? "réponse directe à la question",
  };
}
