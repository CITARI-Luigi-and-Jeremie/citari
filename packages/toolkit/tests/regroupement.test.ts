import { describe, expect, it } from "vitest";

/**
 * Copie de `regrouperMarques` (apps/citari/src/lib/score.ts).
 *
 * Le site n'est pas importable depuis le toolkit (alias « @/ » non résolu),
 * mais cette règle décide de ce qu'on facture à un client : elle doit être
 * couverte. Toute modification là-bas doit être reportée ici.
 */
function regrouperMarques(mentions: { brand: string }[]): Record<string, string> {
  const compte = new Map<string, number>();
  for (const m of mentions) {
    const nom = m.brand.trim();
    if (nom) compte.set(nom, (compte.get(nom) ?? 0) + 1);
  }
  const compact = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const noms = [...compte.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).map(([n]) => n);
  const alias: Record<string, string> = {};
  const retenus: { nom: string; cle: string }[] = [];
  for (const nom of noms) {
    const cle = compact(nom);
    if (cle.length < 2) continue;
    const parent = retenus.find(
      (r) => r.cle === cle || (r.cle.length >= 4 && cle.startsWith(r.cle)) || (cle.length >= 4 && r.cle.startsWith(cle))
    );
    if (parent) alias[nom] = parent.nom;
    else retenus.push({ nom, cle });
  }
  return alias;
}

/** Fabrique n mentions d'une marque, pour peser sur le choix du nom retenu. */
const fois = (brand: string, n: number) => Array.from({ length: n }, () => ({ brand }));

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
    // « EY » ne doit pas avaler « EY Consulting » d'un autre groupe, ni
    // l'inverse : sous 4 caractères, on ne regroupe pas.
    const alias = regrouperMarques([...fois("EY", 10), ...fois("EYbens Conseil", 3), ...fois("BDO", 4)]);
    expect(alias).toEqual({});
  });

  it("ignore les libellés vides ou réduits à de la ponctuation", () => {
    expect(regrouperMarques([{ brand: "  " }, { brand: "-" }, ...fois("Exco", 3)])).toEqual({});
  });
});
