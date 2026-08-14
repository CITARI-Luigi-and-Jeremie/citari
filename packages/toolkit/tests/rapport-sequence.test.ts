import { describe, expect, it } from "vitest";

import { carteConcurrent, construireSequence } from "@/lib/rapport-sequence";
import { partDeVoix, type LigneMention, type LigneQuestion, type LigneReponse } from "@/lib/rapport-apercu";

/**
 * Invariants de COHÉRENCE de la séquence de résultat.
 *
 * Née le 14/08/2026, après une journée où chaque profil de scan différent
 * trouvait un trou neuf : GeoComply (un outil non classé) présenté comme
 * « qui prend votre place » sur une question de dépannage, « Abritel est
 * nommé plus souvent que vous » au-dessus de barres montrant 5 contre 14,
 * la carte 02 comptant 14 et la carte 04 comptant 13 pour la même marque.
 *
 * La règle de cette suite : le rapport ne doit JAMAIS se contredire, quel
 * que soit le profil (absent, derrière, à égalité, leader). Le moteur de
 * mesure a ses 216 tests ; la couche qui PRÉSENTE la mesure mérite les
 * siens, parce que c'est elle que le prospect lit.
 */

let compteur = 0;
const id = (prefixe: string) => `${prefixe}-${++compteur}`;

function question(rank: number, intent: string): LigneQuestion {
  return { id: id("q"), rank, text: `Question ${rank} (${intent})`, intent };
}

function reponse(queryId: string, engine = "Gemini"): LigneReponse {
  return { id: id("r"), query_id: queryId, engine, raw_text: "réponse réelle", error: null };
}

function mention(
  responseId: string,
  queryId: string,
  brand: string,
  options: Partial<LigneMention> = {},
): LigneMention {
  return {
    id: id("m"),
    query_id: queryId,
    response_id: responseId,
    engine: "Gemini",
    brand,
    is_target: false,
    position: null,
    recommended: false,
    sentiment: null,
    verbatim: null,
    ...options,
  };
}

const VERBATIM = "Une phrase suffisamment longue pour être une pièce exacte digne de ce nom, mot pour mot.";

function sequenceDe(entree: {
  questions: LigneQuestion[];
  reponses: LigneReponse[];
  mentions: LigneMention[];
  classes?: Record<string, string>;
  marque?: string;
  score?: number;
  miroir?: unknown;
  audit?: unknown;
}) {
  return construireSequence({
    marque: entree.marque ?? "Cible",
    domaine: "cible.fr",
    date: "2026-08-14",
    score: entree.score ?? 40,
    secteur: "Autre",
    questions: entree.questions,
    reponses: entree.reponses,
    mentions: entree.mentions,
    classes: entree.classes ?? {},
    alias: {},
    miroir: entree.miroir,
    audit: entree.audit,
  });
}

describe("carteConcurrent — le titre ne contredit jamais les chiffres", () => {
  it("marque jamais citée : « nommé. Vous, jamais. »", () => {
    const { titre, regime } = carteConcurrent("Abritel", 5, 0);
    expect(regime).toBe("jamais");
    expect(titre).toContain("Vous, jamais");
  });

  it("marque derrière : le multiple n'est annoncé que s'il est vrai", () => {
    expect(carteConcurrent("Abritel", 10, 4)).toMatchObject({
      regime: "derriere",
      titre: expect.stringContaining("deux fois plus souvent"),
    });
    expect(carteConcurrent("Abritel", 6, 4).titre).toBe("Abritel est nommé plus souvent que vous.");
  });

  it("à égalité : jeu égal, jamais « plus souvent »", () => {
    const { titre, regime, kicker } = carteConcurrent("Abritel", 7, 7);
    expect(regime).toBe("egal");
    expect(titre).not.toContain("plus souvent");
    expect(kicker).toBe("QUI VISE VOTRE PLACE");
  });

  it("marque devant : « Vous menez », le bug Airbnb ne peut pas revenir", () => {
    const { titre, regime, kicker } = carteConcurrent("Abritel", 5, 14);
    expect(regime).toBe("devant");
    expect(titre).toContain("Vous menez");
    expect(titre).not.toContain("plus souvent que vous");
    expect(kicker).toBe("QUI VISE VOTRE PLACE");
  });
});

