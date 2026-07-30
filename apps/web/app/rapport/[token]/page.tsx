import { notFound } from "next/navigation";
import { getDb, ENGINES, ENGINE_LABELS, type EngineId } from "@geo/core";
import { getReportData, type ScanRow } from "@/lib/scan-data";
import { BOOKING_URL } from "@/lib/constants";
import { scoreTone, TONE_VAR } from "@/lib/score";
import ScoreHero from "@/components/viz/ScoreHero";
import ShareOfVoice from "@/components/viz/ShareOfVoice";
import EngineBars from "@/components/viz/EngineBars";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "score", n: "01", label: "Score" },
  { id: "voix", n: "02", label: "Part de voix" },
  { id: "requetes", n: "03", label: "Requêtes" },
  { id: "verbatims", n: "04", label: "Verbatims" },
  { id: "sources", n: "05", label: "Sources" },
  { id: "actions", n: "06", label: "Actions" },
];

/** Surlignage des marques dans un verbatim — la cible et les rivaux se distinguent. */
function Highlighted({ text, target, rivals }: { text: string; target: string; rivals: string[] }) {
  const all = [target, ...rivals].filter(Boolean);
  if (all.length === 0) return <>{text}</>;
  const escaped = all.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((p, i) => {
        const low = p.toLowerCase();
        if (low === target.toLowerCase()) return <mark key={i} className="mark-brand">{p}</mark>;
        if (rivals.some((r) => r.toLowerCase() === low)) return <mark key={i} className="mark-rival">{p}</mark>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function SectionHead({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-4 border-b border-rule pb-3">
      <span className="tnum font-mono text-micro text-signal">{n}</span>
      <h2 className="font-editorial text-2xl text-ink">{title}</h2>
      {sub && <span className="ml-auto hidden font-mono text-xs text-ink-faint sm:block">{sub}</span>}
    </div>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getDb().from("scans").select("*").eq("report_token", token).maybeSingle();
  const scan = data as ScanRow | null;
  if (!scan || scan.status !== "done") notFound();

  const { queryTable, verbatims, perplexitySources, previous } = await getReportData(scan);
  const isComparison = previous != null;
  const score = scan.score ?? 0;
  const sov = scan.share_of_voice?.share ?? {};
  const rivals = Object.keys(sov).filter((b) => b !== scan.brand);

  const engineData = ENGINES.map((e: EngineId) => {
    const s = scan.score_detail?.byEngine?.[e];
    return {
      key: e,
      label: ENGINE_LABELS[e],
      score: s?.score ?? null,
      mentioned: s?.mentionedCount,
      total: s?.responses,
      previous: previous?.score_detail?.byEngine?.[e]?.score ?? null,
    };
  });

  const shareData = Object.entries(sov).map(([brand, share]) => ({
    brand,
    share: share as number,
    isTarget: brand === scan.brand,
    previous: previous?.share_of_voice?.share?.[brand] ?? null,
  }));

  const dateStr = new Date(scan.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-shell px-4 lg:px-8">
      {/* ── Masthead éditorial, calé à gauche ── */}
      <header className="border-b border-rule-strong pb-8 pt-12">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="label">Rapport de visibilité IA</span>
          {isComparison && (
            <span className="border border-signal px-2 py-px font-mono text-micro uppercase text-signal">
              Comparaison J+90
            </span>
          )}
        </div>
        <h1 className="mt-4 font-editorial text-hero text-ink">{scan.brand}</h1>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-xs sm:grid-cols-4">
          {[
            ["Secteur", scan.sector],
            ["Site", scan.url.replace(/^https?:\/\//, "")],
            ["Mesuré le", dateStr],
            ["Échantillon", `${queryTable.length} requêtes × 4 moteurs`],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="label">{k}</dt>
              <dd className="mt-1 truncate text-ink-dim">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="lg:flex lg:gap-16">
        {/* ── Rail de navigation, colonne étroite ── */}
        <nav className="no-print hidden w-40 shrink-0 lg:block">
          <ol className="sticky top-8 border-l border-rule pt-16">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px flex items-baseline gap-3 border-l border-transparent py-2 pl-4 font-mono text-xs text-ink-faint transition-colors duration-150 ease-sharp hover:border-signal hover:text-ink"
                >
                  <span className="tnum">{s.n}</span>
                  <span>{s.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0 flex-1">
          {/* ── 01 · Score ── */}
          <section id="score" className="scroll-mt-8 pt-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <ScoreHero score={score} previous={isComparison ? previous?.score : null} />
              <p className="border-l-2 pl-4 text-sm text-ink-dim" style={{ borderColor: TONE_VAR[scoreTone(score)] }}>
                {score < 40
                  ? `Sur ${queryTable.length} questions d'achat posées aux quatre moteurs, ${scan.brand} n'est presque jamais cité. Vos concurrents occupent l'espace de recommandation à votre place.`
                  : score < 70
                    ? `${scan.brand} apparaît dans une partie des réponses, sans s'imposer. La marge de progression porte surtout sur les requêtes comparatives.`
                    : `${scan.brand} est régulièrement cité et recommandé. L'enjeu devient la défense de cette position.`}
              </p>
            </div>
            <div className="mt-12">
              <p className="label mb-3">Détail par moteur</p>
              <EngineBars data={engineData} />
            </div>
          </section>

          {/* ── 02 · Part de voix ── */}
          <section id="voix" className="scroll-mt-8 pt-24">
            <SectionHead n="02" title="Part de voix" sub="mentions de la marque / mentions totales" />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <ShareOfVoice data={shareData} />
              <p className="text-sm text-ink-dim lg:pt-3">
                Chaque point de part de voix est une recommandation qui va à quelqu'un. Les barres neutres sont vos
                concurrents ; la vôtre est marquée{" "}
                <span className="font-mono" style={{ color: "var(--signal)" }}>▸</span>.
              </p>
            </div>
          </section>

          {/* ── 03 · Tableau dense ── */}
          <section id="requetes" className="scroll-mt-8 pt-24">
            <SectionHead n="03" title="Requête par requête" sub="ordre de citation dans chaque réponse" />
            <div className="overflow-x-auto border border-rule">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-paper-raised">
                    <th className="label border-b border-rule px-4 py-3 font-normal">Requête</th>
                    {ENGINES.map((e) => (
                      <th key={e} className="label border-b border-l border-rule px-3 py-3 font-normal">
                        {ENGINE_LABELS[e]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryTable.map((row, i) => {
                    const absent = ENGINES.every((e) => !(row.engines[e] ?? []).includes(scan.brand));
                    return (
                      <tr key={row.query} className={i % 2 ? "bg-paper-sunken" : undefined}>
                        <td className="border-b border-rule px-4 py-3 align-top">
                          <span className="font-mono text-xs text-ink">{row.query}</span>
                          {absent && (
                            <span className="ml-2 whitespace-nowrap font-mono text-micro uppercase text-signal">
                              absent
                            </span>
                          )}
                        </td>
                        {ENGINES.map((e) => {
                          const brands = row.engines[e];
                          return (
                            <td key={e} className="border-b border-l border-rule px-3 py-3 align-top">
                              {brands == null ? (
                                <span className="font-mono text-xs text-ink-faint">—</span>
                              ) : brands.length === 0 ? (
                                <span className="font-mono text-xs text-ink-faint">aucune</span>
                              ) : (
                                <ol className="space-y-1">
                                  {brands.map((b, idx) => (
                                    <li key={b} className="flex gap-2 font-mono text-xs">
                                      <span className="tnum text-ink-faint">{idx + 1}</span>
                                      <span className={b === scan.brand ? "" : "text-ink-dim"}
                                        style={b === scan.brand ? { color: "var(--signal)" } : undefined}>
                                        {b}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 04 · Verbatims ── */}
          <section id="verbatims" className="scroll-mt-8 pt-24">
            <SectionHead n="04" title="Ce que répondent les moteurs" sub="extraits bruts, non retouchés" />
            <div className="space-y-px bg-rule">
              {verbatims.map((v, i) => (
                <figure key={i} className="bg-ink px-4 py-6 sm:px-6">
                  <figcaption className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-micro uppercase text-ink-faint">{ENGINE_LABELS[v.engine]}</span>
                    <span className="font-mono text-xs text-ink">« {v.query} »</span>
                    {v.competitorOnly && (
                      <span className="border border-signal px-2 font-mono text-micro uppercase text-signal">
                        concurrent cité, pas vous
                      </span>
                    )}
                  </figcaption>
                  <blockquote className="border-l border-rule-strong pl-4 text-sm leading-relaxed text-ink-dim">
                    <Highlighted text={v.excerpt} target={scan.brand} rivals={rivals} />
                  </blockquote>
                </figure>
              ))}
              {verbatims.length === 0 && (
                <p className="bg-ink px-4 py-6 text-sm text-ink-faint">Aucun verbatim exploitable sur ce scan.</p>
              )}
            </div>
          </section>

          {/* ── 05 · Sources ── */}
          <section id="sources" className="scroll-mt-8 pt-24">
            <SectionHead n="05" title="Les sources qui font gagner vos concurrents" sub="citées par Perplexity" />
            <p className="mb-6 max-w-prose text-sm text-ink-dim">
              Sites sur lesquels Perplexity s'appuie dans les réponses où vos concurrents apparaissent. C'est la
              liste des endroits où il faut exister.
            </p>
            {perplexitySources.length === 0 ? (
              <p className="font-mono text-sm text-ink-faint">Aucune source concurrente détectée sur ce scan.</p>
            ) : (
              <ol className="border-t border-rule">
                {perplexitySources.map((s, i) => (
                  <li key={s.url} className="flex items-baseline gap-4 border-b border-rule py-3">
                    <span className="tnum font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 break-all font-mono text-xs text-ink transition-colors duration-150 ease-sharp hover:text-signal"
                    >
                      {s.url.replace(/^https?:\/\//, "")}
                    </a>
                    <span className="tnum shrink-0 font-mono text-micro text-ink-faint">
                      {s.competitors.join(" · ")} — {s.count}×
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ── 06 · Actions ── */}
          <section id="actions" className="scroll-mt-8 pt-24">
            <SectionHead n="06" title="Dix actions prioritaires" sub="classées par chantier" />
            <ol className="border-t border-rule">
              {(scan.actions ?? []).map((a, i) => (
                <li key={i} className="grid grid-cols-[40px_1fr] gap-4 border-b border-rule py-4 sm:grid-cols-[40px_180px_1fr]">
                  <span className="tnum font-mono text-sm text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="whitespace-nowrap font-mono text-micro uppercase text-ink-faint sm:pt-1">
                    Ch. {a.chantier} · {a.chantier === 1 ? "Technique" : a.chantier === 2 ? "Contenu" : "Citations"}
                  </span>
                  <span className="col-span-2 text-sm text-ink-dim sm:col-span-1">{a.action}</span>
                </li>
              ))}
              {(scan.actions ?? []).length === 0 && (
                <li className="py-4 text-sm text-ink-faint">Actions non générées pour ce scan.</li>
              )}
            </ol>
          </section>

          {/* ── CTA ── */}
          <section className="no-print mt-24 border border-signal">
            <div className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
              <div>
                <h2 className="font-editorial text-3xl text-ink">On regarde ces résultats ensemble ?</h2>
                <p className="mt-3 max-w-prose text-sm text-ink-dim">
                  Trente minutes, gratuit, sans engagement. On commente votre rapport requête par requête et on vous
                  dit exactement ce qu'un Sprint GEO changerait pour {scan.brand} — y compris si la réponse est
                  « rien, gardez votre argent ».
                </p>
              </div>
              <a href={BOOKING_URL} className="btn-signal inline-block whitespace-nowrap text-center">
                Réserver le call
              </a>
            </div>
          </section>

          <footer className="mt-16 border-t border-rule py-8 text-xs leading-relaxed text-ink-faint">
            <p className="max-w-prose">
              <strong className="text-ink-dim">Méthodologie.</strong> Mesure via les API officielles de ChatGPT,
              Claude, Gemini et Perplexity. Les réponses des interfaces grand public peuvent différer légèrement —
              la mesure est identique à chaque scan, donc strictement comparable dans le temps. Les requêtes sont
              archivées pour le re-scan J+90.
            </p>
            <p className="mt-4 font-mono text-micro uppercase">
              GEO Sprint · rapport généré le {dateStr}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
