import { describe, expect, it } from "vitest";
import {
  codesEffectif,
  enCsv,
  estHorsCible,
  extraireEntreprise,
  ligneScanLot,
  normaliserNaf,
  siegeDansZone,
  trier,
  type Entreprise,
} from "../src/lib/sirene.js";

/**
 * Le sourcing décide de qui entre dans le pipeline, donc de qui reçoit un
 * jour un email avec son nom dedans. Une tranche d'effectif mal traduite
 * écarte les bons prospects ; un filtre de siège absent fait scanner le
 * baromètre lyonnais avec des sièges parisiens.
 */

const entreprise = (sur: Partial<Entreprise> = {}): Entreprise => ({
  siren: "123456789",
  nom: "Cabinet Test",
  commune: "LYON",
  codePostal: "69003",
  departement: "69",
  effectif: "20 à 49",
  categorie: "PME",
  natureJuridique: "5710",
  creation: "2015-01-01",
  dirigeants: [],
  ...sur,
});

describe("codesEffectif", () => {
  it("traduit la cible Citari 10-249 en cinq tranches INSEE", () => {
    expect(codesEffectif("10-249")).toEqual(["11", "12", "21", "22", "31"]);
  });

  it("retient une tranche dès qu'elle chevauche la plage demandée", () => {
    // 10-100 doit inclure « 100 à 199 » : une entreprise de 100 salariés y vit.
    expect(codesEffectif("10-100")).toEqual(["11", "12", "21", "22"]);
  });

  it("refuse une plage illisible ou inversée", () => {
    expect(() => codesEffectif("beaucoup")).toThrow(/illisible/);
    expect(() => codesEffectif("50-10")).toThrow(/inversée/);
  });
});

describe("normaliserNaf", () => {
  it("accepte les deux écritures et rend la forme pointée de l'API", () => {
    expect(normaliserNaf("6920Z")).toBe("69.20Z");
    expect(normaliserNaf("69.20z")).toBe("69.20Z");
  });

  it("refuse un code qui n'a pas la forme NAF", () => {
    expect(() => normaliserNaf("experts-comptables")).toThrow(/NAF/);
  });
});

describe("siegeDansZone", () => {
  it("écarte un siège hors zone même si l'API l'a renvoyé", () => {
    // Le piège mesuré en réel : chercher « Rhône » renvoie un siège à Montluçon.
    const montlucon = entreprise({ codePostal: "03100", departement: "03" });
    expect(siegeDansZone(montlucon, { departements: ["69"] })).toBe(false);
  });

  it("un seul critère satisfait suffit, département ou code postal", () => {
    const e = entreprise();
    expect(siegeDansZone(e, { departements: ["69"], codesPostaux: ["75001"] })).toBe(true);
    expect(siegeDansZone(e, { departements: ["01"], codesPostaux: ["69003"] })).toBe(true);
  });

  it("sans zone demandée, tout passe", () => {
    expect(siegeDansZone(entreprise(), {})).toBe(true);
  });
});

describe("estHorsCible", () => {
  it("écarte le droit public, garde sociétés et associations", () => {
    expect(estHorsCible(entreprise({ natureJuridique: "7210" }))).toBe(true);
    expect(estHorsCible(entreprise({ natureJuridique: "5710" }))).toBe(false);
    // Cerfrance est une association et un acteur réel du marché : elle reste.
    expect(estHorsCible(entreprise({ natureJuridique: "9220" }))).toBe(false);
  });
});

describe("extraireEntreprise", () => {
  it("lit la tranche d'effectif de l'ENTREPRISE, jamais celle du siège", () => {
    const e = extraireEntreprise({
      siren: "377793401",
      nom_complet: "PREMIUM EXPERTISE",
      tranche_effectif_salarie: "12",
      siege: { libelle_commune: "MONTLUCON", code_postal: "03100", departement: "03" },
    });
    expect(e?.effectif).toBe("20 à 49");
  });

  it("formate les dirigeants, personnes physiques et morales", () => {
    const e = extraireEntreprise({
      siren: "1",
      nom_complet: "X",
      dirigeants: [
        { type_dirigeant: "personne physique", prenoms: "Marie", nom: "Durand", qualite: "Gérant" },
        { type_dirigeant: "personne morale", denomination: "FITECO", qualite: "Président de SAS" },
      ],
    });
    expect(e?.dirigeants).toEqual(["Marie Durand (Gérant)", "FITECO (Président de SAS)"]);
  });

  it("rend null sans nom ou sans SIREN plutôt qu'une ligne vide", () => {
    expect(extraireEntreprise({ siren: "1" })).toBeNull();
    expect(extraireEntreprise({ nom_complet: "X" })).toBeNull();
  });
});

describe("sorties", () => {
  it("produit la ligne exacte que scan-lot sait relire", () => {
    expect(ligneScanLot(entreprise({ nom: "Cabinet Vaurel" }))).toBe("Cabinet Vaurel,");
  });

  it("échappe les points-virgules et guillemets dans le CSV", () => {
    const csv = enCsv([entreprise({ nom: 'Durand; Fils "et Cie"' })]);
    expect(csv).toContain('"Durand; Fils ""et Cie"""');
    expect(csv.split("\n")[0]).toContain("site_web");
  });

  it("trie par commune puis par nom, pour travailler zone par zone", () => {
    const tri = trier([
      entreprise({ nom: "Zeta", commune: "VILLEURBANNE" }),
      entreprise({ nom: "Beta", commune: "LYON" }),
      entreprise({ nom: "Alpha", commune: "LYON" }),
    ]);
    expect(tri.map((e) => e.nom)).toEqual(["Alpha", "Beta", "Zeta"]);
  });
});