describe("partDeVoix — la ligne de la marque est unique et cohérente", () => {
  it("regroupe les graphies de la cible sous un seul nom", () => {
    const q = question(1, "comparative");
    const r1 = reponse(q.id);
    const r2 = reponse(q.id);
    const lignes = [
      mention(r1.id, q.id, "Airbnb", { is_target: true }),
      mention(r2.id, q.id, "AirBnB", { is_target: true }),
      mention(r1.id, q.id, "Booking.com"),
    ];
    const pdv = partDeVoix(lignes, {}, 5, "Airbnb");
    const cibles = pdv.filter((l) => l.cible);
    expect(cibles).toHaveLength(1);
    expect(cibles[0]!.reponses).toBe(2);
  });

  it("la carte 02 et la carte 04 comptent la même chose", () => {
    const q = question(1, "comparative");
    const reponses = [reponse(q.id), reponse(q.id), reponse(q.id)];
    const mentions = [
      mention(reponses[0]!.id, q.id, "Cible", { is_target: true }),
      mention(reponses[1]!.id, q.id, "CIBLE SAS", { is_target: true }),
      mention(reponses[0]!.id, q.id, "Rival", { position: 1 }),
    ];
    const seq = sequenceDe({ questions: [q], reponses, mentions });
    const ligneVous = seq.voix.find((l) => l.vous);
    expect(ligneVous?.reponses).toBe(seq.vosReponses);
  });
});

describe("laPlusDure — la pièce est crédible ou n'existe pas", () => {
  function scanAbsence(classes: Record<string, string>, intent: string, brand: string) {
    const qCitee = question(1, "comparative");
    const qPerdue = question(2, intent);
    const rCitee = reponse(qCitee.id);
    const rPerdue = reponse(qPerdue.id);
    const mentions = [
      mention(rCitee.id, qCitee.id, "Cible", { is_target: true }),
      mention(rPerdue.id, qPerdue.id, brand, {
        position: 1,
        recommended: true,
        verbatim: VERBATIM,
      }),
    ];
    return sequenceDe({ questions: [qCitee, qPerdue], reponses: [rCitee, rPerdue], mentions, classes });
  }

  it("un outil classé n'est jamais la pièce, même recommandé en premier", () => {
    const seq = scanAbsence({ GeoComply: "outil" }, "comparative", "GeoComply");
    expect(seq.laPlusDure).toBeNull();
  });

  it("un non-classé sur une question de dépannage n'est pas la pièce (le cas GeoComply)", () => {
    const seq = scanAbsence({}, "probleme", "GeoComply");
    expect(seq.laPlusDure).toBeNull();
  });

  it("un non-classé sur une question d'achat est accepté", () => {
    const seq = scanAbsence({}, "comparative", "Concurrent Local");
    expect(seq.laPlusDure?.concurrent).toBe("Concurrent Local");
    expect(seq.laPlusDure?.votreStatut).toContain("absent");
  });

  it("un rival classé est accepté même sur une question problème", () => {
    const seq = scanAbsence({ Betclic: "rival" }, "probleme", "Betclic");
    expect(seq.laPlusDure?.concurrent).toBe("Betclic");
  });

  it("marque bien citée partout : l'étage dépassement prend le relais", () => {
    const q = question(1, "comparative");
    const r = reponse(q.id);
    const mentions = [
      mention(r.id, q.id, "Cible", { is_target: true, position: 2 }),
      mention(r.id, q.id, "Betclic", { position: 1, verbatim: VERBATIM }),
    ];
    const seq = sequenceDe({
      questions: [q],
      reponses: [r],
      mentions,
      classes: { Betclic: "rival" },
    });
    expect(seq.laPlusDure?.concurrent).toBe("Betclic");
    expect(seq.laPlusDure?.votreStatut).toContain("cité en position 2");
  });

  it("aucune pièce digne : la carte sort de la séquence, jamais de pièce tiède", () => {
    const q = question(1, "comparative");
    const r = reponse(q.id);
    const mentions = [mention(r.id, q.id, "Cible", { is_target: true, position: 1 })];
    const seq = sequenceDe({ questions: [q], reponses: [r], mentions });
    expect(seq.laPlusDure).toBeNull();
  });
});

