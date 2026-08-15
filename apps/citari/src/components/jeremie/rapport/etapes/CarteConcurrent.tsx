import { carteConcurrent } from "@/lib/rapport-sequence";

import { BODY, HAIR, INK, MONO, RED, labelStyle } from "../theme";

/**
 * 02 — Le rapport de forces avec le concurrent le plus présent.
 *
 * Le titre, l'accroche et le récit viennent de `carteConcurrent` (fonction
 * pure, testée) : trois régimes selon que la marque est derrière, à égalité
 * ou devant. La première version n'avait pas de branche « vous menez » et
 * mentait au-dessus de ses propres barres.
 */
export function CarteConcurrent({
  adversaire,
  vosReponses,
  wide,
  part,
}: {
  adversaire: { nom: string; reponses: number; total: number };
  vosReponses: number;
  wide: boolean;
  part: "recit" | "preuve";
}) {
  const max = Math.max(adversaire.reponses, vosReponses, 1);
  const { kicker, titre, regime } = carteConcurrent(
    adversaire.nom,
    adversaire.reponses,
    vosReponses,
  );

  if (part === "recit") {
    return (
      <>
        <span style={{ ...labelStyle, color: RED }}>{kicker}</span>
        <p
          style={{
            fontSize: wide ? 34 : 26,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          {titre}
        </p>
        {regime === "jamais" || regime === "derriere" ? (
          <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
            Sur les {adversaire.total} réponses que nous venons de lire, son nom sort dans{" "}
            {adversaire.reponses}. Le vôtre, dans {vosReponses}. Vous n'avez pas perdu une
            comparaison, vous n'y étiez pas.{" "}
            <strong style={{ color: INK, fontWeight: 800 }}>
              L'écart ne vient pas de votre offre, il vient de ce que les IA trouvent à lire sur
              vous.
            </strong>
          </p>
        ) : regime === "egal" ? (
          <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
            Sur les {adversaire.total} réponses que nous venons de lire, son nom sort autant que le
            vôtre : {vosReponses} fois chacun.{" "}
            <strong style={{ color: INK, fontWeight: 800 }}>
              La place se rejoue à chaque réponse — et ce qui le fait monter est lisible, donc
              copiable.
            </strong>
          </p>
        ) : (
          <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
            Sur les {adversaire.total} réponses que nous venons de lire, votre nom sort dans{" "}
            {vosReponses}. Le sien, dans {adversaire.reponses}.{" "}
            <strong style={{ color: INK, fontWeight: 800 }}>
              Une place de leader ne se perd pas d'un coup : elle s'érode réponse par réponse.
            </strong>{" "}
            Le scan premium montre sur quelles questions il gagne du terrain, et pourquoi.
          </p>
        )}
      </>
    );
  }

  const lignes =
    regime === "devant" || regime === "egal"
      ? [
          { nom: "Vous", valeur: vosReponses, cible: true },
          { nom: adversaire.nom, valeur: adversaire.reponses, cible: false },
        ]
      : [
          { nom: adversaire.nom, valeur: adversaire.reponses, cible: false },
          { nom: "Vous", valeur: vosReponses, cible: true },
        ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {lignes.map((l) => (
        <div key={l.nom} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.12em",
                color: l.cible ? RED : INK,
              }}
            >
              {l.nom.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: wide ? 34 : 27,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: l.cible ? RED : INK,
                lineHeight: 1,
              }}
            >
              {l.valeur}
            </span>
          </div>
          <div style={{ height: 8, background: HAIR, borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: 8,
                width: `${(l.valeur / max) * 100}%`,
                background: l.cible ? RED : INK,
              }}
            />
          </div>
        </div>
      ))}
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: BODY }}>
        SUR {adversaire.total} RÉPONSES LUES
      </span>
    </div>
  );
}
