"use client";

import { use, useEffect, useRef, useState } from "react";
import ScoreHero from "@/components/viz/ScoreHero";
import ShareOfVoice from "@/components/viz/ShareOfVoice";
import { BOOKING_URL } from "@/lib/constants";

const ENGINE_LABELS: Record<string, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

const PHASES: { key: string; label: string }[] = [
  { key: "pending", label: "Initialisation" },
  { key: "generating_queries", label: "Génération des questions d’achat" },
  { key: "running", label: "Interrogation des 4 moteurs" },
  { key: "scoring", label: "Analyse des mentions et scoring" },
  { key: "done", label: "Terminé" },
];

interface Teaser {
  brand: string;
  score: number;
  byEngine: Record<string, number>;
  shareOfVoice: Record<string, number>;
  verbatim: { query: string; engine: string; excerpt: string; brands: string[]; competitorOnly: boolean } | null;
  emailCaptured: boolean;
}

interface Progress {
  status: string;
  progress: number;
  queries: number;
  queryTexts: string[];
  responses: number;
  expected: number;
}

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<Progress>({
    status: "pending",
    progress: 0,
    queries: 0,
    queryTexts: [],
    responses: 0,
    expected: 0,
  });
  const [scanError, setScanError] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<Teaser | null>(null);

  useEffect(() => {
    let consecutiveErrors = 0;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/scan/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        consecutiveErrors = 0;
        if (data.status === "error") {
          setScanError(data.error ?? "Erreur pendant le scan");
          clearInterval(timer);
          return;
        }
        if (data.status === "done") {
          setTeaser(data.teaser);
          setP((prev) => ({ ...prev, status: "done", progress: 100 }));
          clearInterval(timer);
          return;
        }
        setP({
          status: data.status,
          progress: data.progress ?? 0,
          queries: data.queries ?? 0,
          queryTexts: data.queryTexts ?? [],
          responses: data.responses ?? 0,
          expected: data.expected ?? 0,
        });
      } catch (e) {
        if (++consecutiveErrors >= 5) {
          setScanError(e instanceof Error ? e.message : "Erreur réseau");
          clearInterval(timer);
        }
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [id]);

  return (
    <div className="mx-auto max-w-shell px-4 lg:px-8">
      {!teaser && !scanError && <Progress p={p} />}
      {scanError && (
        <div className="border-l-2 border-signal py-24 pl-6">
          <p className="label">Échec</p>
          <h1 className="mt-4 font-editorial text-3xl text-ink">Le scan n’a pas abouti</h1>
          <p className="mt-3 max-w-prose font-mono text-sm text-signal">{scanError}</p>
          <a href="/" className="btn-ghost mt-8 inline-block">Relancer un scan</a>
        </div>
      )}
      {teaser && <TeaserView id={id} teaser={teaser} />}
    </div>
  );
}

