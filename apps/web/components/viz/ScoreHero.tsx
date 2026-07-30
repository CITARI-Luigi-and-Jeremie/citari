"use client";

import { useEffect, useState } from "react";
import { scoreTone, scoreVerdict, TONE_VAR } from "@/lib/score";

/**
 * Chiffre héros : le score n'est pas un graphique, c'est un titre.
 * Le compteur monte une fois (chorégraphie autorisée, DESIGN.md §6),
 * jamais en boucle, et se fige immédiatement si l'utilisateur réduit les animations.
 */
export default function ScoreHero({
  score,
  previous,
  count = true,
}: {
  score: number;
  previous?: number | null;
  count?: boolean;
}) {
  const [value, setValue] = useState(count ? 0 : score);
  const tone = scoreTone(score);

  useEffect(() => {
    if (!count) return setValue(score);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setValue(score);

    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easing sec, sans rebond
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(score * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, count]);

  const delta = previous != null ? score - previous : null;

  return (
    <div>
      <div className="flex items-start gap-4">
        <span
          className="tnum font-mono text-score font-medium"
          style={{ color: TONE_VAR[tone] }}
          aria-label={`Score de visibilité IA : ${score} sur 100`}
        >
          {value}
        </span>
        <span className="mt-6 font-mono text-lg text-ink-faint">/100</span>
      </div>
      <p className="mt-2 font-editorial text-2xl" style={{ color: TONE_VAR[tone] }}>
        {scoreVerdict(score)}
        {delta != null && delta !== 0 && (
          <span className={`ml-3 font-mono text-lg ${delta > 0 ? "text-valid" : "text-signal"}`}>
            {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`}
          </span>
        )}
      </p>
    </div>
  );
}
