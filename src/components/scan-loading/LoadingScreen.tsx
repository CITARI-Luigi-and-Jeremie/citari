import { useEffect, useMemo, useRef, useState } from "react";
import { ENGINE_LABEL } from "@/lib/scan-result";
import type { ScanLive } from "@/lib/scan-live.server";
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

type Props = { live: ScanLive; unstable: boolean };

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

export function LoadingScreen({ live, unstable }: Props) {
  const { scan, queries, meta, engines, locked, total, collectees, progression } = live;
  const elapsed = useElapsed(scan.started_at);
  const scoring = scan.status === "scoring";

  const filled = useMemo(() => {
    const set = new Set<string>();
    for (const row of meta) set.add(cellKey(row.query_id, row.engine));
    return set;
  }, [meta]);

  const ticker = useMemo(() => meta.slice(-3).reverse(), [meta]);

  // Titre d'onglet : compteur réel.
  useEffect(() => {
    if (scan.status !== "running" || total === 0) return;
    const previous = document.title;
    document.title = `${collectees}/${total} — Citari`;
    return () => {
      document.title = previous;
    };
  }, [collectees, total, scan.status]);

  // Acte 3 : les labels de phase s'allument successivement.
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
        ? `INTERROGATION DES MOTEURS — ${engines.length} INTERROGÉS`
        : PHASE_LABELS.generating_queries;

  // Progression : questions écrites en base pendant l'acte 1, cellules ensuite.
  const ratio = scan.status === "generating_queries" ? 0 : progression;

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
                RÉPONSES COLLECTÉES {collectees}/{total}
              </span>
              <span>{formatElapsed(elapsed)}</span>
            </div>

            <div className="progress-rail mt-3" aria-hidden>
              <span className="progress-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>

            <PunchCard
              queries={queries}
              engines={engines}
              locked={locked}
              filled={filled}
              frozen={scoring}
            />

            {locked.length > 0 ? (
              <p className="mono mt-4 text-[12px] tracking-[0.10em] text-ink-2">
                ▢ {locked.length} MOTEURS VERROUILLÉS — SCAN COMPLET
              </p>
            ) : null}

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
                  : ticker.map((row) => tickerLine(row)).join("   /   ")}
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

function tickerLine(row: MetaRow) {
  const label = ENGINE_LABEL[row.engine] ?? row.engine;
  return `${label.toUpperCase()} · ${formatLatency(row.latency_ms)}`;
}

/**
 * ACTE 1 — cascade des vraies questions.
 * Une question déjà affichée ne re-anime jamais : seules les nouvelles tombent.
 */
function QueryCascade({ queries }: { queries: QueryRow[] }) {
  const seen = useRef<Set<string>>(new Set());
  const fresh: string[] = [];
  for (const query of queries) {
    if (!seen.current.has(query.id)) fresh.push(query.id);
  }
  useEffect(() => {
    for (const query of queries) seen.current.add(query.id);
  }, [queries]);

  if (queries.length === 0) {
    return (
      <p className="mono mt-12 text-[13px] text-ink-2">
        Les questions de vos acheteurs s'écrivent…
      </p>
    );
  }

  return (
    <ul className="mt-12 border-t border-rule">
      {queries.map((query) => {
        const index = fresh.indexOf(query.id);
        const isNew = index !== -1;
        return (
          <li
            key={query.id}
            className={`flex items-baseline gap-4 border-b border-rule py-3${
              isNew ? " anim-step" : ""
            }`}
            style={isNew ? { animationDelay: `${index * 110}ms` } : undefined}
          >
            <span className="mono shrink-0 text-[12px] text-ink-2">
              {queryLabel(query.position)}
            </span>
            <span className="measure">{query.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** ACTE 2 / 3 — grille type carte perforée : une ligne par question, colonnes déduites. */
function PunchCard({
  queries,
  engines,
  locked,
  filled,
  frozen,
}: {
  queries: QueryRow[];
  engines: string[];
  locked: string[];
  filled: Set<string>;
  frozen: boolean;
}) {
  if (queries.length === 0) return null;

  const columns = [
    ...engines.map((key) => ({ key, locked: false })),
    ...locked.map((key) => ({ key, locked: true })),
  ];
  const template = `3rem repeat(${columns.length}, minmax(0,1fr))`;

  return (
    <div className={frozen ? "sweep-host relative mt-6 text-ink-2" : "relative mt-6"}>
      <div
        className="grid items-end gap-y-1 border-b border-rule pb-2"
        style={{ gridTemplateColumns: template }}
      >
        <span />
        {columns.map((column) => (
          <span
            key={column.key}
            className={`mono text-[9px] leading-none tracking-[0.10em] text-ink-2 [writing-mode:vertical-rl] sm:text-[10px] sm:[writing-mode:horizontal-tb]${
              column.locked ? " locked-col" : ""
            }`}
          >
            {(ENGINE_LABEL[column.key] ?? column.key).toUpperCase()}
            {column.locked ? " ▢" : ""}
          </span>
        ))}
      </div>

      {queries.map((query) => (
        <div
          key={query.id}
          className="grid items-center border-b border-rule py-1.5"
          style={{ gridTemplateColumns: template }}
        >
          <span className="mono text-[11px] text-ink-2">{queryLabel(query.position)}</span>
          {columns.map((column) => {
            if (column.locked) {
              return (
                <span key={column.key} className="locked-col flex">
                  <span
                    className="block h-px w-[11px]"
                    style={{ backgroundColor: "var(--rule-strong)" }}
                  />
                </span>
              );
            }
            if (filled.has(cellKey(query.id, column.key))) {
              return (
                <span key={column.key} className="flex">
                  <span
                    className="anim-cell block size-[11px]"
                    style={{ backgroundColor: frozen ? "var(--ink-2)" : "var(--ink)" }}
                  />
                </span>
              );
            }
            return (
              <span key={column.key} className="flex">
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

      {frozen ? (
        <span className="anim-sweep pointer-events-none absolute inset-x-0 top-0 h-px" />
      ) : null}
    </div>
  );
}
