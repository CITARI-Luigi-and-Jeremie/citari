import { extraitVerbatim } from "@/lib/rapport-sequence";

import { marked } from "../marked";
import { BODY, MONO, SERIF, labelStyle } from "../theme";

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

/**
 * 03 — La phrase exacte, avec la question qui l'a produite.
 *
 * Réécrite le 15/08/2026 sur retour de Luigi. L'ancien récit expliquait la
 * méthode de conservation (« rejoués à l'identique dans 90 jours ») au lieu
 * de dire ce que la pièce montre, et il affirmait que les autres réponses
 * attendaient « en bas de cette page » — faux depuis que l'annexe est
 * devenue l'étape « Les N questions ». Le verbatim est désormais un extrait
 * coupé pour tenir à l'écran, coupe annoncée, texte intégral à cette étape.
 */
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
  // « Agoravox : absent de cette réponse » ou « cité en position N » : la
  // chaîne vient de `construireSequence`, on en déduit le régime.
  const absent = votreStatut.includes("absent");

  if (part === "recit") {
    return (
      <>
        <span style={{ ...labelStyle, color: "var(--signal)" }}>LA PHRASE EXACTE</span>
        <p
          style={{
            fontSize: wide ? 30 : 23,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
            margin: 0,
            color: "var(--ink)",
          }}
        >
          {concurrent
            ? absent
              ? `Une IA recommande ${concurrent}. Vous n'êtes pas dans la réponse.`
              : `Une IA cite ${concurrent} avant vous.`
            : "Voilà ce qu'un client lit quand il pose la question."}
        </p>
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          C'est une réponse réelle, copiée mot pour mot.{" "}
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>
            C'est elle que lit un acheteur qui pose la question, pas votre site.
          </span>
        </p>
        {/* Jamais de compte d'étapes ici (« dans deux étapes ») : la position
            de l'étape « questions » bouge dès qu'une carte sort de la
            séquence. On nomme la destination, pas la distance. */}
        <p style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: "var(--ink-3)", margin: 0 }}>
          La réponse entière, et les {totalQuestions - 1} autres questions, vous attendent à
          l'étape « Les {totalQuestions} questions ».
        </p>
      </>
    );
  }

  const questionLabel = `QUESTION ${String(rangQuestion).padStart(2, "0")} / ${String(totalQuestions).padStart(2, "0")} · POSÉE À ${moteur.toUpperCase()}${date ? ` LE ${date.toUpperCase()}` : ""}`;

  const ligneConcurrent = concurrent
    ? `${concurrent} ${rangConcurrent ?? "cité"}`.trim()
    : "Aucune marque nommée";

  const sourceLine = [moteur, date, ligneConcurrent, votreStatut].filter(Boolean).join(" · ");
  const extrait = extraitVerbatim(texte);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            fontSize: wide ? 19 : 17,
            fontWeight: 500,
            lineHeight: 1.35,
            margin: 0,
            color: "var(--ink)",
          }}
        >
          « {question} »
        </p>
      </div>

      {/* Le verbatim : un extrait qui tient à l'écran, coupe annoncée. */}
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
            fontSize: wide ? 20 : 17,
            lineHeight: 1.45,
            textWrap: "pretty",
            color: "var(--ink)",
          }}
        >
          {marked(extrait.texte)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: wide ? 13 : 12.5,
            color: "var(--ink-2)",
          }}
        >
          {sourceLine}
          {extrait.coupe ? " · extrait, texte intégral à l'étape « questions »" : ""}
        </span>
      </div>
    </div>
  );
}
