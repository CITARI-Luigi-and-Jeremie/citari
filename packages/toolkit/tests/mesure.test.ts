import { describe, expect, it } from "vitest";
import { POIDS, calculerScore, type LigneMention } from "@/lib/score";
import { cleDomaine, memeMarque, normaliserNom, prioriteDuScore } from "@/lib/orchestrateur.server";

/**
 * La mesure elle-même, enfin testée.
 *
 * `calculerScore` et `memeMarque` décident du chiffre qu'on annonce au client
 * et de la progression qu'on lui facture. Aucun test ne les couvrait : ceux qui
 * existaient portaient sur `computeScore` et `detectMentions`, leurs ancêtres
 * de `packages/core`, que plus personne n'exécutait. Une suite verte donnait
 * donc l'illusion de protéger la partie du produit qui compte le plus.
 *
 * Ces fonctions sont importées, pas recopiées : l'alias est posé dans
 * `vitest.config.ts`. Importer `orchestrateur.server.ts` n'ouvre aucune
 * connexion, son client Supabase étant construit paresseusement.
 */

const rep = (...moteurs: string[]) => moteurs.map((engine, i) => ({ id: `r${i}`, engine }));

const mention = (o: Partial<LigneMention> = {}): LigneMention => ({
  engine: "ChatGPT",
  brand: "Nous",
  is_target: true,
  position: 1,
  recommended: true,
  sentiment: "positif",
  ...o,
});

describe("la formule du score est figée", () => {
  it("pèse 50 / 20 / 20 / 10, et pas autrement", () => {
    // La formule est publiée au client et la comparaison J+90 n'a de sens que
    // si elle ne bouge jamais. Ce test existe pour qu'un changement se voie.
    expect(POIDS).toEqual({ mention: 0.5, position: 0.2, reco: 0.2, sentiment: 0.1 });
    expect(POIDS.mention + POIDS.position + POIDS.reco + POIDS.sentiment).toBeCloseTo(1, 10);
  });

  it("rend 100 quand tout est parfait", () => {
    const score = calculerScore(rep("ChatGPT", "Gemini"), [
      mention({ engine: "ChatGPT" }),
      mention({ engine: "Gemini" }),
    ]);
    expect(score.global).toBe(100);
  });

  it("rend 0 quand la marque n'est jamais citée", () => {
    const score = calculerScore(rep("ChatGPT", "Gemini"), [
      mention({ is_target: false, brand: "Rival" }),
    ]);
    expect(score.global).toBe(0);
    expect(score.mentionRate).toBe(0);
  });

  it("divise par le nombre de RÉPONSES, pas de mentions", () => {
    // Citée une fois sur deux réponses, en tête, recommandée, ton positif :
    // 50 % × 0,5 + 20 % × 0,5 + 20 % × 0,5 + 10 % × 1 = 55.
    const score = calculerScore(rep("ChatGPT", "Gemini"), [mention()]);
    expect(score.global).toBe(55);
  });

  it("sanctionne un mauvais rang sans toucher à la présence", () => {
    // Citée partout mais en cinquième position, jamais recommandée, ton neutre.
    const score = calculerScore(
      rep("ChatGPT", "Gemini"),
      [
        mention({ engine: "ChatGPT", position: 5, recommended: false, sentiment: "neutre" }),
        mention({ engine: "Gemini", position: 5, recommended: false, sentiment: "neutre" }),
      ],
    );
    expect(score.mentionRate).toBe(1);
    expect(score.global).toBe(63);
  });

  it("laisse à null le score d'un moteur qui n'a rendu aucune réponse", () => {
    // C'est ainsi que le rapport distingue « mal noté » de « pas mesuré ».
    const score = calculerScore(rep("ChatGPT"), [mention()]);
    expect(score.parMoteur["ChatGPT"]).toBe(100);
    expect(score.parMoteur["Claude"]).toBeNull();
    expect(score.parMoteur["Le Chat"]).toBeNull();
  });
});

