import { useEffect, useMemo, useState } from "react";
import { ENGINES, type ScanRecord } from "@/lib/scan-result";
import type { MetaRow, QueryRow } from "@/lib/scan-live.server";
import {
  METHOD_POINTS,
  PHASE_LABELS,
  SCORING_STEPS,
  cellKey,
  formatElapsed,
  formatLatency,
  queryLabel,
} from "@/lib/scan-loading";

type Props = {
  scan: ScanRecord;
  queries: QueryRow[];
  meta: MetaRow[];
  unstable: boolean;
};

/** Chrono du temps réellement écoulé depuis started_at. */
function useElapsed(startedAt: string | null) {
  const start = useMemo(() => {
    const value = startedAt ? new Date(startedAt).getTime() : NaN;
    return Number.isNaN(value) ? Date.now() : value;
  }, [startedAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return Math.max(0, now - start);
}

export function LoadingScreen({ scan, queries, meta, unstable }: Props) {
  const elapsed = useElapsed(scan.started_at);
  const scoring = scan.status === "scoring";

  const filled = useMemo(() => {
    const set = new Set<string>();
    for (const row of meta) set.add(cellKey(row.query_id, row.engine));
    return set;
  }, [meta]);

  const total = queries.length * ENGINES.length;
  const collected = meta.length;
  const ticker = useMemo(() => meta.slice(-3).reverse(), [meta]);

  // Titre d'onglet : compteur réel.
  useEffect(() => {
    if (scan.status !== "running" || total === 0) return;
    const previous = document.title;
    document.title = `${collected}/${total} — Citari`;
    return () => {
      document.title = previous;
    };
  }, [collected, total, scan.status]);

  // Acte 3 : les deux labels de phase s'allument successivement.
  const [scoringStep, setScoringStep] = useState(0);
  useEffect(() => {
    if (!scoring) return;
    setScoringStep(0);
    const id = window.setTimeout(() => setScoringStep(1), 1200);
    return () => window.clearTimeout(id);
  }, [scoring]);

  // Au-delà de 2 minutes : rotation lente des trois points de méthode.
  const overtime = elapsed > 120_000;
  const [pointIndex, setPointIndex] = useState(0);
  useEffect(() => {
    if (!overtime) return;
    const id = window.setInterval(
      () => setPointIndex((index) => (index + 1) % METHOD_POINTS.length),
      8000,
    );
    return () => window.clearInterval(id);
  }, [overtime]);

  const phase =
    scan.status === "scoring"
      ? PHASE_LABELS.scoring
      : scan.status === "running"
        ? PHASE_LABELS.running
        : PHASE_LABELS.generating_queries;

  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="mono text-[12px] tracking-[0.12em] text-ink-2">
          {phase}
          {scan.status === "generating_queries" ? (
            <span className="anim-blink ml-2 inline-block align-middle">▮</span>
          ) : null}
        </p>

        <h1 className="measure mt-5 text-[26px] sm:text-[34px]">
          Constitution de votre dossier.
        </h1>
        <p className="mono mt-4 text-[13px] text-ink-2">
          {scan.brand} · {scan.domain}
        </p>

        {scan.status === "generating_queries" ? (
          <QueryCascade queries={queries} />
        ) : (
          <>
            <div className="mono mt-12 flex flex-wrap items-baseline justify-between gap-3 text-[12px] tracking-[0.10em] text-ink-2">
              <span>
                RÉPONSES COLLECTÉES {collected}/{total}
              </span>
              <span>{formatElapsed(elapsed)}</span>
            </div>

            <PunchCard queries={queries} filled={filled} frozen={scoring} />

            {scoring ? (
              <div className="mono mt-6 space-y-2 text-[12px] tracking-[0.10em]">
                {SCORING_STEPS.map((label, index) => (
                  <p
                    key={label}
                    className={index <= scoringStep ? "text-ink" : "text-ink-2 opacity-40"}
                  >
                    {label}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mono mt-6 truncate text-[12px] tracking-[0.10em] text-ink-2">
                {ticker.length === 0
                  ? "—"
                  : ticker
                      .map(
                        (row) =>
                          `${(row.engine ?? "").toUpperCase()} · ${formatLatency(row.latency_ms)}`,
                      )
                      .join("   /   ")}
              </p>
            )}
          </>
        )}

        {overtime ? (
          <p key={pointIndex} className="measure anim-step mt-12 text-ink-2">
            {METHOD_POINTS[pointIndex]}
          </p>
        ) : null}

        {unstable ? (
          <p className="mono mt-10 text-[12px] tracking-[0.10em] text-ink-2">
            connexion instable — nouvelle tentative
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** ACTE 1 — cascade des vraies questions, une entrée toutes les ~130 ms. */
function QueryCascade({ queries }: { queries: QueryRow[] }) {
  if (queries.length === 0) return null;
  return (
    <ul className="mt-12 border-t border-rule">
      {queries.map((query, index) => (
        <li
          key={query.id}
          className="anim-step flex items-baseline gap-4 border-b border-rule py-3"
          style={{ animationDelay: `${index * 130}ms` }}
        >
          <span className="mono shrink-0 text-[12px] text-ink-2">
            {queryLabel(query.position)}
          </span>
          <span className="measure">{query.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** ACTE 2 / 3 — grille type carte perforée, une ligne par question. */
function PunchCard({
  queries,
  filled,
  frozen,
}: {
  queries: QueryRow[];
  filled: Set<string>;
  frozen: boolean;
}) {
  if (queries.length === 0) return null;

  return (
    <div className={frozen ? "sweep-host relative mt-6 text-ink-2" : "relative mt-6"}>
      <div className="grid grid-cols-[3rem_repeat(6,minmax(0,1fr))] items-end gap-y-1 border-b border-rule pb-2">
        <span />
        {ENGINES.map((engine) => (
          <span
            key={engine.key}
            className="mono text-[9px] leading-none tracking-[0.10em] text-ink-2 [writing-mode:vertical-rl] sm:text-[10px] sm:[writing-mode:horizontal-tb]"
          >
            {engine.label.toUpperCase()}
          </span>
        ))}
      </div>

      {queries.map((query) => (
        <div
          key={query.id}
          className="grid grid-cols-[3rem_repeat(6,minmax(0,1fr))] items-center border-b border-rule py-1.5"
        >
          <span className="mono text-[11px] text-ink-2">{queryLabel(query.position)}</span>
          {ENGINES.map((engine) => {
            const isFilled = filled.has(cellKey(query.id, engine.key));
            if (isFilled) {
              return (
                <span key={engine.key} className="flex">
                  <span
                    className="anim-cell block size-[11px]"
                    style={{ backgroundColor: frozen ? "var(--ink-2)" : "var(--ink)" }}
                  />
                </span>
              );
            }
            return (
              <span key={engine.key} className="flex">
                {frozen ? (
                  <span className="mono text-[11px] leading-none text-ink-2">–</span>
                ) : (
                  <span
                    className="block size-[11px] border"
                    style={{ borderColor: "var(--rule-strong)" }}
                  />
                )}
              </span>
            );
          })}
        </div>
      ))}

      {frozen ? <span className="anim-sweep pointer-events-none absolute inset-x-0 top-0 h-px" /> : null}
    </div>
  );
}
