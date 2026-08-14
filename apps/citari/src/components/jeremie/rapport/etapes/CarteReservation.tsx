import { BODY, HAIR, INK, MONO, MUTED, PANEL, RED, labelStyle } from "../theme";

/**
 * La dernière carte : la réservation.
 *
 * Réécrite le 14/08/2026. Elle titrait « Si votre score est bon, on vous le
 * dit et on ne vous vend rien » : une phrase de renoncement, magnifique en
 * réassurance et catastrophique en TITRE de l'écran où le prospect doit
 * cliquer — elle vend le cas où il ne se passe rien. Elle décrit maintenant
 * ce qui se passe VRAIMENT : la mesure complète est lancée dès la
 * réservation, elle tourne avant l'appel, et l'appel sert à l'ouvrir
 * ensemble. Le renoncement reste, à sa place : en bas, en réassurance.
 *
 * Chaque élément du déroulé correspond à ce que le produit fait réellement
 * (24 questions × 6 moteurs, recherche web activée, sources collectées,
 * miroir sur chaque moteur, actions classées) : c'est le contenu du rapport
 * complet, pas une promesse d'agence.
 */

const DEROULE = [
  {
    quand: "AVANT L'APPEL",
    quoi: "La mesure complète tourne : 24 questions, six moteurs, 144 réponses, recherche web activée.",
  },
  {
    quand: "PENDANT",
    quoi: "On ouvre le rapport ensemble : votre note par moteur, les sites où vos concurrents sont trouvés, la cause de chaque absence.",
  },
  {
    quand: "À LA FIN",
    quoi: "Vos actions, classées de la plus prioritaire à la moins urgente, et celles que vous pouvez faire sans nous.",
  },
];

export function CarteReservation({ wide, part }: { wide: boolean; part: "recit" | "preuve" }) {
  if (part === "preuve") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div
          style={{
            border: `1px solid ${HAIR}`,
            padding: wide ? "14px 16px" : "12px 14px",
            marginBottom: 16,
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: INK }}>
            30 MINUTES · EN VISIO · 0 €
          </span>
        </div>

        {DEROULE.map((etape, i) => (
          <div
            key={etape.quand}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "12px 0",
              borderTop: i === 0 ? `1px solid ${HAIR}` : undefined,
              borderBottom: `1px solid ${HAIR}`,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.14em",
                color: i === 0 ? RED : MUTED,
              }}
            >
              {etape.quand}
            </span>
            <span style={{ fontSize: wide ? 14.5 : 13.5, lineHeight: 1.45, color: BODY }}>
              {etape.quoi}
            </span>
          </div>
        ))}

        <p
          style={{
            fontSize: 11.5,
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
          Pourquoi c'est offert : ce diagnostic nous coûte environ 1 € en appels d'API. C'est le
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
        Réservez, et la mesure complète part aussitôt. Nous la lisons ensemble.
      </p>

      <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Ce n'est pas un appel de découverte : les 144 réponses sont déjà collectées quand nous nous
        parlons.{" "}
        <strong style={{ color: INK, fontWeight: 800 }}>
          Vous repartez avec le rapport complet et le plan, que vous travailliez avec nous ou non.
        </strong>
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
          <strong style={{ color: INK }}>L'épreuve du direct.</strong> Vous choisissez une question
          et nous la reposons devant vous, en visio. Rien n'est précuit, et vous voyez la mesure se
          faire.
        </p>
        <p style={{ fontSize: wide ? 16 : 15, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Et si votre visibilité est déjà bonne, nous vous le disons : nous n'avons rien à vendre à
          une entreprise que les IA citent déjà.
        </p>
      </div>
    </>
  );
}
