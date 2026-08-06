import { describe, expect, it } from "vitest";
import {
  angleCommercial,
  avisSchema,
  cadence,
  datesDuFlux,
  datesDuSitemap,
  faqBalisee,
  materiauGeo,
  type SignauxGeo,
} from "../src/lib/signaux-geo.js";

/**
 * Ces signaux décident de la PHRASE qu'on adresse au prospect. Se tromper de
 * catégorie, c'est ouvrir sur « vous ne publiez rien » à quelqu'un qui publie
 * chaque semaine : la conversation est finie avant d'avoir commencé.
 */

const LE_JOUR = new Date("2026-08-07");
const s = (sur: Partial<SignauxGeo> = {}): SignauxGeo => ({
  pagesTotal: 40, dernierContenu: "2026-07-01", contenus12Mois: 8, contenusTotal: 25,
  avisNote: null, avisNombre: null, faqBalisee: false, llmsTxt: false, ...sur,
});

describe("cadence", () => {
  it("distingue un site vivant d'un site qui ralentit", () => {
    expect(cadence(s({ dernierContenu: "2026-07-15", contenus12Mois: 10 }), LE_JOUR)).toBe("actif");
    expect(cadence(s({ dernierContenu: "2026-07-15", contenus12Mois: 1 }), LE_JOUR)).toBe("ralenti");
  });

  it("sépare l'endormi de l'abandonné : ce ne sont pas les mêmes conversations", () => {
    expect(cadence(s({ dernierContenu: "2024-06-01" }), LE_JOUR)).toBe("endormi");
    expect(cadence(s({ dernierContenu: "2021-03-01" }), LE_JOUR)).toBe("abandonne");
  });

  it("rend « aucun » sans date lisible, plutôt que de deviner", () => {
    expect(cadence(s({ dernierContenu: null, contenusTotal: 0 }), LE_JOUR)).toBe("aucun");
    expect(cadence(s({ dernierContenu: "pas une date" }), LE_JOUR)).toBe("aucun");
  });
});

describe("angleCommercial", () => {
  it("met en tête celui qui a publié puis s'est arrêté", () => {
    // Le meilleur prospect : il a déjà payé pour croire au contenu.
    const a = angleCommercial(s({ dernierContenu: "2022-05-01", contenusTotal: 15, contenus12Mois: 0 }), LE_JOUR);
    expect(a.priorite).toBe(1);
    expect(a.angle).toContain("15 contenus");
    expect(a.angle).toContain("2022");
  });

  it("ne dit jamais à celui qui publie qu'il ne publie pas", () => {
    const a = angleCommercial(s({ dernierContenu: "2026-08-01", contenus12Mois: 12 }), LE_JOUR);
    expect(a.angle).toContain("publie déjà");
    expect(a.angle).not.toContain("rien à citer");
  });

  it("bascule sur les avis quand il n'y a aucun contenu mais du public", () => {
    const a = angleCommercial(s({ dernierContenu: null, contenusTotal: 0, contenus12Mois: 0, avisNombre: 140 }), LE_JOUR);
    expect(a.angle).toContain("140 avis");
  });

  it("n'avance que des chiffres réellement lus", () => {
    const a = angleCommercial(s({ dernierContenu: null, contenusTotal: 0, contenus12Mois: 0 }), LE_JOUR);
    expect(a.angle).toContain("aucun contenu");
    expect(a.angle).not.toMatch(/\d+ contenus/);
  });
});

describe("materiauGeo", () => {
  it("note haut un site fourni et vivant", () => {
    expect(materiauGeo(s({ pagesTotal: 200, contenusTotal: 60, faqBalisee: true, avisNombre: 90, llmsTxt: true }), LE_JOUR))
      .toBeGreaterThan(85);
  });

  it("note bas une vitrine de cinq pages sans rien", () => {
    expect(materiauGeo(s({ pagesTotal: 4, dernierContenu: null, contenus12Mois: 0, contenusTotal: 0 }), LE_JOUR))
      .toBeLessThan(15);
  });

  it("reste borné à 0..100", () => {
    const max = materiauGeo(s({ pagesTotal: 5000, contenusTotal: 900, faqBalisee: true, avisNombre: 9000, llmsTxt: true }), LE_JOUR);
    expect(max).toBeLessThanOrEqual(100);
    expect(materiauGeo(s({ pagesTotal: 0, dernierContenu: null, contenus12Mois: 0, contenusTotal: 0 }), LE_JOUR)).toBeGreaterThanOrEqual(0);
  });
});

describe("lecture des formats publiés", () => {
  it("lit les dates d'un plan de site, du plus récent au plus ancien", () => {
    const xml = `<url><loc>/a</loc><lastmod>2024-01-05</lastmod></url>
                 <url><loc>/b</loc><lastmod>2026-07-30T10:00:00+02:00</lastmod></url>`;
    expect(datesDuSitemap(xml)[0]).toBe("2026-07-30");
  });

  it("lit un flux RSS comme un flux Atom", () => {
    expect(datesDuFlux("<pubDate>Wed, 30 Jul 2026 08:00:00 +0000</pubDate>")[0]).toBe("2026-07-30");
    expect(datesDuFlux("<updated>2026-06-15T09:00:00Z</updated>")[0]).toBe("2026-06-15");
  });

  it("lit les avis que le site balise, et écarte les valeurs de gabarit", () => {
    expect(avisSchema('"ratingValue": "4.8", "reviewCount": "127"')).toEqual({ note: 4.8, nombre: 127 });
    // Un thème livre parfois une note de 9/5 ou un compte à zéro.
    expect(avisSchema('"ratingValue":"9","reviewCount":"0"')).toEqual({ note: null, nombre: null });
    expect(avisSchema("aucun balisage")).toEqual({ note: null, nombre: null });
  });

  it("repère une FAQ balisée", () => {
    expect(faqBalisee('{"@type":"FAQPage"}')).toBe(true);
    expect(faqBalisee('{"@type":"Article"}')).toBe(false);
  });
});