describe("memeMarque", () => {
  it("reconnaît une marque massacrée par le moteur", () => {
    // Le bug d'origine : « nutri)smar » ne matchait jamais « NutriSmart » et
    // produisait un 0/100 artefactuel présenté comme un diagnostic.
    expect(memeMarque("NutriSmart", "nutri)smar")).toBe(true);
  });

  it("ignore accents et apostrophes", () => {
    expect(memeMarque("L'Oréal", "loreal")).toBe(true);
    expect(normaliserNom("L'Oréal")).toBe("l oreal");
  });

  it("reconnaît une déclinaison du même nom", () => {
    expect(memeMarque("Amarris", "Amarris Direct")).toBe(true);
    expect(memeMarque("Cabinet Vaurel", "Vaurel")).toBe(true);
  });

  it("ne confond pas deux entreprises distinctes", () => {
    expect(memeMarque("Fiducial", "Fidal")).toBe(false);
    expect(memeMarque("KPMG", "BDO")).toBe(false);
  });

  it("refuse les libellés trop courts pour signifier quelque chose", () => {
    expect(memeMarque("A", "Amarris")).toBe(false);
    expect(memeMarque("", "Amarris")).toBe(false);
  });

  it("ne capte plus un nom court noyé dans un nom plus long", () => {
    // Corrigé le 06/08/2026. L'ancienne version cherchait une sous-chaîne :
    // un client nommé « Ora » récoltait les mentions d'« Orange », et son
    // score montait pour de mauvaises raisons. C'est le pire sens de l'erreur,
    // puisqu'on aurait annoncé une visibilité qui se serait évaporée au J+90.
    expect(memeMarque("Ora", "Orange")).toBe(false);
    expect(memeMarque("Sage", "Message")).toBe(false);
    expect(memeMarque("Axa", "Maxandre")).toBe(false);
  });

  it("garde les sigles courts quand ils forment un mot entier", () => {
    // La frontière de mot est ce qui permet de resserrer sans casser : « BDO »
    // reste reconnu dans « BDO France », mais pas au milieu d'un autre mot.
    expect(memeMarque("BDO", "BDO France")).toBe(true);
    expect(memeMarque("RSM", "RSM Rhône-Alpes")).toBe(true);
    expect(memeMarque("EY", "EYbens Conseil")).toBe(false);
  });

  it("tolère une troncature, pas un préfixe quelconque", () => {
    // Un moteur qui écorche un nom en produit une forme presque aussi longue.
    // Le seuil de 80 % sépare « nutrismar » de « nutrismart » (90 %) d'un
    // simple préfixe comme « ora » dans « orange » (50 %).
    expect(memeMarque("NutriSmart", "NutriSmar")).toBe(true);
    expect(memeMarque("Cerfrance", "Cerfranc")).toBe(true);
    expect(memeMarque("Compta", "Comptabilité Générale du Rhône")).toBe(false);
  });
});

describe("clé de cache et priorité commerciale", () => {
  it("réduit une URL à son domaine, www ignoré", () => {
    expect(cleDomaine("https://www.Amarris.fr/contact", "Amarris", "compta", "Nantes")).toBe(
      "amarris.fr",
    );
    expect(cleDomaine("amarris.fr", "Amarris", "compta", null)).toBe("amarris.fr");
  });

  it("retombe sur marque + secteur + ville quand l'URL manque ou ne vaut rien", () => {
    expect(cleDomaine(null, "Cabinet Vaurel", "Expertise comptable", "Lyon")).toBe(
      "cabinet vaurel|expertise comptable|lyon",
    );
    expect(cleDomaine("pas une url", "Amarris", "compta", null)).toBe("amarris|compta|");
  });

  it("classe le prospect selon son score, le plus bas étant le plus chaud", () => {
    expect(prioriteDuScore(0)).toBe("chaud");
    expect(prioriteDuScore(24)).toBe("chaud");
    expect(prioriteDuScore(25)).toBe("tiede");
    expect(prioriteDuScore(54)).toBe("tiede");
    expect(prioriteDuScore(55)).toBe("froid");
  });
});

describe("coupePhrase", () => {
  it("ne coupe jamais en plein mot : elle finit sur une phrase", async () => {
    const { coupePhrase } = await import("../src/lib/insights.js");
    const texte =
      "In Extenso est un très bon choix pour les PME. Son réseau national industrialise la paie et accompagne les dossiers complexes. Fiducial reste une alternative sérieuse.";
    const coupe = coupePhrase(texte, 100);
    expect(coupe).toBe("In Extenso est un très bon choix pour les PME.");
  });

  it("retombe sur le dernier espace quand aucune phrase ne finit avant la limite", async () => {
    const { coupePhrase } = await import("../src/lib/insights.js");
    const texte = "Une très longue énumération sans aucune ponctuation forte qui continue encore et encore";
    const coupe = coupePhrase(texte, 60);
    expect(coupe.endsWith("…")).toBe(true);
    // La coupe tombe sur une frontière de mot : le texte avant « … » doit être
    // un préfixe du texte original se terminant par un mot entier.
    const avant = coupe.slice(0, -1);
    expect(texte.startsWith(avant)).toBe(true);
    expect(texte[avant.length]).toBe(" ");
  });

  it("nettoie le markdown des moteurs", async () => {
    const { coupePhrase } = await import("../src/lib/insights.js");
    expect(coupePhrase("**Evol**, puis `Comète` et _Astra_.", 100)).toBe("Evol, puis Comète et Astra.");
  });

  it("rend le texte intact quand il tient", async () => {
    const { coupePhrase } = await import("../src/lib/insights.js");
    expect(coupePhrase("Court.", 100)).toBe("Court.");
  });
});
