/**
 * StrokeText : texte SVG en contour qui se remplit par balayage (« wipe »).
 *
 * Porté du projet Lovable de Jérémie le 14/08/2026 : c'est l'animation
 * signature du pont problème/solution. Le texte occupe toute la largeur
 * disponible : le viewBox est calculé après mesure du glyphe, la largeur CSS
 * vaut 100 %. Les classes `.stroke-text__*` vivent dans styles.css.
 */
import { useEffect, useId, useRef, useState } from "react";

import { useApparition } from "@/lib/use-apparition";

type StrokeTextProps = {
  text: string;
  /** Couleur du contour. */
  strokeColor?: string;
  /** Couleur du remplissage. */
  fillColor?: string;
  /** Épaisseur du contour, en unités du viewBox. */
  strokeWidth?: number;
  /** Retard avant le démarrage du remplissage, en ms. */
  delay?: number;
  /** Durée du balayage, en ms. */
  duration?: number;
  /** Alignement horizontal quand la ligne est plus courte que le bloc. */
  align?: "left" | "center" | "right";
  className?: string;
};

const FONT_SIZE = 72;
const BOX_HEIGHT = 104;
const BASELINE = 82;

const ALIGN_RATIO: Record<"left" | "center" | "right", string> = {
  left: "xMinYMid meet",
  center: "xMidYMid meet",
  right: "xMaxYMid meet",
};

export function StrokeText({
  text,
  strokeColor = "var(--ink)",
  fillColor = "var(--ink)",
  strokeWidth = 1.4,
  delay = 0,
  duration = 1500,
  align = "left",
  className,
}: StrokeTextProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  // REJOUABLE (15/08/2026) : le balayage se réarme dès que le pont sort
  // entièrement de l'écran, et rejoue à chaque retour, dans les deux sens.
  const play = useApparition(wrapRef, 0.3);
  // `useId` et non un aléa : la page est rendue côté serveur, un id tiré au
  // hasard diffère à l'hydratation et React signale le HTML entier en erreur.
  const maskId = `stroke-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Mesure de la largeur réelle du texte (une fois les polices prêtes).
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const node = measureRef.current;
      if (!node || cancelled) return;
      const w = node.getComputedTextLength();
      if (w > 0) setWidth(w);
    };
    measure();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(measure).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [text]);

  const pad = 4;
  const viewWidth = (width ?? 1000) + pad * 2;
  const timing = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
  } as const;

  return (
    <div ref={wrapRef} className={`stroke-text ${className ?? ""}`}>
      <svg
        className="stroke-text__svg"
        viewBox={`0 0 ${viewWidth} ${BOX_HEIGHT}`}
        preserveAspectRatio={ALIGN_RATIO[align]}
        role="img"
        aria-label={text}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect
              x="0"
              y="0"
              width={viewWidth}
              height={BOX_HEIGHT}
              fill="#fff"
              className={play ? "stroke-text__wipe stroke-text__wipe--on" : "stroke-text__wipe"}
              style={timing}
            />
          </mask>
        </defs>

        <text
          ref={measureRef}
          className="stroke-text__stroke"
          x={pad}
          y={BASELINE}
          fontSize={FONT_SIZE}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        >
          {text}
        </text>

        <text
          className="stroke-text__fill"
          x={pad}
          y={BASELINE}
          fontSize={FONT_SIZE}
          fill={fillColor}
          mask={`url(#${maskId})`}
        >
          {text}
        </text>

        {/* Trait de tête : rend le balayage visible pendant sa progression. */}
        <rect
          x="0"
          y={BASELINE - FONT_SIZE}
          width="3"
          height={FONT_SIZE + 14}
          fill="var(--signal)"
          className={play ? "stroke-text__edge stroke-text__edge--on" : "stroke-text__edge"}
          style={{ ...timing, ["--cit-edge-x" as string]: `${viewWidth}px` }}
        />
      </svg>
    </div>
  );
}
