import { BODY, HAIR, MONO, MUTED, PANEL, RED, labelStyle } from "../theme";

/**
 * 08 — Ce que le diagnostic complet ouvre.
 *
 * Refondue le 14/08/2026 (fusion des deux comparatifs), resserrée le
 * 15/08/2026 sur retour de Luigi : « trop long et trop bullshit ». Six
 * lignes courtes, et la ligne miroir a été retirée : la carte 5 vient de
 * MONTRER le miroir, promettre « chaque moteur » deux cartes plus loin
 * rejouait la même pièce.
 *
 * Honnêteté vérifiée ligne à ligne : l'aperçu lit bien 40 réponses de
 * ChatGPT et Gemini ; les quatre autres moteurs n'y répondent pas ; la
 * recherche web n'est activée qu'au diagnostic ; Gemini, ChatGPT,
 * Perplexity et Grok remontent leurs sources quand elle l'est.
 */
const LIGNES = [
  {
    label: "Réponses d'IA lues",
    apercu: "40",
    diagnostic: "144",
  },
  {
    label: "Claude, Perplexity, Grok, Le Chat",
    apercu: "non",
    diagnostic: "96 réponses",
  },
  {
    label: "Recherche web, comme chez vos clients",
    apercu: "non",
    diagnostic: "oui",
  },
  {
    label: "Les sites que les IA lisent avant de citer",
    apercu: "non",
    diagnostic: "la liste",
  },
  {
    label: "Votre note, moteur par moteur",
    apercu: "non",
    diagnostic: "6 notes",
  },
  {
    // La ligne la plus vendeuse du tableau, et la plus verrouillée : `rescan`
    // refuse de rejouer un aperçu, et rejoue à l'identique les questions
    // scellées d'un diagnostic. Le J+90 est la promesse du produit.
    label: "Rejouable à l'identique dans 90 jours",
    apercu: "non",
    diagnostic: "scellé",
  },
];

export function CarteDiagnostic({
  wide,
  part,
  score,
}: {
  wide: boolean;
  part: "recit" | "preuve";
  /** Le récit s'adapte : dire « vous n'êtes pas cité » à un 85/100 serait faux. */
  score: number;
}) {
  if (part === "preuve") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto auto",
            gap: "0 12px",
            alignItems: "baseline",
            paddingBottom: 8,
            borderBottom: `1px solid ${HAIR}`,
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: MUTED }}>
            CE QUE VOUS APPRENEZ
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: MUTED }}>
            APERÇU
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: "0.12em",
              color: RED,
              background: PANEL,
              padding: "4px 8px",
            }}
          >
            COMPLET
          </span>
        </div>
        {LIGNES.map((l) => (
          <div
            key={l.label}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto auto",
              gap: "0 12px",
              alignItems: "center",
              padding: "11px 0",
              borderBottom: `1px solid ${HAIR}`,
            }}
          >
            <span style={{ fontSize: wide ? 14.5 : 13.5, color: BODY, lineHeight: 1.35 }}>
              {l.label}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: wide ? 12.5 : 11.5,
                color: MUTED,
                minWidth: 58,
                textAlign: "right",
              }}
            >
              {l.apercu}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: wide ? 13 : 12,
                fontWeight: 700,
                color: RED,
                background: PANEL,
                alignSelf: "stretch",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                minWidth: 92,
                padding: "0 8px",
              }}
            >
              {l.diagnostic}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <span style={{ ...labelStyle, color: MUTED }}>LE SCAN COMPLET</span>

      {/* Resserré le 15/08/2026 : quatre paragraphes expliquaient, trois
          phrases suffisent. Le titre donne le manque concret (104 réponses),
          le gras donne le gain concret (la liste des sites), la dernière
          ligne donne les conditions. */}
      <p
        style={{
          fontSize: wide ? 30 : 23,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        Il reste 104 réponses à lire, et la cause de chaque absence.
      </p>

      <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Cet aperçu a interrogé 2 IA, sans Internet. Le scan complet interroge les 6, recherche web
        activée : ce que vos clients utilisent vraiment.
      </p>

      <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
        <strong style={{ fontWeight: 700 }}>
          Vous repartez avec la liste des sites que les IA lisent avant de citer un nom.
        </strong>{" "}
        C'est là qu'il faut apparaître{score < 50 ? ", et c'est là que tout se corrige" : ""}.
      </p>

      <p style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: MUTED, margin: 0 }}>
        Offert · lancé dès votre réservation · lu ensemble en 30 minutes
      </p>
    </>
  );
}
