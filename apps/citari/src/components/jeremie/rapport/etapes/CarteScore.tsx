import { useEffect, useState } from "react";

import { BODY, HAIR, INK, MONO, RED, SUFFIX, labelStyle } from "../theme";

/** 01 — Le score. Récit à gauche, jauge chiffrée à droite. */
export function CarteScore({
  score,
  domaine,
  date,
  moteurs,
  wide,
  part,
}: {
  score: number;
  domaine: string;
  date: string;
  moteurs: number;
  wide: boolean;
  part: "recit" | "preuve";
}) {
  const [shown, setShown] = useState(score);

  useEffect(() => {
    if (part !== "preuve") return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(score);
      return;
    }
    setShown(0);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShown(Math.round(score * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, part]);

  if (part === "recit") {
    return (
      <>
        <span style={labelStyle}>VOTRE SCORE DE VISIBILITÉ{date ? ` · ${date.toUpperCase()}` : ""}</span>
        <p
          style={{
            fontSize: wide ? 30 : 23,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Voilà la place que {domaine} occupe aujourd'hui dans les réponses des IA.
        </p>
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Ce score mesure une seule chose : quand un acheteur pose la question de votre métier à
          une IA, votre nom sort-il, et à quelle place. En dessous de 50, vous existez à peine dans
          la conversation.
        </p>
      </>
    );
  }

  const hauteur = Math.max(2, Math.min(100, shown));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: wide ? 26 : 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontSize: wide ? 116 : 84,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              lineHeight: 0.8,
              color: INK,
            }}
          >
            {shown}
          </span>
          <span
            style={{
              fontSize: wide ? 32 : 26,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: SUFFIX,
            }}
          >
            /100
          </span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: SUFFIX }}>
          MESURE RÉELLE · {moteurs} MOTEUR{moteurs > 1 ? "S" : ""}
        </span>
      </div>

      {/* jauge verticale, repère à 50 */}
      <div style={{ position: "relative", flexShrink: 0, paddingRight: 34 }}>
        <div
          style={{
            position: "relative",
            width: 14,
            height: wide ? 132 : 104,
            background: HAIR,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${hauteur}%`,
              background: score < 50 ? RED : INK,
              transition: "height 240ms linear",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: "50%",
            width: 26,
            height: 1,
            background: INK,
            opacity: 0.5,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 30,
            bottom: "50%",
            transform: "translateY(50%)",
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.1em",
            color: SUFFIX,
            whiteSpace: "nowrap",
          }}
        >
          50
        </span>
      </div>
    </div>
  );
}
