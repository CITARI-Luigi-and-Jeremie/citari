import { useEffect, useState } from "react";
import {
  ENGINES,
  isLeading,
  pct,
  shareRows,
  verdictLabel,
  type ScanRecord,
} from "@/lib/scan-result";

/** 1. VERDICT — un seul moment chorégraphié : la révélation du score. */
export function Verdict({ scan }: { scan: ScanRecord }) {
  const score = scan.score ?? 0;
  const [shown, setShown] = useState(0);
  const leading = isLeading(score);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(score * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
        <p className="mono text-[13px] uppercase tracking-[0.08em] text-ink-2">
          {scan.brand}
        </p>
        <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p
            className="mono text-[88px] leading-[0.9] sm:text-[136px]"
            style={{ color: leading ? "var(--verdict)" : "var(--ink)" }}
            aria-label={`Score ${score} sur 100`}
          >
            {shown}
            <span className="text-[28px] text-ink-2 sm:text-[36px]">/100</span>
          </p>
          <p
            className="text-[26px] sm:text-[34px]"
            style={{ color: leading ? "var(--verdict)" : "var(--ink)" }}
          >
            {verdictLabel(score)}
          </p>
        </div>
        <p className="measure mt-6 text-ink-2">
          {scan.domain} · {scan.score_detail?.global?.mentionedCount ?? 0} mentions sur{" "}
          {scan.score_detail?.global?.responses ?? 0} réponses analysées.
        </p>
      </div>
    </section>
  );
}

/** 2. VENTILATION */
export function Breakdown({ scan }: { scan: ScanRecord }) {
  const g = scan.score_detail?.global ?? {};
  const rows = [
    { label: "Présence", weight: "50 %", value: pct(g.mentionRate) },
    { label: "Rang", weight: "20 %", value: pct(g.positionScore) },
    { label: "Recommandation", weight: "20 %", value: pct(g.recommendationRate) },
    { label: "Tonalité", weight: "10 %", value: pct(g.sentimentScore) },
  ];

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-[26px] sm:text-[34px]">Ventilation du score</h2>
        <p className="mono mt-3 text-[13px] text-ink-2">Formule publiée. Recalculable.</p>
        <ul className="mt-8 divide-y divide-[var(--rule)] border-y border-rule">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-baseline justify-between gap-4 py-4"
            >
              <span>
                {row.label} <span className="mono text-[13px] text-ink-2">{row.weight}</span>
              </span>
              <span className="mono">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** 3. PAR MOTEUR — filets + mono, aucune librairie de graphes. */
export function ByEngine({ scan }: { scan: ScanRecord }) {
  const byEngine = scan.score_detail?.byEngine ?? {};

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-[26px] sm:text-[34px]">Moteur par moteur</h2>
        <ul className="mt-8 divide-y divide-[var(--rule)] border-y border-rule">
          {ENGINES.map(({ key, label }) => {
            const detail = byEngine[key];
            const count = detail?.mentionedCount ?? 0;
            const total = detail?.responses ?? 0;
            const zero = count === 0;
            return (
              <li key={key} className="flex items-baseline justify-between gap-4 py-4">
                <span style={zero ? { color: "var(--signal)" } : undefined}>{label}</span>
                <span
                  className="mono"
                  style={zero ? { color: "var(--signal)" } : undefined}
                >
                  cité {count} / {total}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** 4. PART DE VOIX — barres maison. */
export function ShareOfVoice({ scan }: { scan: ScanRecord }) {
  const rows = shareRows(scan);
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="measure text-[26px] sm:text-[34px]">
          Qui capte la conversation sur vos questions.
        </h2>
        <ul className="mt-10 space-y-5">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-4">
                <span style={row.isBrand ? { color: "var(--signal)" } : undefined}>
                  {row.label}
                </span>
                <span
                  className="mono text-[14px]"
                  style={row.isBrand ? { color: "var(--signal)" } : { color: "var(--ink-2)" }}
                >
                  {pct(row.value)}
                </span>
              </div>
              <div className="mt-2 h-3 w-full border border-rule bg-paper-2">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(2, (row.value / max) * 100)}%`,
                    backgroundColor: row.isBrand ? "var(--signal)" : "var(--ink-2)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
