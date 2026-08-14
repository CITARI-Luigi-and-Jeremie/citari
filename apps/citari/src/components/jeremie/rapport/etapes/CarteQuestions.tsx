import { MoteurLogo } from "@/components/moteur-logo";
import { TexteMoteur, type Mention, type Question, type Reponse } from "@/components/rapport";
import { MOTEURS } from "@/lib/typo";

import { BODY, HAIR, INK, MONO, MUTED, RED, TEXT, labelStyle } from "../theme";

/**
 * L'échantillon complet, DANS la séquence.
 *
 * Il vivait jusqu'ici en annexe sous la séquence, avec deux liens pour y
 * descendre. Un contenu qu'il faut aller chercher sous un écran plein n'est
 * pas lu : c'était pourtant la pièce qui prouve toute la mesure, celle qu'un
 * dirigeant sceptique ouvre pour vérifier qu'on n'invente rien. Elle est
 * devenue une étape, entre la cause technique et l'offre : on ne peut plus
 * la manquer, et l'annexe du bas a été supprimée avec ses deux liens
 * (jamais deux fois la même pièce, la séquence a déjà payé ce piège avec
 * ses deux comparatifs).
 *
 * La grille de la colonne preuve est la donnée elle-même : une case par
 * question, rouge quand la marque n'apparaît dans aucune réponse. L'ampleur
 * de l'absence se lit d'un coup d'œil, sans qu'on ait besoin de l'écrire.
 */
export function CarteQuestions({
  questions,
  reponses,
  mentions,
  marque,
  wide,
  part,
}: {
  questions: Question[];
  reponses: Reponse[];
  mentions: Mention[];
  marque: string;
  wide: boolean;
  part: "recit" | "preuve";
}) {
  // Une réponse en panne ne prouve rien et ne compte nulle part : c'est la
  // même règle que le dénominateur du score.
  const valides = reponses.filter((r) => !r.error && r.raw_text);
  const moteursPresents = MOTEURS.filter((m) => valides.some((r) => r.engine === m));

  const lignes = questions
    .map((q) => {
      const desReponses = valides.filter((r) => r.query_id === q.id);
      const moteursCitants = moteursPresents.filter((m) =>
        mentions.some((x) => x.query_id === q.id && x.engine === m && x.is_target),
      );
      return { q, desReponses, moteursCitants, citee: moteursCitants.length > 0 };
    })
    .filter((l) => l.desReponses.length > 0);

  const citees = lignes.filter((l) => l.citee).length;

  if (part === "preuve") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: wide ? 34 : 30,
              fontWeight: 700,
              color: citees === 0 ? RED : INK,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {citees} / {lignes.length}
          </div>
          <p style={{ fontSize: wide ? 14 : 13.5, color: BODY, lineHeight: 1.4, margin: "8px 0 0" }}>
            {citees === 0
              ? `${marque} n'apparaît dans aucune des ${lignes.length} questions posées.`
              : `Questions où ${marque} apparaît au moins une fois.`}
          </p>
        </div>

        {/* Une case par question : la donnée fait le graphique. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {lignes.map((l) => (
            <span
              key={l.q.id}
              title={`${String(l.q.rank).padStart(2, "0")} · ${l.q.text} — ${
                l.citee ? `cité par ${l.moteursCitants.join(", ")}` : "absent partout"
              }`}
              style={{
                width: wide ? 27 : 25,
                height: wide ? 27 : 25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: l.citee ? INK : RED,
                color: "#FFFDF9",
                fontFamily: MONO,
                fontSize: 10.5,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(l.q.rank).padStart(2, "0")}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
          <Legende couleur={INK} texte="Vous êtes cité" />
          <Legende couleur={RED} texte="Absent de toutes les réponses" />
        </div>

        <p
          style={{
            fontFamily: MONO,
            fontSize: 11.5,
            color: MUTED,
            lineHeight: 1.5,
            margin: 0,
            borderTop: `1px solid ${HAIR}`,
            paddingTop: 12,
          }}
        >
          {lignes.length} questions · {valides.length} réponses conservées ·{" "}
          {moteursPresents.join(", ")}
        </p>
      </div>
    );
  }

  return (
    <>
      <span style={labelStyle}>LA MESURE, MOT POUR MOT</span>

      <p
        style={{
          fontSize: wide ? 30 : 23,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        Voici les {lignes.length} questions. Ouvrez celle que vous voulez.
      </p>

      <p style={{ fontSize: wide ? 16 : 15, color: BODY, lineHeight: 1.55, margin: 0 }}>
        Ce ne sont pas des exemples : ce sont les questions réellement posées, et les réponses
        telles que les moteurs les ont écrites, sans coupe ni résumé.{" "}
        <strong style={{ color: INK, fontWeight: 700 }}>
          Aucune ne contient votre nom
        </strong>
        , volontairement : on mesure si les IA vous citent d'elles-mêmes.
      </p>

      {/* La liste défile dans la carte : la séquence garde sa hauteur, et le
          filet du haut dit qu'il y a de la matière en dessous. */}
      <div
        style={{
          maxHeight: wide ? 340 : 280,
          overflowY: "auto",
          borderTop: `1px solid ${HAIR}`,
          borderBottom: `1px solid ${HAIR}`,
        }}
      >
        {lignes.map((l) => (
          <details key={l.q.id} style={{ borderBottom: `1px solid ${HAIR}` }}>
            <summary
              className="list-none"
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                padding: "10px 4px",
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  color: MUTED,
                  flex: "none",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(l.q.rank).padStart(2, "0")}
              </span>
              <span style={{ flex: 1, fontSize: wide ? 14 : 13.5, lineHeight: 1.4, color: TEXT }}>
                {l.q.text}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  flex: "none",
                  color: l.citee ? MUTED : RED,
                }}
              >
                {l.citee ? "cité" : "absent"}
              </span>
            </summary>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "2px 4px 16px 26px" }}>
              {moteursPresents.map((m) => {
                const rep = l.desReponses.find((r) => r.engine === m);
                if (!rep) return null;
                const citations = mentions.filter((x) => x.response_id === rep.id);
                const cible = citations.find((x) => x.is_target);
                const concurrents = citations.filter((x) => !x.is_target).map((x) => x.brand);
                return (
                  <div key={m}>
                    <p
                      style={{
                        fontFamily: MONO,
                        fontSize: 10.5,
                        color: MUTED,
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        gap: "2px 10px",
                        margin: 0,
                      }}
                    >
                      <span style={{ color: INK, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <MoteurLogo moteur={m} className="text-[12px]" />
                        {m}
                      </span>
                      {cible ? (
                        <span>
                          {marque} en position {cible.position ?? "?"}
                          {cible.recommended ? " · recommandé" : ""}
                        </span>
                      ) : (
                        <span style={{ color: RED }}>{marque} absent</span>
                      )}
                      {concurrents.length ? <span>cités : {concurrents.join(", ")}</span> : null}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: BODY,
                        whiteSpace: "pre-line",
                        margin: "6px 0 0",
                      }}
                    >
                      <TexteMoteur texte={rep.raw_text ?? ""} />
                    </p>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

function Legende({ couleur, texte }: { couleur: string; texte: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, background: couleur, flex: "none" }} />
      <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{texte}</span>
    </span>
  );
}
