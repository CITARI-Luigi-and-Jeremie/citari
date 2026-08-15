import { BODY, HAIR, INK, MONO, MUTED, PANEL, RED, labelStyle } from "../theme";

/**
 * L'audit flash : les robots d'IA peuvent-ils seulement lire le site ?
 *
 * Ajoutée à la séquence le 14/08/2026. L'audit tourne pendant le scan
 * GRATUIT depuis toujours et son résultat dormait dans `scans.audit`. C'est
 * la seule pièce du rapport que le prospect peut vérifier lui-même en trente
 * secondes (son robots.txt est public), et quand un robot est bloqué, c'est
 * la cause la plus brutale et la plus réparable de son absence.
 *
 * Deux récits, jamais un mensonge dans un sens ou dans l'autre : porte
 * fermée, on nomme le robot bloqué ; portes ouvertes, on le dit franchement
 * et on déplace la question — la cause est ailleurs, et c'est le diagnostic
 * qui la trouve.
 */
export function CarteTechnique({
  bloques,
  autorises,
  llmstxt,
  domaine,
  wide,
  part,
}: {
  bloques: string[];
  autorises: { nom: string; explicite: boolean }[];
  llmstxt: boolean;
  domaine: string;
  wide: boolean;
  part: "recit" | "preuve";
}) {
  const ferme = bloques.length > 0;
  const total = bloques.length + autorises.length;

  if (part === "preuve") {
    const lignes = [
      ...bloques.map((r) => ({ nom: r, bloque: true, explicite: true })),
      ...autorises.map((a) => ({ nom: a.nom, bloque: false, explicite: a.explicite })),
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: MUTED }}>
          {domaine.toUpperCase()} / ROBOTS.TXT
        </span>

        {/* Le verdict d'un coup d'œil, avant le détail ligne à ligne. */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            padding: wide ? "14px 16px" : "12px 14px",
            background: ferme ? PANEL : "transparent",
            border: `1px solid ${ferme ? RED : HAIR}`,
            borderRadius: 3,
          }}
        >
          <span
            style={{
              fontSize: wide ? 40 : 32,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
              color: ferme ? RED : INK,
            }}
          >
            {ferme ? bloques.length : total}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.4, color: ferme ? RED : MUTED }}>
            {ferme
              ? `ROBOT${bloques.length > 1 ? "S" : ""} D'IA REFUSÉ${bloques.length > 1 ? "S" : ""}\nSUR ${total} TESTÉ${total > 1 ? "S" : ""}`
              : `ROBOT${total > 1 ? "S" : ""} D'IA SUR ${total}\nPEUVENT VOUS LIRE`}
          </span>
        </div>

        {lignes.map((l) => (
          <div
            key={l.nom}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 12px",
              background: l.bloque ? PANEL : "transparent",
              border: `1px solid ${l.bloque ? RED : HAIR}`,
              borderRadius: 3,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: wide ? 13 : 12, color: INK }}>{l.nom}</span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: wide ? 12 : 11,
                fontWeight: l.bloque ? 700 : 400,
                letterSpacing: "0.06em",
                color: l.bloque ? RED : MUTED,
                textAlign: "right",
              }}
            >
              {l.bloque ? "BLOQUÉ" : l.explicite ? "autorisé" : "autorisé par défaut"}
            </span>
          </div>
        ))}
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
          llms.txt : {llmstxt ? "présent" : "absent"} · relevé public, vérifiable sur{" "}
          {domaine}/robots.txt
        </span>
      </div>
    );
  }

  return (
    <>
      <span style={{ ...labelStyle, color: ferme ? RED : MUTED }}>
        {ferme ? "LA PORTE EST FERMÉE" : "LA PORTE EST OUVERTE"}
      </span>

      <p
        style={{
          fontSize: wide ? 32 : 25,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        {ferme
          ? bloques.length === 1
            ? `Votre site interdit l'accès à ${bloques[0]}.`
            : `Votre site interdit l'accès à ${bloques.length} robots d'IA.`
          : "Les robots d'IA peuvent lire votre site. La cause est ailleurs."}
      </p>

      {ferme ? (
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Ces robots sont ceux qui alimentent les réponses que vous venez de lire. Tant qu'ils sont
          refusés, aucun contenu que vous publierez ne pourra être cité.{" "}
          <strong style={{ color: INK, fontWeight: 800 }}>
            C'est une ligne de texte à changer sur votre serveur, et c'est la correction la moins
            chère de tout ce rapport.
          </strong>
        </p>
      ) : (
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Rien ne bloque techniquement : les IA ont le droit de vous lire.{" "}
          <strong style={{ color: INK, fontWeight: 800 }}>
            Ce qui vous manque n'est donc pas l'autorisation, c'est la matière.
          </strong>{" "}
          Ce qu'elles trouvent à lire sur vous ne suffit pas à vous citer, et c'est précisément ce
          que le scan premium va chercher, source par source.
        </p>
      )}

      <p style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: MUTED, margin: 0 }}>
        Relevé pendant votre scan, sur le fichier public {domaine}/robots.txt. Vous pouvez
        l'ouvrir maintenant.
      </p>
    </>
  );
}
