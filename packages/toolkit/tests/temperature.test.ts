import { describe, expect, it } from "vitest";
import { bonusScanGeo, pointsCapacite, pointsTaille, pointsVerticale, temperature, type ProspectClassable } from "../src/lib/temperature.js";

/**
 * Ce classement décide de l'ordre dans lequel le fondateur appelle cent
 * entreprises. Se tromper coûte des journées : appeler des froids d'abord, ou
 * pire, pousser un sprint à quelqu'un dont le score est déjà bon, ce que la
 * doctrine publique interdit.
 */

const p = (sur: Partial<ProspectClassable> = {}): ProspectClassable => ({
  entreprise: "Cabinet Test",
  verticale: "Expertise comptable",
  taille_salaries: "20 à 49",
  ceo_email: "", ceo_email_statut: "", ceo_nom: "",
  mkt_email: "", tel_mobile_site: "", tel_standard: "",
  email_entreprise: "contact@test.fr", emails_entreprise_tous: "contact@test.fr",
  signal_bots_ia_bloques: "", signal_pixels_pub: "", siren: "123456789",
  fiabilite: "A",
  ...sur,
});

describe("pointsTaille", () => {
  it("récompense la fourchette où le dirigeant décide seul", () => {
    // On teste le classement, pas la valeur absolue : les pondérations sont
    // rééquilibrées à mesure qu'on apprend, et un test sur le chiffre exact
    // casserait à chaque ajustement sans rien protéger.
    expect(pointsTaille("20 à 49")).toBe(pointsTaille("10-19"));
    expect(pointsTaille("10-19")).toBeGreaterThan(pointsTaille("6 à 9"));
    expect(pointsTaille("10-19")).toBeGreaterThan(pointsTaille("50-99"));
  });

  it("pénalise les tailles où le cycle s'allonge ou le budget manque", () => {
    expect(pointsTaille("50-99")).toBeLessThan(pointsTaille("10-19"));
    expect(pointsTaille("100 à 199")).toBeLessThan(pointsTaille("50-99"));
    expect(pointsTaille("3 à 5")).toBeLessThan(pointsTaille("6 à 9"));
  });

  it("reste prudent sur un effectif illisible plutôt que de sur-noter", () => {
    expect(pointsTaille("")).toBe(6);
    expect(pointsTaille("inconnu")).toBe(6);
  });
});

describe("pointsVerticale", () => {
  it("classe les trois verticales de la série", () => {
    expect(pointsVerticale("Gestion de patrimoine")).toBeGreaterThan(pointsVerticale("Services informatiques"));
    expect(pointsVerticale("Services informatiques")).toBeGreaterThan(pointsVerticale("Expertise comptable"));
  });
});

describe("temperature", () => {
  it("classe chaud un prospect joignable, avec budget et cause vérifiable", () => {
    const t = temperature(p({
      ceo_email: "j.durand@test.fr", ceo_email_statut: "verified",
      tel_mobile_site: "06 12 34 56 78",
      signal_bots_ia_bloques: "GPTBot", signal_pixels_pub: "Google Ads|Meta",
      emails_entreprise_tous: "a@test.fr|b@test.fr|c@test.fr",
    }));
    expect(t.palier).toBe("chaud");
    expect(t.pourquoi).toContain("GPTBot");
  });

  it("classe froid une fiche sans contact direct ni signal", () => {
    const t = temperature(p({ taille_salaries: "100 à 199", verticale: "Expertise comptable" }));
    expect(t.palier).toBe("froid");
  });

  it("met le blocage des robots d'IA en tête des raisons : c'est l'accroche", () => {
    const t = temperature(p({ ceo_email: "x@test.fr", signal_bots_ia_bloques: "ClaudeBot" }));
    expect(t.pourquoi.startsWith("bloque ClaudeBot")).toBe(true);
  });

  it("préfère un email vérifié à un email seulement publié", () => {
    const verifie = temperature(p({ ceo_email: "x@test.fr", ceo_email_statut: "verified" }));
    const publie = temperature(p({ ceo_email: "x@test.fr", ceo_email_statut: "publie_site" }));
    expect(verifie.score).toBeGreaterThan(publie.score);
  });

  it("ne dépasse jamais 100 ni ne descend sous 0", () => {
    const max = temperature(p({
      ceo_email: "x@test.fr", ceo_email_statut: "verified", mkt_email: "m@test.fr",
      tel_mobile_site: "0612345678", signal_bots_ia_bloques: "GPTBot|ClaudeBot",
      signal_pixels_pub: "Google Ads|Meta|LinkedIn", verticale: "Gestion de patrimoine",
      emails_entreprise_tous: "a@t.fr|b@t.fr|c@t.fr|d@t.fr", score_geo: "5",
    }));
    expect(max.score).toBeLessThanOrEqual(100);
    const min = temperature(p({
      email_entreprise: "", emails_entreprise_tous: "", siren: "", fiabilite: "D",
      taille_salaries: "500-999", score_geo: "95",
    }));
    expect(min.score).toBeGreaterThanOrEqual(0);
  });
});

