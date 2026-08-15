import { BODY, HAIR, INK, MONO, MUTED, RED, labelStyle } from "../theme";

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
          {/* Le montant a été retiré le 14/08/2026 : annoncer « environ 1 € »
              dévalorisait ce qu'on offre. Le VOLUME technique dit la même
              vérité et pèse davantage. Le compte est exact et vérifiable dans
              l'orchestrateur : 144 interrogations de moteurs, 144 analyses
              (une par réponse, ligne 650), 6 questions miroir, plus la
              génération de l'échantillon, le classement des concurrents et
              les actions. Environ 300.
              (« Nous en tenons 3 par semaine » avait été coupé plus tôt le
              même jour : aucun compteur n'enregistrait cette rareté.) */}
          Pourquoi c'est offert : la mesure complète déclenche près de 300 appels payants chez six
          éditeurs d'IA et neuf minutes de calcul. Nous le prenons à notre charge, parce qu'il n'y
          a pas de conversation utile sans mesure.
        </p>
      </div>
    );
  }

  return (
    <>
      <span style={labelStyle}>RÉSERVER LE SCAN PREMIUM</span>

      {/* Titre ramené sur deux lignes le 14/08/2026 : en trois lignes de 30px
          il écrasait la carte, qui portait en plus un bloc gris de deux
          paragraphes. « L'épreuve du direct » (rejouer une question en visio)
          a été retirée avec lui : vraie, mais c'est un détail de déroulé, et
          il chargeait l'écran où il faut décider. */}
      <p
        style={{
          fontSize: wide ? 30 : 23,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        La mesure complète part dès que vous réservez.
      </p>

      <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Ce n'est pas un appel de découverte : les 144 réponses sont déjà collectées quand nous nous
        parlons, et l'appel sert à les ouvrir ensemble.
      </p>

      <p style={{ fontSize: wide ? 17 : 15.5, color: INK, lineHeight: 1.55, margin: 0, fontWeight: 700 }}>
        Vous repartez avec le rapport complet et le plan, que vous travailliez avec nous ou non.
      </p>

      <p style={{ fontSize: wide ? 15 : 14.5, color: BODY, lineHeight: 1.5, margin: 0 }}>
        Si votre visibilité est déjà bonne, nous vous le disons : nous n'avons rien à vendre à une
        entreprise que les IA citent déjà.
      </p>
    </>
  );
}
