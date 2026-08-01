import { cn } from "@/lib/utils";
import { Etiquette, Label, Rule } from "@/components/kit";
import { MOTEURS, pourcent, NBSP } from "@/lib/typo";

export type Mention = {
  id: string;
  query_id: string;
  response_id: string;
  engine: string;
  brand: string;
  is_target: boolean;
  position: number | null;
  recommended: boolean;
  sentiment: string | null;
  verbatim: string | null;
};

export type Reponse = {
  id: string;
  query_id: string;
  engine: string;
  raw_text: string | null;
  sources: unknown;
  error: string | null;
};

export type Question = { id: string; rank: number; text: string; intent: string };

export const INTENTS: Record<string, string> = {
  comparative: "comparative",
  probleme: "problème",
  locale: "locale",
  confiance: "confiance",
};

/* ---------- Score : cadran monospace + écart éventuel ---------- */

export function ScoreGeant({
  score,
  verdict,
  ecart,
}: {
  score: number;
  verdict: string;
  ecart?: number | null;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
      <div className="num leading-[0.8] text-[112px] md:text-[152px]">{score}</div>
      <div className="pb-3">
        <Label>sur 100</Label>
        <div className="font-display text-[34px] leading-none">{verdict}</div>
        {typeof ecart === "number" ? (
          <div className="num mt-2 text-[13px] text-bordeaux">
            {ecart >= 0 ? "+" : "−"}
            {Math.abs(ecart)} pt depuis le scan initial
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ScoresMoteurs({
  scores,
  avant,
}: {
  scores: Record<string, number | null>;
  avant?: Record<string, number | null> | null;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {MOTEURS.map((m, i) => {
        const v = scores[m];
        const a = avant?.[m];
        return (
          <div
            key={m}
            className={cn("border-t border-rule py-4 pr-6", i > 0 && "lg:border-l lg:pl-5")}
          >
            <Label>{m}</Label>
            <div className="num mt-1 text-[38px] leading-none">
              {v === null || v === undefined ? "—" : v}
            </div>
            <div className="mt-3 h-1 w-full bg-paper-3">
              <div
                className="h-1 bg-ink"
                style={{ width: `${Math.max(1, Number(v ?? 0))}%` }}
                aria-hidden
              />
            </div>
            {typeof a === "number" && typeof v === "number" ? (
              <div className="num mt-2 text-[11px] text-ink-3">
                avant {a} → après {v}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Part de voix : focus + contexte ---------- */

export function PartDeVoix({
  items,
}: {
  items: { name: string; count: number; share: number; target: boolean }[];
}) {
  if (!items.length) return <Vide>Aucune marque détectée dans les réponses collectées.</Vide>;
  return (
    <div>
      {items.map((it) => (
        <div key={it.name} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule py-2.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "w-[150px] shrink-0 truncate text-[14px] md:w-[210px]",
                it.target ? "font-semibold text-bordeaux" : "text-ink-2",
              )}
            >
              {it.name}
              {it.target ? " ◂" : ""}
            </span>
            <span className="h-3 flex-1 bg-paper-2">
              <span
                className={cn("block h-3", it.target ? "bg-bordeaux" : "bg-rule-strong")}
                style={{ width: `${Math.max(1.5, it.share * 100)}%` }}
              />
            </span>
          </div>
          <span className="num text-[13px] tabular-nums text-ink-2">
            {pourcent(it.share * 100, 1)}
            <span className="text-ink-3">{NBSP}·{NBSP}{it.count}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Tableau requête par requête ---------- */

export function TableauRequetes({
  questions,
  reponses,
  mentions,
  marque,
}: {
  questions: Question[];
  reponses: Reponse[];
  mentions: Mention[];
  marque: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-y border-rule-strong">
            <th className="label-xs w-8 py-2 text-left align-bottom">nº</th>
            <th className="label-xs py-2 text-left align-bottom">question</th>
            <th className="label-xs w-24 py-2 text-left align-bottom">intention</th>
            {MOTEURS.map((m) => (
              <th key={m} className="label-xs w-[110px] py-2 text-left align-bottom">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className="border-b border-rule align-top">
              <td className="num py-2 pr-2 text-[11px] text-ink-3">
                {String(q.rank).padStart(2, "0")}
              </td>
              <td className="max-w-[340px] py-2 pr-4 leading-snug">{q.text}</td>
              <td className="num py-2 pr-3 text-[11px] text-ink-3">{INTENTS[q.intent] ?? q.intent}</td>
              {MOTEURS.map((m) => {
                const rep = reponses.find((r) => r.query_id === q.id && r.engine === m);
                const cell = mentions.filter((x) => x.query_id === q.id && x.engine === m);
                const cible = cell.find((x) => x.is_target);
                if (!rep || rep.error)
                  return (
                    <td key={m} className="num py-2 pr-3 text-[11px] text-ink-3">
                      n. d.
                    </td>
                  );
                return (
                  <td key={m} className="py-2 pr-3">
                    {cible ? (
                      <span className="num text-[12px]">
                        {marque} <span className="text-ink-3">#{cible.position ?? "?"}</span>
                        {cible.recommended ? <span className="text-bordeaux"> ✓reco</span> : null}
                      </span>
                    ) : (
                      <span className="num text-[12px] text-bordeaux">absent</span>
                    )}
                    <div className="mt-0.5 text-[11px] leading-tight text-ink-3">
                      {cell
                        .filter((x) => !x.is_target)
                        .slice(0, 3)
                        .map((x) => x.brand)
                        .join(", ") || "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Verbatims ---------- */

export function Verbatims({ mentions, marque }: { mentions: Mention[]; marque: string }) {
  const items = mentions.filter((m) => m.verbatim && m.verbatim.length > 40).slice(0, 5);
  if (!items.length) return <Vide>Aucun extrait exploitable n'a été collecté.</Vide>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((m) => (
        <figure key={m.id} className="avoid-break border-t border-rule-strong pt-3">
          <blockquote className="font-display text-[21px] leading-[1.3]">
            <Surligne texte={m.verbatim ?? ""} marque={m.brand} cible={marque} />
          </blockquote>
          <figcaption className="num mt-3 text-[11px] text-ink-3">
            {m.engine} · marque citée : {m.brand}
            {m.is_target ? "" : " (concurrent)"}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Surligne({ texte, marque, cible }: { texte: string; marque: string; cible: string }) {
  const cles = [marque, cible].filter(Boolean);
  const re = new RegExp(`(${cles.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {texte.split(re).map((part, i) =>
        cles.some((c) => c.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={i}
            className={cn(
              "bg-highlight px-0.5",
              part.toLowerCase() === cible.toLowerCase() && "bg-bordeaux-wash text-bordeaux",
            )}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* ---------- Sources Perplexity ---------- */

export function Sources({ reponses }: { reponses: Reponse[] }) {
  const compte = new Map<string, number>();
  for (const r of reponses) {
    if (r.engine !== "Perplexity") continue;
    const list = Array.isArray(r.sources) ? (r.sources as { url: string }[]) : [];
    for (const s of list) {
      if (!s?.url) continue;
      let hote = s.url;
      try {
        hote = new URL(s.url).hostname.replace(/^www\./, "");
      } catch {
        /* URL non analysable : on garde la chaîne brute */
      }
      compte.set(hote, (compte.get(hote) ?? 0) + 1);
    }
  }
  const items = [...compte.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  if (!items.length)
    return <Vide>Perplexity n'a renvoyé aucune source sur cet échantillon (moteur non interrogé ou sans citation).</Vide>;
  return (
    <ol className="grid gap-x-10 md:grid-cols-2">
      {items.map(([hote, n], i) => (
        <li key={hote} className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
          <span className="flex items-baseline gap-3">
            <span className="num text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[14px]">{hote}</span>
          </span>
          <span className="num text-[12px] text-ink-3">{n} citation{n > 1 ? "s" : ""}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Actions ---------- */

export function Actions({
  actions,
}: {
  actions: { chantier: string; titre: string; pourquoi: string; effort: string }[];
}) {
  if (!actions.length) return <Vide>Les actions seront calculées à la fin du scan.</Vide>;
  const chantiers = [...new Set(actions.map((a) => a.chantier))];
  return (
    <div className="grid gap-10 md:grid-cols-3">
      {chantiers.map((c) => (
        <div key={c} className="avoid-break">
          <Label className="pb-2">{c}</Label>
          <Rule strong />
          {actions
            .filter((a) => a.chantier === c)
            .map((a, i) => (
              <div key={i} className="border-b border-rule py-3">
                <div className="text-[15px] font-medium leading-snug">{a.titre}</div>
                <p className="mt-1 text-[13px] leading-snug text-ink-2">{a.pourquoi}</p>
                <div className="num mt-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-3">
                  effort {a.effort}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

export function Vide({ children }: { children: React.ReactNode }) {
  return <p className="border-l-2 border-rule-strong py-1 pl-4 text-[14px] text-ink-3">{children}</p>;
}

export function LimiteMethodologique() {
  return (
    <div className="max-w-[62ch] border-t border-rule-strong pt-3">
      <Etiquette>limite assumée</Etiquette>
      <p className="mt-2 text-[13px] leading-snug text-ink-2">
        Les mesures sont obtenues via les API officielles des six moteurs. Elles ne reproduisent pas
        exactement l’expérience d’un utilisateur connecté à l’interface grand public (personnalisation,
        historique, position géographique). Aucun scraping n’est pratiqué. Les résultats sont comparables
        entre eux dans le temps, puisque l’échantillon de questions est figé.
      </p>
    </div>
  );
}
