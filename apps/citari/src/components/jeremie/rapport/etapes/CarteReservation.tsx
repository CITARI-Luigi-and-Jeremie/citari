import { BODY, HAIR, INK, MONO, MUTED, PANEL, labelStyle } from "../theme";

/**
 * 06 — La réservation. Cadre de l'appel à droite, engagement à gauche.
 * Le coût d'API annoncé est le nôtre : environ 1 € par diagnostic complet,
 * pas le chiffre d'ambiance de la maquette.
 */
export function CarteReservation({ wide, part }: { wide: boolean; part: "recit" | "preuve" }) {
  if (part === "preuve") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div
          style={{
            border: `1px solid ${HAIR}`,
            padding: wide ? "14px 16px" : "12px 14px",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: INK }}>
            30 MINUTES · EN VISIO · 0 €
          </span>
        </div>
        <p
          style={{
            fontSize: 12.5,
            color: MUTED,
            lineHeight: 1.5,
            margin: "14px 0 0",
            fontFamily: MONO,
          }}
        >
          {/* « Nous en tenons 3 par semaine » a été coupé le 14/08/2026 : aucun
              compteur n'enregistre cette rareté, c'était la seule affirmation
              invérifiable du parcours. La doctrine interdit le faux compteur, y
              compris quand il sert à faire réserver. */}
          Pourquoi c'est gratuit : ce diagnostic nous coûte environ 1 € en appels d'API. C'est le
          prix que nous acceptons de payer pour 30 minutes de votre attention.
        </p>
      </div>
    );
  }

  return (
    <>
      <span style={labelStyle}>RÉSERVER LE DIAGNOSTIC</span>

      <p
        style={{
          fontSize: wide ? 30 : 23,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        Si votre score est bon, on vous le dit et on ne vous vend rien.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: PANEL,
          padding: wide ? "14px 16px" : "12px 14px",
        }}
      >
        <p style={{ fontSize: wide ? 16 : 15, color: BODY, lineHeight: 1.55, margin: 0 }}>
          <strong style={{ color: INK }}>L'épreuve du direct.</strong> On vous propose de rejouer
          une question devant vous, en visio. Vous choisissez laquelle. Rien n'est précuit.
        </p>
        <p style={{ fontSize: wide ? 16 : 15, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Vous repartez avec vos chiffres et les corrections à faire, que vous travailliez avec
          nous ou pas.
        </p>
      </div>
    </>
  );
}
