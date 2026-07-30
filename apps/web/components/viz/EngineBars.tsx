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
 * Score par moteur. Quatre valeurs comparables : une jauge verticale fine par moteur,
 * chiffre en monospace systématiquement présent sous la jauge (encodage secondaire).
 */
export default function EngineBars({ data }: { data: EngineDatum[] }) {
  return (
    <div className="grid grid-cols-2 border-l border-t border-rule sm:grid-cols-4">
      {data.map((d) => {
        const tone = d.score == null ? "neutral" : scoreTone(d.score);
        const h = d.score == null ? 0 : Math.max(2, d.score);
        const delta = d.previous != null && d.score != null ? d.score - d.previous : null;
        return (
          <div key={d.key} className="border-b border-r border-rule p-4">
            <p className="label">{d.label}</p>
            <div className="mt-3 flex items-end gap-3">
              {/* Jauge : hauteur = score, piste visible même à 0 */}
              <div className="flex h-12 w-3 shrink-0 items-end bg-track" aria-hidden>
                <div style={{ height: `${h}%`, background: TONE_VAR[tone], width: "100%" }} />
              </div>
              <div className="min-w-0">
                <p className="tnum font-mono text-2xl leading-none" style={{ color: TONE_VAR[tone] }}>
                  {d.score ?? "—"}
                  {delta != null && delta !== 0 && (
                    <span className={`ml-2 text-sm ${delta > 0 ? "text-valid" : "text-signal"}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </p>
                {d.total != null && (
                  <p className="tnum mt-2 font-mono text-xs text-bone-faint">
                    {d.mentioned}/{d.total} mentions
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