/** Le moment de théâtre : compteur réel de réponses collectées, phases qui s’allument. */
function Progress({ p }: { p: Progress }) {
  const phaseIndex = PHASES.findIndex((x) => x.key === p.status);
  const engines = Object.keys(ENGINE_LABELS);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((v) => v + 1), 420);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="py-24 lg:py-32">
      <p className="label">Scan en cours</p>

      <div className="mt-8 flex items-start gap-4">
        <span className="tnum font-mono text-score font-medium text-ink">{p.progress}</span>
        <span className="mt-6 font-mono text-lg text-ink-faint">%</span>
      </div>

      {/* Filet de progression pleine largeur */}
      <div className="mt-8 h-px w-full bg-track">
        <div
          className="h-px bg-signal transition-all duration-500 ease-sharp"
          style={{ width: `${Math.max(2, p.progress)}%` }}
        />
      </div>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Phases réelles */}
          <ol className="border-t border-rule">
            {PHASES.slice(0, 4).map((phase, i) => {
              const state = i < phaseIndex ? "done" : i === phaseIndex ? "running" : "pending";
              return (
                <li key={phase.key} className="flex items-baseline gap-4 border-b border-rule py-4">
                  <span
                    className="tnum font-mono text-xs"
                    style={{ color: state === "pending" ? "var(--ink-faint)" : "var(--signal)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`font-mono text-sm ${state === "pending" ? "text-ink-faint" : "text-ink"}`}>
                    {phase.label}
                  </span>
                  <span
                    className="ml-auto font-mono text-micro uppercase"
                    style={{
                      color:
                        state === "done" ? "var(--valid)" : state === "running" ? "var(--signal)" : "var(--ink-faint)",
                    }}
                  >
                    {state === "done" ? "ok" : state === "running" ? "en cours" : "—"}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Les VRAIES questions générées pour ce scan. Rien n'est simulé :
              elles apparaissent au fur et à mesure que la base les enregistre,
              et c'est ce qui rend l'attente intéressante. */}
          {p.queryTexts.length > 0 && (
            <div className="mt-12">
              <p className="label">Questions posées à vos quatre moteurs</p>
              <ol className="mt-4 border-t border-rule">
                {p.queryTexts.map((q, i) => (
                  <li
                    key={q}
                    className="animate-rise flex items-baseline gap-4 border-b border-rule py-3"
                    style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                  >
                    <span className="tnum font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-mono text-xs text-ink-dim">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Compteurs réels, aucun chiffre simulé */}
        <div className="border border-rule p-6">
          <p className="label">Collecte</p>
          <p className="tnum mt-4 font-mono text-3xl text-ink">
            {p.responses}
            <span className="text-ink-faint">{p.expected > 0 ? ` / ${p.expected}` : ""}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-ink-faint">réponses enregistrées</p>

          <div className="mt-8 space-y-2">
            {engines.map((e, i) => {
              const active = p.status === "running" && tick % engines.length === i;
              return (
                <div key={e} className="flex items-center gap-3">
                  <span
                    className="h-px flex-1 transition-colors duration-200 ease-sharp"
                    style={{ background: active ? "var(--signal)" : "var(--rule)" }}
                  />
                  <span
                    className="w-24 text-right font-mono text-xs transition-colors duration-200 ease-sharp"
                    style={{ color: active ? "var(--signal)" : "var(--ink-faint)" }}
                  >
                    {ENGINE_LABELS[e]}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-8 border-t border-rule pt-4 text-xs leading-relaxed text-ink-faint">
            {p.queries > 0
              ? `${p.queries} questions d’intention d’achat sont posées à chacun des quatre moteurs, via leurs API officielles.`
              : "Génération des questions à partir de votre secteur et du contenu de votre site."}
          </p>
        </div>
      </div>
    </div>
  );
}

function TeaserView({ id, teaser }: { id: string; teaser: Teaser }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);

  const shareData = Object.entries(teaser.shareOfVoice).map(([brand, share]) => ({
    brand,
    share,
    isTarget: brand === teaser.brand,
  }));

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(data.reportUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSending(false);
    }
  }

  return (
    <div ref={top} className="animate-rise py-16 lg:py-24">
      <p className="label">Résultat · {teaser.brand}</p>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div>
          <ScoreHero score={teaser.score} />
          <div className="mt-12 grid grid-cols-2 border-l border-t border-rule sm:grid-cols-4">
            {Object.entries(teaser.byEngine).map(([e, s]) => (
              <div key={e} className="border-b border-r border-rule p-4">
                <p className="label">{ENGINE_LABELS[e] ?? e}</p>
                <p className="tnum mt-2 font-mono text-2xl text-ink">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Part de voix</p>
          <div className="mt-4">
            <ShareOfVoice data={shareData} />
          </div>
        </div>
      </div>

      {teaser.verbatim && (
        <figure className="mt-16 border-l-2 border-signal pl-6">
          <figcaption className="label">
            {teaser.verbatim.competitorOnly
              ? `${ENGINE_LABELS[teaser.verbatim.engine] ?? teaser.verbatim.engine} — concurrent cité, pas vous`
              : ENGINE_LABELS[teaser.verbatim.engine] ?? teaser.verbatim.engine}
          </figcaption>
          <p className="mt-3 font-mono text-sm text-ink">« {teaser.verbatim.query} »</p>
          <blockquote className="mt-4 max-w-prose text-sm leading-relaxed text-ink-dim">
            {teaser.verbatim.excerpt}
          </blockquote>
        </figure>
      )}

      {/* Capture email */}
      <section className="mt-24 border border-rule-strong">
        {!sent ? (
          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_400px] lg:items-center lg:p-12">
            <div>
              <h2 className="font-editorial text-2xl text-ink">Le rapport complet, gratuit</h2>
              <p className="mt-3 max-w-prose text-sm text-ink-dim">
                Détail requête par requête sur les quatre moteurs, verbatims complets, sources citées par Perplexity
                pour vos concurrents, et vos dix actions prioritaires. Envoyé par email avec le PDF.
              </p>
            </div>
            <form onSubmit={submitEmail} className="space-y-3">
              <label className="block">
                <span className="label">Votre email</span>
                <input
                  type="email"
                  required
                  placeholder="vous@entreprise.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field mt-2"
                />
              </label>
              <button disabled={sending} className="btn-signal w-full">
                {sending ? "Envoi…" : "Recevoir le rapport"}
              </button>
              {error && <p className="font-mono text-xs text-signal">{error}</p>}
              <p className="text-xs leading-relaxed text-ink-faint">
                Votre email sert à vous envoyer ce rapport et, éventuellement, un suivi commercial. Désinscription en
                un clic.{" "}
                <a className="underline hover:text-ink" href="/confidentialite" target="_blank">
                  Politique de confidentialité
                </a>
                .
              </p>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-6 p-8 lg:p-12">
            <div>
              <p className="label" style={{ color: "var(--valid)" }}>Rapport envoyé</p>
              <h2 className="mt-3 font-editorial text-2xl text-ink">Vérifiez votre boîte mail</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={sent} className="btn-signal">Ouvrir le rapport</a>
              <a href={BOOKING_URL} className="btn-ghost">Réserver un call</a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
