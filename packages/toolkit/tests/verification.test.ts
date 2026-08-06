import { describe, expect, it } from "vitest";
import {
  dansZone,
  domaineEmail,
  domaineSite,
  emailCoherent,
  emailValide,
  noterFiabilite,
  type LigneProspect,
} from "../src/lib/verification.js";
import { parserCsv } from "../src/commands/verifier-base.js";

/**
 * Ce module décide qui reçoit un email et qui est écarté. Une erreur ici coûte
 * soit un rebond qui abîme la réputation du domaine d'envoi, soit un bon
 * prospect jeté. Les cas testés sont ceux rencontrés en réel sur la base de
 * 102 lignes du 06/08/2026.
 */

const ligne = (sur: Partial<LigneProspect> = {}): LigneProspect => ({
  entreprise: "Cabinet Test",
  site_web: "https://www.cabinet-test.fr",
  code_postal: "69003",
  ville: "LYON",
  siren: "123456789",
  ceo_email: "p.durand@cabinet-test.fr",
  ceo_email_statut: "verified",
  email_entreprise: "contact@cabinet-test.fr",
  tel_standard: "04 78 12 34 56",
  tel_mobile_site: "",
  ceo_nom: "Durand",
  ...sur,
});

describe("emailValide", () => {
  it("accepte les formes réelles rencontrées", () => {
    for (const e of ["gatien@happiconseil.com", "b.hedia@monecp.fr", "marc.esteve@agilinvest.fr", "sbg@agili3f.com"]) {
      expect(emailValide(e)).toBe(true);
    }
  });

  it("refuse les formes qui rebondiraient", () => {
    for (const e of ["", "contact@", "@domaine.fr", "deux..points@x.fr", "sans-arobase.fr", "x@y"]) {
      expect(emailValide(e)).toBe(false);
    }
  });
});

describe("domaines", () => {
  it("extrait le domaine d'un site quelle que soit son écriture", () => {
    expect(domaineSite("https://www.cabinet.fr/contact")).toBe("cabinet.fr");
    expect(domaineSite("http://cabinet.fr")).toBe("cabinet.fr");
    expect(domaineSite("cabinet.fr/")).toBe("cabinet.fr");
  });

  it("extrait le domaine d'un email", () => {
    expect(domaineEmail("p.durand@cabinet.fr")).toBe("cabinet.fr");
    expect(domaineEmail("illisible")).toBe("");
  });
});

describe("emailCoherent", () => {
  it("accepte le même domaine, et les marques voisines du même groupe", () => {
    expect(emailCoherent("a@cabinet.fr", "https://cabinet.fr")).toBe(true);
    // Cas réel : Wize Expert / Wize Up, deux marques d'une même maison.
    expect(emailCoherent("mrativet@wizeup.fr", "https://www.wize-expert.fr")).toBe(true);
  });

  it("signale un domaine franchement étranger", () => {
    // Cas réel : Canopée Patrimoine, email sur magnacarta.fr.
    expect(emailCoherent("x@magnacarta.fr", "https://canopeepatrimoine.fr")).toBe(false);
  });

  it("rend null quand la comparaison est impossible", () => {
    expect(emailCoherent("", "https://cabinet.fr")).toBeNull();
    expect(emailCoherent("a@cabinet.fr", "")).toBeNull();
  });
});

describe("dansZone", () => {
  const communes = ["Lyon", "Villeurbanne", "Ecully"];

  it("garde les départements de la zone", () => {
    expect(dansZone("69003", "LYON", communes)).toBe(true);
    expect(dansZone("38000", "GRENOBLE", communes)).toBe(true);
  });

  it("écarte les départements hors zone, cas réels de la base", () => {
    expect(dansZone("11000", "CARCASSONNE", communes)).toBe(false);
    expect(dansZone("75008", "PARIS", communes)).toBe(false);
    expect(dansZone("83600", "FREJUS", communes)).toBe(false);
  });

  it("se rabat sur la commune quand l'INSEE masque le code postal", () => {
    // Une entreprise non diffusible ne doit pas être écartée pour ça.
    expect(dansZone("[NON-DIFFUSIBLE]", "Lyon", communes)).toBe(true);
    expect(dansZone("", "Villeurbanne", communes)).toBe(true);
    expect(dansZone("[NON-DIFFUSIBLE]", "Bordeaux", communes)).toBe(false);
  });
});

describe("noterFiabilite", () => {
  const ctx = { communesZone: ["Lyon", "Villeurbanne"], mxCeo: true, mxEntreprise: true };

  it("note A une ligne complète et cohérente", () => {
    const f = noterFiabilite(ligne(), ctx);
    expect(f.note).toBe("A");
    expect(f.alertes).toEqual([]);
  });

  it("écarte en D un prospect hors zone, quoi qu'il ait par ailleurs", () => {
    const f = noterFiabilite(ligne({ code_postal: "11000", ville: "CARCASSONNE" }), ctx);
    expect(f.note).toBe("D");
    expect(f.alertes.some((a) => a.includes("hors zone"))).toBe(true);
  });

  it("sanctionne lourdement un domaine sans MX : l'email rebondirait", () => {
    const f = noterFiabilite(ligne(), { ...ctx, mxCeo: false });
    expect(f.alertes.some((a) => a.includes("ne reçoit pas de mail"))).toBe(true);
    expect(f.score).toBeLessThan(80);
  });

  it("signale l'absence de SIREN, qui rend l'identité incertaine", () => {
    const f = noterFiabilite(ligne({ siren: "" }), ctx);
    expect(f.alertes.some((a) => a.includes("SIREN"))).toBe(true);
  });

  it("cumule les défauts sans jamais sortir de 0..100", () => {
    const f = noterFiabilite(
      ligne({ code_postal: "75008", ville: "PARIS", siren: "", ceo_email: "", email_entreprise: "", tel_standard: "", ceo_nom: "" }),
      { communesZone: [], mxCeo: null, mxEntreprise: null },
    );
    expect(f.score).toBeGreaterThanOrEqual(0);
    expect(f.note).toBe("D");
  });
});

describe("parserCsv", () => {
  it("garde entier un champ qui contient un retour à la ligne", () => {
    // Le bug réel : découper sur \n transformait 102 lignes en 204.
    const csv = 'nom;notes\nCabinet;"ligne un\nligne deux"\nAutre;court\n';
    const l = parserCsv(csv);
    expect(l).toHaveLength(2);
    expect(l[0]!.notes).toBe("ligne un\nligne deux");
    expect(l[1]!.nom).toBe("Autre");
  });

  it("gère point-virgule et guillemets doublés dans un champ", () => {
    const l = parserCsv('nom;titre\n"Durand; Fils";"il dit ""oui"""\n');
    expect(l[0]!.nom).toBe("Durand; Fils");
    expect(l[0]!.titre).toBe('il dit "oui"');
  });
});
