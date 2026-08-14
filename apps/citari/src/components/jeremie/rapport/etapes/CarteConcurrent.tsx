import { BODY, HAIR, INK, MONO, RED, labelStyle } from "../theme";

/**
 * 02 — Le concurrent qui occupe votre place.
 *
 * Sa maquette titrait « Ledgio est nommé deux fois plus souvent que vous » en
 * dur : le titre est désormais calculé depuis les données réelles, et le
 * multiple n'est annoncé que quand il est vrai.
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
  const multiple = vosReponses > 0 ? adversaire.reponses / vosReponses : Infinity;

  const titre =
    vosReponses === 0
      ? `${adversaire.nom} est nommé. Vous, jamais.`
      : multiple >= 2
        ? `${adversaire.nom} est nommé ${Math.floor(multiple) === 2 ? "deux" : Math.floor(multiple) === 3 ? "trois" : Math.floor(multiple)} fois plus souvent que vous.`
        : `${adversaire.nom} est nommé plus souvent que vous.`;

  if (part === "recit") {
    return (
      <>
        <span style={{ ...labelStyle, color: RED }}>QUI PREND VOTRE PLACE</span>
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
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Sur les {adversaire.total} réponses que nous venons de lire, son nom sort dans{" "}
          {adversaire.reponses}. Le vôtre, dans {vosReponses}. Vous n'avez pas perdu une
          comparaison, vous n'y étiez pas.{" "}
          <strong style={{ color: INK, fontWeight: 800 }}>
            L'écart ne vient pas de votre offre, il vient de ce que les IA trouvent à lire sur vous.
          </strong>
        </p>
      </>
    );
  }

  const lignes = [
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
