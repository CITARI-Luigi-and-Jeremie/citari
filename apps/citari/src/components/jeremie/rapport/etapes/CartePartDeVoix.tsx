import { useEffect, useState } from "react";

import { BODY, HAIR, INK, MUTED, RED, labelStyle } from "../theme";

type Ligne = { nom: string; reponses: number; vous: boolean };

type Props = {
  voix: Ligne[];
  meta: {
    questions: number;
    moteurs: number;
    marquesTotal: number;
    reponsesPerdues: number;
    termeSecteur: string;
  };
  date: string;
  numero: number;
  total: number;
  wide: boolean;
  part: "recit" | "preuve";
};

/**
 * 04 — Part de voix, barres qui se remplissent à l'apparition.
 * Comptée en RÉPONSES, l'unité de tout le parcours : sa maquette disait
 * « mentions », ce qui aurait contredit les cartes précédentes.
 */
export function CartePartDeVoix({ voix, meta, date, numero, total, wide, part }: Props) {
  const [on, setOn] = useState(false);
  const max = Math.max(...voix.map((v) => v.reponses), 1);
  const douleur = meta.reponsesPerdues > 0;

  useEffect(() => {
    if (part !== "preuve") return;
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [part]);

  if (part === "recit") {
    return (
      <>
        <span style={{ ...labelStyle, letterSpacing: "0.08em", color: "var(--signal)" }}>
          PIÈCE {String(numero).padStart(2, "0")} / {String(total).padStart(2, "0")}
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
          {douleur
            ? `Sur ${meta.questions} questions, ${meta.reponsesPerdues} réponses donnent un nom sans donner le vôtre.`
            : `Voici qui occupe les réponses à vos questions.`}
        </p>
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          {douleur
            ? `Dans ces ${meta.reponsesPerdues} réponses, l'utilisateur repart avec un ${meta.termeSecteur} identifié. Pas le vôtre. C'est ce que la mesure montre, sans extrapolation.`
            : `${meta.marquesTotal} marques apparaissent dans les réponses aux ${meta.questions} questions. La répartition est donnée telle quelle, sans pondération.`}
        </p>
      </>
    );
  }

  const scopeLine = [
    `${meta.questions} questions × ${meta.moteurs} moteurs`,
    date,
  ]
    .filter(Boolean)
    .join(" · ");

  const monoLine = {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--ink-2)",
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {voix.map((v, i) => {
          const accent = v.vous && douleur;
          return (
            <div key={v.nom} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}
              >
                <span
                  style={{
                    fontSize: wide ? 16 : 15,
                    fontWeight: v.vous ? 800 : 600,
                    color: accent ? RED : INK,
                  }}
                >
                  {v.vous ? "Vous" : v.nom}
                </span>
                <span style={{ fontSize: 13.5, color: accent ? RED : MUTED }}>
                  {v.reponses} réponse{v.reponses > 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ height: 9, background: HAIR, borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    height: 9,
                    background: accent ? RED : INK,
                    opacity: v.vous ? 1 : 0.6,
                    width: on ? `${(v.reponses / max) * 100}%` : "0%",
                    transition: `width 620ms cubic-bezier(0.22,1,0.36,1) ${80 + i * 90}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={monoLine}>{scopeLine}</span>
        {meta.marquesTotal > voix.length ? (
          <span style={monoLine}>
            {voix.length} marques les plus citées sur {meta.marquesTotal}
          </span>
        ) : null}
      </div>
    </div>
  );
}
