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

/**
 * Copie de `partDeVoix` (apps/citari/src/lib/score.ts), même convention que
 * `regrouperMarques` ci-dessus : le site n'est pas importable d'ici, mais la
 * règle décide de ce qu'on affirme à un prospect. Toute modification là-bas
 * doit être reportée ici.
 */
function partDeVoix(
  mentions: { brand: string; is_target: boolean }[],
  alias: Record<string, string> = {},
) {
  const compte = new Map<string, { count: number; target: boolean }>();
  for (const m of mentions) {
    const brut = m.brand.trim();
    if (!brut) continue;
    const clef = alias[brut] ?? brut;
    const prev = compte.get(clef) ?? { count: 0, target: m.is_target };
    compte.set(clef, { count: prev.count + 1, target: prev.target || m.is_target });
  }
  const total = [...compte.values()].reduce((a, b) => a + b.count, 0) || 1;
  const toutes = [...compte.entries()]
    .map(([name, v]) => ({ name, count: v.count, share: v.count / total, target: v.target }))
    .sort((a, b) => b.count - a.count);
  const dix = toutes.slice(0, 10);
  if (!dix.some((p) => p.target)) {
    const cible = toutes.find((p) => p.target);
    if (cible) dix.push(cible);
  }
  return dix;
}

describe("partDeVoix", () => {
  /** Un secteur encombré : douze concurrents devant le client. */
  const secteurEncombre = [
    ...Array.from({ length: 12 }, (_, i) => ({ brand: `Concurrent ${i}`, is_target: false }))
      .flatMap((c, i) => Array.from({ length: 20 - i }, () => c)),
    ...Array.from({ length: 4 }, () => ({ brand: "Petit Cabinet", is_target: true })),
  ];

  it("garde le client même quand douze concurrents le devancent", () => {
    // LE bug : le client tombait hors du top 10, `insights.ts` lisait ses
    // citations dans ce tableau et trouvait zéro. L'email annonçait alors
    // « absent sur les 20 questions » à une entreprise citée 4 fois.
    const pdv = partDeVoix(secteurEncombre);
    const cible = pdv.find((p) => p.target);
    expect(cible).toBeDefined();
    expect(cible!.count).toBe(4);
  });

  it("compte la part du client sur le total réel, pas sur les lignes affichées", () => {
    const pdv = partDeVoix(secteurEncombre);
    const cible = pdv.find((p) => p.target)!;
    const totalReel = secteurEncombre.length;
    expect(cible.share).toBeCloseTo(4 / totalReel, 10);
    expect(cible.share).toBeLessThan(0.05);
  });

  it("n'ajoute pas de onzième ligne quand le client est déjà dans le top 10", () => {
    const pdv = partDeVoix([
      ...Array.from({ length: 30 }, () => ({ brand: "Nous", is_target: true })),
      ...Array.from({ length: 5 }, () => ({ brand: "Rival", is_target: false })),
    ]);
    expect(pdv).toHaveLength(2);
    expect(pdv[0]!.target).toBe(true);
  });

  it("ne fabrique pas de ligne client quand la marque n'est jamais citée", () => {
    // Absence réelle : il ne doit y avoir aucune ligne cible, sans quoi on
    // afficherait un zéro là où le rapport doit dire « jamais mentionné ».
    const pdv = partDeVoix(Array.from({ length: 15 }, (_, i) => ({ brand: `Rival ${i}`, is_target: false })));
    expect(pdv.some((p) => p.target)).toBe(false);
    expect(pdv).toHaveLength(10);
  });

  it("regroupe les variantes avant de trancher le top 10", () => {
    const pdv = partDeVoix(
      [
        ...Array.from({ length: 6 }, () => ({ brand: "Amarris", is_target: false })),
        ...Array.from({ length: 5 }, () => ({ brand: "Amarris Direct", is_target: false })),
        ...Array.from({ length: 8 }, () => ({ brand: "Nous", is_target: true })),
      ],
      { "Amarris Direct": "Amarris" },
    );
    expect(pdv[0]!.name).toBe("Amarris");
    expect(pdv[0]!.count).toBe(11);
  });
});
