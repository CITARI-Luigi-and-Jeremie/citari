import { scoreTone, TONE_VAR } from "@/lib/score";

export interface EngineDatum {
  key: string;
  label: string;
  score: number | null;
  mentioned?: number;
  total?: number;
  previous?: number | null;
}

/**
 * Score par moteur. Barre horizontale pleine largeur sous le chiffre : à des
 * scores bas, une jauge verticale n'est qu'une piste vide — la barre horizontale
 * reste lisible comme une mesure. Le chiffre est toujours présent (encodage
 * secondaire : la couleur n'est jamais seule).
 */
export default function EngineBars({ data }: { data: EngineDatum[] }) {
  return (
    <div className="grid grid-cols-1 border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
      {data.map((d) => {
        const tone = d.score == null ? "neutral" : scoreTone(d.score);
        const w = d.score == null ? 0 : Math.max(1.5, d.score);
        const delta = d.previous != null && d.score != null ? d.score - d.previous : null;
        return (
          <div key={d.key} className="border-b border-rule px-4 py-4 sm:border-r sm:last:border-r-0 lg:px-6">
            <div className="flex items-baseline justify-between gap-2">
              <span className="label">{d.label}</span>
              {delta != null && delta !== 0 && (
                <span className="tnum font-mono text-xs" style={{ color: delta > 0 ? "var(--valid)" : "var(--signal)" }}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>

            <p className="tnum mt-3 font-mono text-3xl leading-none" style={{ color: TONE_VAR[tone] }}>
              {d.score ?? "—"}
            </p>

            {/* Piste pleine largeur : la part vide est aussi une information */}
            <div className="mt-3 h-2 w-full bg-track" aria-hidden>
              <div className="h-full" style={{ width: `${w}%`, background: TONE_VAR[tone] }} />
            </div>

            {d.total != null && (
              <p className="tnum mt-2 font-mono text-xs text-ink-faint">
                {d.mentioned}/{d.total} mentions
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
