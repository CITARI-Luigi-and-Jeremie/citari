import { BODY, HAIR, MONO, MUTED, RED, labelStyle } from "../theme";

/**
 * 05 — Ce que le diagnostic complet ouvre. Cadrage à gauche, écart
 * aperçu / complet à droite.
 *
 * Une ligne corrigée par rapport à sa maquette : l'aperçu VÉRIFIE déjà les
 * quatre robots d'IA (l'audit flash tourne pendant le scan gratuit). La ligne
 * vendable et vraie, ce sont les sources : la recherche web des moteurs n'est
 * activée qu'au diagnostic.
 */
const COMPARAISON = [
  { label: "Moteurs interrogés", apercu: "2", complet: "6" },
  { label: "Questions posées", apercu: "20", complet: "24" },
  { label: "Réponses réelles", apercu: "40", complet: "144" },
  { label: "Sources consultées par les moteurs", apercu: "non", complet: "oui" },
];

export function CarteDiagnostic({ wide, part }: { wide: boolean; part: "recit" | "preuve" }) {
  if (part === "preuve") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto auto",
            gap: "0 14px",
            alignItems: "baseline",
            paddingBottom: 8,
            borderBottom: `1px solid ${HAIR}`,
          }}
        >
          <span />
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: MUTED }}>
            APERÇU
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: RED }}>
            COMPLET
          </span>
        </div>
        {COMPARAISON.map((l) => (
          <div
            key={l.label}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto auto",
              gap: "0 14px",
              alignItems: "baseline",
              padding: "12px 0",
              borderBottom: `1px solid ${HAIR}`,
            }}
          >
            <span style={{ fontSize: wide ? 15 : 14, color: BODY }}>{l.label}</span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: wide ? 22 : 19,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: MUTED,
                minWidth: 42,
                textAlign: "right",
              }}
            >
              {l.apercu}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: wide ? 28 : 23,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: RED,
                minWidth: 52,
                textAlign: "right",
              }}
            >
              {l.complet}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Sa maquette numérotait ici les étapes commerciales (scan = 01,
          diagnostic = 02) : à côté du « 05 / 06 » de la carte, ça lisait
          comme une erreur de compteur. On garde le seul mot utile. */}
      <span style={{ ...labelStyle, color: MUTED }}>LE DIAGNOSTIC COMPLET</span>

      <p
        style={{
          fontSize: wide ? 30 : 23,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        Vous savez maintenant que vous n'êtes pas cité. Pas encore pourquoi.
      </p>

      <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
        On regarde ce que répondent les quatre moteurs que l'aperçu n'a pas ouverts, sur quels
        sites vos concurrents ont été trouvés, et ce que chaque moteur raconte de vous quand on lui
        donne votre nom.
      </p>

      <p style={{ fontSize: wide ? 16 : 15, color: BODY, lineHeight: 1.55, margin: 0 }}>
        24 questions, 6 moteurs, 144 réponses. On les ouvre ensemble, en visio.
      </p>
    </>
  );
}