describe("adversaire — jamais un outil ni une institution", () => {
  it("préfère un rival même moins cité qu'un géant", () => {
    const q = question(1, "comparative");
    const reponses = [reponse(q.id), reponse(q.id), reponse(q.id)];
    const mentions = [
      mention(reponses[0]!.id, q.id, "KPMG"),
      mention(reponses[1]!.id, q.id, "KPMG"),
      mention(reponses[2]!.id, q.id, "Rival Local"),
    ];
    const seq = sequenceDe({
      questions: [q],
      reponses,
      mentions,
      classes: { KPMG: "geant", "Rival Local": "rival" },
    });
    expect(seq.adversaire?.nom).toBe("Rival Local");
  });

  it("aucun concurrent : la carte n'existe pas", () => {
    const q = question(1, "comparative");
    const r = reponse(q.id);
    const seq = sequenceDe({
      questions: [q],
      reponses: [r],
      mentions: [mention(r.id, q.id, "Cible", { is_target: true })],
    });
    expect(seq.adversaire).toBeNull();
  });
});

describe("miroir et audit — les données payées par le gratuit sont montrées", () => {
  function base() {
    const q = question(1, "comparative");
    const r = reponse(q.id);
    return {
      questions: [q],
      reponses: [r],
      mentions: [mention(r.id, q.id, "Cible", { is_target: true })],
    };
  }

  it("le miroir apparaît quand la réponse existe", () => {
    const seq = sequenceDe({
      ...base(),
      miroir: [{ moteur: "ChatGPT", texte: "x".repeat(120) }],
    });
    expect(seq.miroir?.moteur).toBe("ChatGPT");
  });

  it("un miroir vide ou trop court ne fabrique pas de carte", () => {
    expect(sequenceDe({ ...base(), miroir: [] }).miroir).toBeNull();
    expect(sequenceDe({ ...base(), miroir: [{ texte: "trop court" }] }).miroir).toBeNull();
    expect(sequenceDe(base()).miroir).toBeNull();
  });

  it("l'audit sépare robots bloqués et autorisés", () => {
    const seq = sequenceDe({
      ...base(),
      audit: {
        ok: true,
        bots: {
          GPTBot: "bloque",
          ClaudeBot: "autorise",
          PerplexityBot: "bloque",
          "Google-Extended": "autorise",
        },
        llmstxt: true,
      },
    });
    expect(seq.technique?.bloques).toEqual(["GPTBot", "PerplexityBot"]);
    expect(seq.technique?.autorises).toEqual([
      { nom: "ClaudeBot", explicite: true },
      { nom: "Google-Extended", explicite: true },
    ]);
    expect(seq.technique?.llmstxt).toBe(true);
  });

  it("un robot non mentionné est autorisé par défaut, jamais perdu", () => {
    // Le bug du 14/08/2026 : `non_mentionne` n'était capté par aucun des deux
    // filtres, et le tableau s'affichait VIDE sur un site parfaitement ouvert.
    const seq = sequenceDe({
      ...base(),
      audit: {
        ok: true,
        bots: {
          GPTBot: "non_mentionne",
          ClaudeBot: "non_mentionne",
          PerplexityBot: "non_mentionne",
          "Google-Extended": "non_mentionne",
        },
        llmstxt: false,
      },
    });
    expect(seq.technique?.bloques).toEqual([]);
    expect(seq.technique?.autorises).toHaveLength(4);
    expect(seq.technique?.autorises.every((a) => a.explicite === false)).toBe(true);
  });

  it("un audit qui a échoué n'annonce jamais de portes ouvertes", () => {
    const seq = sequenceDe({ ...base(), audit: { ok: false, bots: {}, llmstxt: false } });
    expect(seq.technique).toBeNull();
  });
});
