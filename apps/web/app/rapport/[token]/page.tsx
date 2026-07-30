import { notFound } from "next/navigation";
import { getDb, ENGINES, ENGINE_LABELS, type EngineId } from "@geo/core";
import { getReportData, type ScanRow } from "@/lib/scan-data";
import { BOOKING_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Surligne les marques dans un texte (rendu React, pas de HTML injecté). */
function Highlighted({ text, brands }: { text: string; brands: string[] }) {
  if (brands.length === 0) return <>{text}</>;
  const escaped = brands.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        brands.some((b) => b.toLowerCase() === p.toLowerCase()) ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
      )}
    </>
  );
}

function Delta({ now, before }: { now: number; before: number | null | undefined }) {
  if (before == null) return null;
  const d = Math.round(now - before);
  if (d === 0) return <span className="ml-2 text-sm text-slate-400">=</span>;
  return <span className={`ml-2 text-sm font-semibold ${d > 0 ? "text-emerald-600" : "text-red-600"}`}>{d > 0 ? `+${d}` : d}</span>;
}

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getDb().from("scans").select("*").eq("report_token", token).maybeSingle();
  const scan = data as ScanRow | null;
  if (!scan || scan.status !== "done") notFound();

  const { queryTable, verbatims, perplexitySources, previous } = await getReportData(scan);
  const detail = scan.score_detail;
  const sov = scan.share_of_voice;
  const maxShare = Math.max(...Object.values(sov?.share ?? { x: 0.01 }), 0.01);
  const isComparison = previous != null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Rapport de visibilité IA{isComparison ? " — comparaison avant / après (J+90)" : ""}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{scan.brand}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {scan.sector} · scan du {new Date(scan.created_at).toLocaleDateString("fr-FR")}
          {isComparison && previous && ` · comparé au scan du ${new Date(previous.created_at).toLocaleDateString("fr-FR")}`}
        </p>
      </header>

      {/* 1. Score global + par moteur */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">1. Score de Visibilité IA</h2>
        <div className="mt-4 flex items-baseline">
          <span className="text-6xl font-extrabold text-accent">{scan.score}</span>
          <span className="text-2xl text-slate-400">/100</span>
          {isComparison && <Delta now={scan.score ?? 0} before={previous?.score} />}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {ENGINES.map((e: EngineId) => {
            const s = detail?.byEngine?.[e];
            const prev = previous?.score_detail?.byEngine?.[e];
            return (
              <div key={e} className="rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-sm text-slate-500">{ENGINE_LABELS[e]}</p>
                <p className="text-2xl font-bold">
                  {s?.score ?? "—"}
                  {isComparison && s && <Delta now={s.score} before={prev?.score} />}
                </p>
                <p className="text-xs text-slate-400">{s ? `${s.mentionedCount}/${s.responses} mentions` : "aucune donnée"}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Part de voix */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">2. Part de voix face aux concurrents</h2>
        <div className="mt-4 space-y-2">
          {Object.entries(sov?.share ?? {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([brand, share]) => {
              const prevShare = previous?.share_of_voice?.share?.[brand];
              return (
                <div key={brand} className="flex items-center gap-3">
                  <span className={`w-40 truncate text-sm ${brand === scan.brand ? "font-bold" : ""}`}>{brand}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className={`h-full rounded ${brand === scan.brand ? "bg-accent" : "bg-slate-400"}`}
                      style={{ width: `${((share as number) / maxShare) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-sm">
                    {Math.round((share as number) * 100)} %
                    {isComparison && prevShare != null && (
                      <Delta now={(share as number) * 100} before={prevShare * 100} />
                    )}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* 3. Tableau requête par requête */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">3. Détail requête par requête</h2>
        <p className="mt-1 text-sm text-slate-500">Qui est cité, dans quel ordre, pour chaque question posée aux 4 moteurs.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-left">
                <th className="py-2 pr-3">Requête</th>
                {ENGINES.map((e) => (
                  <th key={e} className="px-2 py-2">{ENGINE_LABELS[e]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryTable.map((row) => (
                <tr key={row.query} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3">{row.query}</td>
                  {ENGINES.map((e) => {
                    const brands = row.engines[e];
                    const hasBrand = (brands ?? []).includes(scan.brand);
                    return (
                      <td key={e} className={`px-2 py-2 text-xs ${hasBrand ? "text-emerald-700" : "text-slate-500"}`}>
                        {brands == null ? "—" : brands.length === 0 ? "aucune marque" : brands.map((b, i) => (
                          <span key={b}>{i > 0 && " → "}{b === scan.brand ? <strong>{b}</strong> : b}</span>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Verbatims */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">4. Ce que répondent réellement les IA</h2>
        <div className="mt-4 space-y-4">
          {verbatims.map((v, i) => (
            <div key={i} className={`rounded-xl border p-4 ${v.competitorOnly ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
              <p className="text-sm font-semibold">
                {ENGINE_LABELS[v.engine]} — « {v.query} »
                {v.competitorOnly && <span className="ml-2 rounded bg-amber-200 px-2 py-0.5 text-xs">concurrent cité, pas vous</span>}
              </p>
              <blockquote className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                <Highlighted text={v.excerpt} brands={v.brands} />
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Sources Perplexity */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">5. Les sources qui font gagner vos concurrents</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sites cités par Perplexity dans les réponses où vos concurrents apparaissent. Voilà où il faut être.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {perplexitySources.length === 0 && <li className="text-slate-500">Aucune source concurrente détectée sur ce scan.</li>}
          {perplexitySources.map((s) => (
            <li key={s.url} className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-2">
              <a href={s.url} className="break-all text-accent underline" target="_blank" rel="noopener noreferrer">{s.url}</a>
              <span className="shrink-0 text-xs text-slate-500">{s.competitors.join(", ")} · cité {s.count}×</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Actions prioritaires */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">6. Vos 10 actions prioritaires</h2>
        <ol className="mt-4 space-y-3">
          {(scan.actions ?? []).map((a, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
              <span>
                <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  Chantier {a.chantier} — {a.chantier === 1 ? "Technique" : a.chantier === 2 ? "Contenu" : "Citations"}
                </span>
                {a.action}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 7. CTA */}
      <section className="no-print mt-12 rounded-2xl bg-accent p-8 text-center text-white">
        <h2 className="text-2xl font-bold">On regarde ces résultats ensemble ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-indigo-100">
          Call de restitution gratuit de 30 minutes : on commente votre rapport, requête par requête, et on vous dit
          exactement ce que ferait un Sprint GEO pour {scan.brand}. Sans engagement.
        </p>
        <a href={BOOKING_URL} className="mt-4 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-accent">
          Réserver mon call de restitution
        </a>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
        <p>
          Méthodologie : mesure via les API officielles des 4 moteurs (ChatGPT, Claude, Gemini, Perplexity). Les
          réponses des interfaces grand public peuvent différer légèrement — la mesure est identique à chaque scan,
          donc strictement comparable dans le temps. Coût et requêtes archivés pour le re-scan J+90.
        </p>
      </footer>
    </main>
  );
}