describe("bonusScanGeo — la douleur mesurée prime sur les indices", () => {
  it("récompense fortement un score bas : invisible et prouvé", () => {
    expect(bonusScanGeo("8").points).toBe(20);
    expect(bonusScanGeo("8").raison).toContain("invisible");
  });

  it("pénalise un score élevé, conformément à la promesse publique", () => {
    // « Si votre score est bon, nous vous le dirons et nous ne vous vendrons rien. »
    expect(bonusScanGeo("78").points).toBeLessThan(0);
    expect(bonusScanGeo("78").raison).toContain("ne rien lui vendre");
  });

  it("ne fait rien quand aucun scan n'a tourné", () => {
    expect(bonusScanGeo(undefined).points).toBe(0);
    expect(bonusScanGeo("").points).toBe(0);
  });

  it("fait basculer un prospect moyen en chaud une fois sa douleur mesurée", () => {
    const avant = temperature(p({ ceo_email: "x@test.fr", ceo_email_statut: "verified", tel_standard: "0478000000" }));
    const apres = temperature({ ...p({ ceo_email: "x@test.fr", ceo_email_statut: "verified", tel_standard: "0478000000" }), score_geo: "9" });
    expect(apres.score).toBeGreaterThan(avant.score);
    expect(apres.pourquoi).toContain("score GEO");
  });
});

describe("équilibre des pondérations — le biais mesuré le 06/08/2026", () => {
  it("un signal d'achat pèse plus que la seule richesse du contact", () => {
    // Le premier classement mettait 20 sociétés informatiques sur 30 en tête,
    // parce qu'Apollo couvre mieux la tech : la note mesurait nos données, pas
    // le prospect. Un prospect avec une cause vérifiable doit désormais passer
    // devant un prospect seulement bien renseigné.
    const bienRenseigne = temperature(p({
      ceo_email: "x@test.fr", ceo_email_statut: "verified",
      tel_mobile_site: "0612345678", mkt_email: "m@test.fr",
    }));
    const avecSignal = temperature(p({
      email_entreprise: "contact@test.fr",
      signal_bots_ia_bloques: "GPTBot", signal_pixels_pub: "Google Ads",
    }));
    expect(avecSignal.score).toBeGreaterThan(bienRenseigne.score);
  });

  it("un email générique reste exploitable : l'écart au nominatif est mesuré", () => {
    const nominatif = temperature(p({ ceo_email: "x@test.fr", ceo_email_statut: "verified" }));
    const generique = temperature(p({ email_entreprise: "contact@test.fr" }));
    // Un écart existe, mais il ne doit pas décider à lui seul du classement.
    expect(nominatif.score - generique.score).toBeLessThanOrEqual(6);
    expect(nominatif.score).toBeGreaterThan(generique.score);
  });
});

describe("pointsCapacite — peut-il signer 2 900 € sans arbitrer ?", () => {
  it("récompense un résultat qui rend la dépense indolore", () => {
    // DV Experts : 1 024 834 € de résultat. Signe sans y penser.
    expect(pointsCapacite("1024834").points).toBe(20);
    expect(pointsCapacite("1024834").mention).toContain("signe sans arbitrer");
  });

  it("signale le prospect pour qui 2 900 € pèsent", () => {
    // Quovive : 4 018 € de résultat. La dépense est un vrai arbitrage.
    const q = pointsCapacite("4018");
    expect(q.points).toBeLessThan(10);
    expect(q.mention).toContain("pèseront");
  });

  it("écarte une société en perte", () => {
    expect(pointsCapacite("-15000").points).toBe(0);
    expect(pointsCapacite("-15000").mention).toContain("perte");
  });

  it("reste NEUTRE quand les comptes ne sont pas publiés", () => {
    // 35 sociétés sur 100 usent de la confidentialité, ce qui est légal.
    // Les pénaliser écarterait de bons prospects sur une donnée absente.
    const inconnu = pointsCapacite("").points;
    expect(inconnu).toBe(10);
    expect(inconnu).toBeGreaterThan(pointsCapacite("4018").points);
    expect(inconnu).toBeLessThan(pointsCapacite("200000").points);
  });

  it("un prospect solvable passe devant un prospect en perte, tout le reste égal", () => {
    const base = {
      entreprise: "X", verticale: "Expertise comptable", taille_salaries: "20 à 49",
      ceo_email: "a@x.fr", ceo_email_statut: "verified", ceo_nom: "A", mkt_email: "",
      tel_mobile_site: "", tel_standard: "0478000000", email_entreprise: "c@x.fr",
      emails_entreprise_tous: "c@x.fr", signal_bots_ia_bloques: "", signal_pixels_pub: "",
      siren: "1", fiabilite: "A",
    };
    const riche = temperature({ ...base, resultat_eur: "250000" });
    const perte = temperature({ ...base, resultat_eur: "-40000" });
    expect(riche.score - perte.score).toBe(20);
  });
});
