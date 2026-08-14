import { BODY, HAIR, INK, MONO, MUTED, RED, SERIF, labelStyle } from "../theme";

/**
 * La question miroir : ce qu'une IA répond quand on lui donne le nom.
 *
 * Ajoutée à la séquence le 14/08/2026 — la donnée existait depuis toujours
 * dans `scans.miroir` et dormait : le scan gratuit la paie, personne ne la
 * voyait. C'est la pièce la plus personnelle du rapport, celle qui se
 * transfère à un associé.
 *
 * Elle s'annonce elle-même comme l'EXCEPTION méthodologique : toutes les
 * autres questions taisent le nom de la marque pour mesurer la découverte
 * spontanée ; celle-ci le prononce exprès. Le dire est ce qui rend le reste
 * crédible — un dirigeant qui repère la contradiction tout seul doute de
 * toute la mesure.
 */
export function CarteMiroir({
  marque,
  moteur,
  texte,
  date,
  totalQuestions,
  wide,
  part,
}: {
  marque: string;
  moteur: string;
  texte: string;
  date: string;
  totalQuestions: number;
  wide: boolean;
  part: "recit" | "preuve";
}) {
  if (part === "preuve") {
    // 480 caractères : la réponse entière faisait déborder la carte de
    // l'écran, et l'essentiel d'une fiche d'identité se joue dans ses
    // premières lignes. La coupe est visible (…) ET nommée dans le pied :
    // « mot pour mot » sous un texte tronqué se lirait comme un mensonge.
    const coupe = texte.length > 480;
    const extrait = coupe ? `${texte.slice(0, 460).trimEnd()}…` : texte;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: MUTED }}>
          QUESTION POSÉE À {moteur.toUpperCase()} LE {date.toUpperCase()}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: wide ? 17 : 15.5,
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: "-0.015em",
          }}
        >
          « Que peux-tu me dire de {marque} ? Est-ce une entreprise que tu recommanderais ? »
        </p>
        <div style={{ borderLeft: `2px solid ${RED}`, paddingLeft: wide ? 16 : 12 }}>
          <p
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: wide ? 17 : 15.5,
              lineHeight: 1.55,
              color: INK,
              whiteSpace: "pre-line",
            }}
          >
            {extrait}
          </p>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: 1.5,
            color: MUTED,
            borderTop: `1px solid ${HAIR}`,
            paddingTop: 10,
          }}
        >
          {moteur} · {date} ·{" "}
          {coupe ? "début de la réponse, conservée en entier" : "réponse conservée mot pour mot"}
        </span>
      </div>
    );
  }

  return (
    <>
      <span style={{ ...labelStyle, color: RED }}>LA RÉPONSE À VOTRE NOM</span>

      <p
        style={{
          fontSize: wide ? 32 : 25,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        On a demandé à une IA qui vous êtes. Voilà sa réponse.
      </p>

      {/* Réécrit le 15/08/2026 : l'ancien paragraphe (« Ce texte ne s'affiche
          nulle part et vous ne pouvez pas le corriger… ») était l'exemple
          type, cité par Luigi, du copywriting trop compliqué. Deux phrases,
          un fait, une invitation. */}
      <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Un prospect qui tape votre nom dans une IA obtient ce texte.{" "}
        <strong style={{ color: INK, fontWeight: 800 }}>Lisez-le comme il le lira.</strong>
      </p>

      <p style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: MUTED, margin: 0 }}>
        C'est la seule question du scan qui prononce votre nom. Les {totalQuestions} autres
        mesurent si les IA vous citent d'elles-mêmes.
      </p>
    </>
  );
}
