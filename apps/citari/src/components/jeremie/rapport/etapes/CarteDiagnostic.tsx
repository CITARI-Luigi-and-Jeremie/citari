import { BODY, HAIR, MONO, MUTED, PANEL, RED, labelStyle } from "../theme";

/**
 * 05 — Ce que le diagnostic complet ouvre.
 *
 * Refondue le 14/08/2026 : la séquence portait DEUX comparatifs (le tableau
 * chiffré de cette carte, puis une modale « ce que vous apprenez » qui
 * redisait la même chose autrement). La modale est supprimée ; SON tableau,
 * le plus persuasif des deux, vit ici, et chaque ligne est un APPRENTISSAGE
 * plutôt qu'un paramètre technique. La réassurance de la modale (« si votre
 * score est bon, on ne vous vend rien ») rejoint le récit.
 *
 * Honnêteté vérifiée ligne à ligne : l'aperçu lit bien 40 réponses de
 * ChatGPT et Gemini ; les quatre autres moteurs n'y répondent pas ; la
 * recherche web n'est activée qu'au diagnostic ; le miroir d'aperçu tourne
 * sur un seul moteur ; l'audit flash vérifie déjà les robots (ne jamais
 * prétendre l'inverse).
 */
const LIGNES = [
  {
    label: "Réponses d'IA lues, toutes lisibles mot pour mot",
    apercu: "40",
    diagnostic: "144",
  },
  {
    label: "Ce que répondent Claude, Perplexity, Grok et Le Chat",
    apercu: "fermés",
    diagnostic: "96 réponses",
  },
  {
    label: "Recherche web activée, comme chez vos clients",
    apercu: "non",
    diagnostic: "oui",
  },
  {
    label: "Où les IA vont chercher avant de prononcer un nom",
    apercu: "non",
    diagnostic: "la liste",
  },
  {
    label: "Ce qu'une IA récite sur vous quand on lui donne votre nom",
    apercu: "1 moteur",
    diagnostic: "chaque moteur",
  },
  {
    label: "Votre note, moteur par moteur",
    apercu: "non",
    diagnostic: "une par moteur",
  },
  {
    // La ligne la plus vendeuse du tableau, et la plus verrouillée : `rescan`
    // refuse de rejouer un aperçu, et rejoue à l'identique les questions
    // scellées d'un diagnostic. Le J+90 est la promesse du produit.
    label: "Un point de départ rejouable à l'identique dans 90 jours",
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
            DIAGNOSTIC
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
        {score < 50
          ? "Vous savez maintenant que vous n'êtes pas cité. Pas encore pourquoi."
          : "Vous savez maintenant où vous êtes cité. Pas encore pourquoi, ni comment tenir la place."}
      </p>

      <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Tout ce que vous venez de lire vient de deux moteurs qui ont répondu{" "}
        <strong style={{ fontWeight: 700 }}>de mémoire</strong>, sans aller sur le web. Le
        diagnostic rejoue la mesure sur les six, recherche web activée, et remonte les sites
        exacts que les IA ouvrent avant de prononcer un nom.
      </p>

      <p style={{ fontSize: wide ? 16 : 15, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Il est offert.{" "}
        <strong style={{ fontWeight: 700 }}>Nous le lançons dès votre réservation</strong> : les
        144 réponses sont collectées avant l'appel, et nous les lisons ensemble en visio, 30
        minutes.
      </p>

      <p style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: MUTED, margin: 0 }}>
        Ni carte bancaire, ni engagement. Un créneau et votre email suffisent.
      </p>
    </>
  );
}
