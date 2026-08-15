import { describe, expect, it } from "vitest";
import { partDeVoix, regrouperMarques, type LigneMention } from "@/lib/score";

/**
 * Le VRAI code du site, importé, plus une copie.
 *
 * Ce fichier recopiait `regrouperMarques` et `partDeVoix` faute de pouvoir
 * résoudre l'alias « @/ » depuis le toolkit. Une copie ne teste rien : elle
 * vérifie qu'elle est d'accord avec elle-même, et elle diverge en silence dès
 * que l'original bouge. L'alias est désormais posé dans `vitest.config.ts`.
 */

/** Fabrique n mentions d'une marque, pour peser sur le choix du nom retenu. */
const fois = (brand: string, n: number, is_target = false): LigneMention[] =>
  Array.from({ length: n }, (_, i) => ({
    // Une réponse distincte par mention : ces tests pèsent des COMPTES de
    // citations (part de voix, regroupement), pas le score.
    response_id: `r-${brand}-${i}`,
    engine: "ChatGPT",
    brand,
    is_target,
    position: null,
    recommended: false,
    sentiment: "neutre",
  }));

describe("regrouperMarques", () => {
  it("réunit les six écritures d'Amarris, cas réel des données", () => {
    const alias = regrouperMarques([
      ...fois("Amarris", 12),
      ...fois("Amarris Direct", 5),
      ...fois("Amarris Contact", 3),
      ...fois("Amarris Contact Lyon", 2),
      ...fois("Amarris Groupe", 1),
      ...fois("Amarris Expertise Comptable", 1),
    ]);
    expect(Object.keys(alias)).toHaveLength(5);
    expect(new Set(Object.values(alias))).toEqual(new Set(["Amarris"]));
  });

  it("réunit « Exco » et « Exco Lyon »", () => {
    const alias = regrouperMarques([...fois("Exco", 39), ...fois("Exco Lyon", 9)]);
    expect(alias["Exco Lyon"]).toBe("Exco");
  });

  it("réunit deux orthographes sans espace : CER France et Cerfrance", () => {
    const alias = regrouperMarques([...fois("Cerfrance", 8), ...fois("CER France", 3)]);
    expect(alias["CER France"]).toBe("Cerfrance");
  });

  it("retient le nom le plus cité, pas le plus court", () => {
    // Si les moteurs disent surtout « Amarris Direct », c'est ce nom que le
    // client reconnaîtra dans son rapport.
    const alias = regrouperMarques([...fois("Amarris Direct", 20), ...fois("Amarris", 2)]);
    expect(alias["Amarris"]).toBe("Amarris Direct");
  });

  it("ne fusionne pas deux entreprises distinctes", () => {
    const alias = regrouperMarques([...fois("Fiducial", 10), ...fois("Fidal", 8), ...fois("KPMG", 5)]);
    expect(alias).toEqual({});
  });

  it("épargne les sigles courts, où une inclusion libre ferait n'importe quoi", () => {
    // « EY » ne doit pas avaler « EYbens Conseil » d'un autre groupe, ni
    // l'inverse : sous 4 caractères, on ne regroupe pas.
    const alias = regrouperMarques([...fois("EY", 10), ...fois("EYbens Conseil", 3), ...fois("BDO", 4)]);
    expect(alias).toEqual({});
  });

  it("ignore les libellés vides ou réduits à de la ponctuation", () => {
    expect(regrouperMarques([...fois("  ", 1), ...fois("-", 1), ...fois("Exco", 3)])).toEqual({});
  });
});

describe("partDeVoix", () => {
  /** Un secteur encombré : douze concurrents devant le client. */
  const secteurEncombre: LigneMention[] = [
    ...Array.from({ length: 12 }, (_, i) => fois(`Concurrent ${i}`, 20 - i)).flat(),
    ...fois("Petit Cabinet", 4, true),
  ];

  it("garde le client même quand douze concurrents le devancent", () => {
    // LE bug : le client tombait hors du top 10, `insights.ts` lisait ses
    // citations dans ce tableau et trouvait zéro. L'email annonçait alors
    // « absent sur les 20 questions » à une entreprise citée 4 fois. Vu pour
    // de vrai sur Compta Clementine (1 citation) et Cerfrance (3).
    const pdv = partDeVoix(secteurEncombre);
    const cible = pdv.find((p) => p.target);
    expect(cible).toBeDefined();
    expect(cible!.count).toBe(4);
  });

  it("compte la part du client sur le total réel, pas sur les lignes affichées", () => {
    const pdv = partDeVoix(secteurEncombre);
    const cible = pdv.find((p) => p.target)!;
    expect(cible.share).toBeCloseTo(4 / secteurEncombre.length, 10);
    expect(cible.share).toBeLessThan(0.05);
  });

  it("n'ajoute pas de onzième ligne quand le client est déjà dans le top 10", () => {
    const pdv = partDeVoix([...fois("Nous", 30, true), ...fois("Rival", 5)]);
    expect(pdv).toHaveLength(2);
    expect(pdv[0]!.target).toBe(true);
  });

  it("ne fabrique pas de ligne client quand la marque n'est jamais citée", () => {
    // Absence réelle : aucune ligne cible, sans quoi on afficherait un zéro là
    // où le rapport doit dire « jamais mentionné ».
    const pdv = partDeVoix(Array.from({ length: 15 }, (_, i) => fois(`Rival ${i}`, 1)).flat());
    expect(pdv.some((p) => p.target)).toBe(false);
    expect(pdv).toHaveLength(10);
  });

  it("regroupe les variantes avant de trancher le top 10", () => {
    const pdv = partDeVoix(
      [...fois("Amarris", 6), ...fois("Amarris Direct", 5), ...fois("Nous", 8, true)],
      { "Amarris Direct": "Amarris" },
    );
    expect(pdv[0]!.name).toBe("Amarris");
    expect(pdv[0]!.count).toBe(11);
    expect(pdv[0]!.variantes).toEqual(["Amarris Direct"]);
  });
});
