import { marked } from "../marked";
import { BODY, SERIF, labelStyle } from "../theme";

type Props = {
  question: string;
  rangQuestion: number;
  totalQuestions: number;
  moteur: string;
  date: string;
  texte: string;
  concurrent: string | null;
  rangConcurrent: string | null;
  votreStatut: string;
  wide: boolean;
  part: "recit" | "preuve";
};

/** 03 — La phrase exacte, avec la question qui l'a produite. */
export function CarteVerbatim({
  question,
  rangQuestion,
  totalQuestions,
  moteur,
  date,
  texte,
  concurrent,
  rangConcurrent,
  votreStatut,
  wide,
  part,
}: Props) {
  if (part === "recit") {
    return (
      <>
        <span style={{ ...labelStyle, color: "var(--signal)" }}>
          PIÈCE {String(rangQuestion).padStart(2, "0")} / {String(totalQuestions).padStart(2, "0")}
        </span>
        <p
          style={{
            fontSize: wide ? 30 : 23,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            margin: 0,
            color: "var(--ink)",
          }}
        >
          La réponse, mot pour mot, telle que le moteur l'a produite.
        </p>
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Nous ne résumons pas et ne reformulons pas. La question, la date,{" "}
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>
            le moteur et la réponse complète sont conservés pour être rejoués à l'identique dans 90
            jours.
          </span>
        </p>
      </>
    );
  }

  const questionLabel = `QUESTION ${String(rangQuestion).padStart(2, "0")} / ${String(totalQuestions).padStart(2, "0")} · POSÉE À ${moteur.toUpperCase()}${date ? ` LE ${date.toUpperCase()}` : ""}`;

  const ligneConcurrent = concurrent
    ? `${concurrent} ${rangConcurrent ?? "cité"}`.trim()
    : "Aucune marque nommée";

  const sourceLine = [moteur, date, ligneConcurrent, votreStatut].filter(Boolean).join(" · ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Bloc question */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-2)",
          }}
        >
          {questionLabel}
        </span>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 20,
            fontWeight: 500,
            lineHeight: 1.35,
            margin: 0,
            color: "var(--ink)",
          }}
        >
          « {question} »
        </p>
      </div>

      {/* Le verbatim */}
      <div
        style={{
          borderLeft: "2px solid var(--signal)",
          paddingLeft: wide ? 20 : 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: wide ? 23 : 18.5,
            lineHeight: 1.45,
            textWrap: "pretty",
            color: "var(--ink)",
          }}
        >
          {marked(texte)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: wide ? 14 : 13.5,
            color: "var(--ink-2)",
          }}
        >
          {sourceLine}
        </span>
      </div>
    </div>
  );
}
