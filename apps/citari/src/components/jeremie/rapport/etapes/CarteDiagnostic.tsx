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
    label: "Réponses d'IA réellement lues",
    apercu: "40",
    diagnostic: "144",
  },
  {
    label: "Ce que répondent Claude, Perplexity, Grok et Le Chat",
    apercu: "aucune",
    diagnostic: "96 réponses",
  },
  {
    label: "Recherche web activée, comme chez vos clients",
    apercu: "non",
    diagnostic: "oui",
  },
  {
    label: "Les sites exacts où les IA puisent leurs recommandations",
    apercu: "non",
    diagnostic: "oui",
  },
  {
    label: "Ce qu'une IA raconte quand on lui donne votre nom",
    apercu: "1 moteur",
    diagnostic: "6 moteurs",
  },
  {
    label: "La cause de chaque absence, et qui peut la corriger — vous ou un développeur",
    apercu: "non",
    diagnostic: "oui",
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
        Le diagnostic rejoue la mesure en entier : les quatre moteurs que l'aperçu n'a pas
        ouverts, la recherche web activée, les sites exacts où vos concurrents sont trouvés, et ce
        que chaque moteur raconte de vous quand on lui donne votre nom.
      </p>

      <p style={{ fontSize: wide ? 16 : 15, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Il se lit ensemble, en visio, 30 minutes. C'est gratuit et sans engagement :{" "}
        <strong style={{ fontWeight: 700 }}>
          si votre score est bon, on vous le dit et on ne vous vend rien.
        </strong>
      </p>
    </>
  );
}
