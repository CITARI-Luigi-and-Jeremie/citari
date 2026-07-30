"use client";

import { useEffect, useRef, useState } from "react";

export interface ShareDatum {
  brand: string;
  share: number; // 0-1
  isTarget: boolean;
  previous?: number | null;
}

/**
 * Part de voix — barres horizontales, encodage « focus + contexte » :
 * la marque du client porte l'accent, les concurrents restent neutres.
 * Extrémités franches (DESIGN.md §5 : pas d'arrondi mou), étiquetage direct
 * systématique — l'identité ne repose jamais sur la seule couleur.
 */
export default function ShareOfVoice({ data, animate = true }: { data: ShareDatum[]; animate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    // Filet de sécurité : hors écran (impression, PDF Playwright, capture),
    // l'observateur ne se déclenche jamais — les barres doivent quand même exister.
    const fallback = setTimeout(() => setShown(true), 900);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, [animate]);

  const max = Math.max(...data.map((d) => d.share), 0.01);
  const sorted = [...data].sort((a, b) => b.share - a.share);

  return (
    <div ref={ref} className="w-full">
      {sorted.map((d, i) => {
        const width = (d.share / max) * 100;
        const delta = d.previous != null ? Math.round((d.share - d.previous) * 100) : null;
        return (
          <div key={d.brand} className="border-t border-rule py-3 first:border-t-0">
            <div className="flex items-baseline justify-between gap-4">
              <span
                className={`truncate font-mono text-sm ${d.isTarget ? "text-bone" : "text-bone-dim"}`}
                style={d.isTarget ? { color: "var(--signal)" } : undefined}
              >
                {d.isTarget && <span aria-hidden className="mr-2">▸</span>}
                {d.brand}
              </span>
              <span className="tnum shrink-0 font-mono text-sm text-bone">
                {Math.round(d.share * 100)}%
                {delta != null && delta !== 0 && (
                  <span className={delta > 0 ? "ml-2 text-valid" : "ml-2 text-signal"}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </span>
            </div>
            {/* Piste + barre : la piste reste lisible même à 0 % */}
            <div className="mt-2 h-2 w-full bg-track">
              <div
                className="h-full"
                style={{
                  width: shown ? `${width}%` : "0%",
                  background: d.isTarget ? "var(--signal)" : "var(--bone-faint)",
                  transition: `width 640ms var(--ease-sharp) ${i * 70}ms`,
                }}
                role="img"
                aria-label={`${d.brand} : ${Math.round(d.share * 100)} % de part de voix`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
