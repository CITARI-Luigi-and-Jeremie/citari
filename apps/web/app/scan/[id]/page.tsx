"use client";

import { use, useEffect, useState } from "react";

const ENGINE_LABELS: Record<string, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

const STAGES: Record<string, string> = {
  pending: "Préparation du scan…",
  generating_queries: "Génération des questions que posent vos prospects…",
  running: "Interrogation de ChatGPT, Claude, Gemini et Perplexity…",
  scoring: "Analyse des mentions et calcul du score…",
};

interface Teaser {
  brand: string;
  score: number;
  byEngine: Record<string, number>;
  shareOfVoice: Record<string, number>;
  verbatim: { query: string; engine: string; excerpt: string; brands: string[]; competitorOnly: boolean } | null;
  emailCaptured: boolean;
}

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("pending");
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
        setStatus(data.status);
        setProgress(data.progress ?? 0);
        if (data.status === "error") {
          setScanError(data.error ?? "Erreur pendant le scan");
          clearInterval(timer);
        }
        if (data.status === "done") {
          setTeaser(data.teaser);
          clearInterval(timer);
        }
      } catch (e) {
        // Un hoquet réseau ne doit pas tuer la page — on abandonne après 5 échecs d'affilée
        if (++consecutiveErrors >= 5) {
          setScanError(e instanceof Error ? e.message : "Erreur réseau");
          clearInterval(timer);
        }
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [id]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {!teaser && !scanError && (
        <div className="text-center">
          <h1 className="text-2xl font-bold">Scan en cours</h1>
          <p className="mt-2 text-slate-600">{STAGES[status] ?? "…"}</p>
          <div className="mt-8 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${Math.max(progress, 3)}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{progress} %</p>
        </div>
      )}

      {scanError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-xl font-bold text-red-700">Le scan a échoué</h1>
          <p className="mt-2 text-sm text-red-600">{scanError}</p>
          <a href="/" className="mt-4 inline-block text-sm underline">Réessayer</a>
        </div>
      )}

      {teaser && <TeaserView id={id} teaser={teaser} />}
    </main>
  );
}

function TeaserView({ id, teaser }: { id: string; teaser: Teaser }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxShare = Math.max(...Object.values(teaser.shareOfVoice), 0.01);

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
    <div>
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">Score de Visibilité IA</p>
        <p className={`mt-1 text-7xl font-extrabold ${teaser.score < 40 ? "text-red-600" : teaser.score < 70 ? "text-amber-500" : "text-emerald-600"}`}>
          {teaser.score}<span className="text-3xl text-slate-400">/100</span>
        </p>
        <p className="mt-2 text-slate-600">
          {teaser.brand} — mesuré sur ChatGPT, Claude, Gemini et Perplexity
        </p>
        <div className="mt-4 flex justify-center gap-4 text-sm text-slate-500">
          {Object.entries(teaser.byEngine).map(([e, s]) => (
            <span key={e}>{ENGINE_LABELS[e] ?? e} : <strong>{s}</strong></span>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-semibold">Part de voix face à vos concurrents</h2>
        <div className="mt-3 space-y-2">
          {Object.entries(teaser.shareOfVoice)
            .sort(([, a], [, b]) => b - a)
            .map(([brand, share]) => (
              <div key={brand} className="flex items-center gap-3">
                <span className={`w-36 truncate text-sm ${brand === teaser.brand ? "font-bold" : ""}`}>{brand}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                  <div
                    className={`h-full rounded ${brand === teaser.brand ? "bg-accent" : "bg-slate-400"}`}
                    style={{ width: `${(share / maxShare) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm">{Math.round(share * 100)} %</span>
              </div>
            ))}
        </div>
      </div>

      {teaser.verbatim && (
        <div className="mt-10 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            {teaser.verbatim.competitorOnly
              ? `Quand on demande à ${ENGINE_LABELS[teaser.verbatim.engine] ?? teaser.verbatim.engine} : « ${teaser.verbatim.query} » — un concurrent est cité, pas vous :`
              : `Réponse de ${ENGINE_LABELS[teaser.verbatim.engine] ?? teaser.verbatim.engine} à « ${teaser.verbatim.query} » :`}
          </p>
          <blockquote className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{teaser.verbatim.excerpt}</blockquote>
        </div>
      )}

      <div className="mt-10 rounded-2xl border-2 border-accent p-6">
        {!sent ? (
          <>
            <h2 className="text-lg font-bold">Recevez le rapport complet gratuit</h2>
            <p className="mt-1 text-sm text-slate-600">
              Détail requête par requête, verbatims complets, sources citées par Perplexity pour vos concurrents, et
              vos 10 actions prioritaires. Par email, avec le PDF.
            </p>
            <form onSubmit={submitEmail} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
              <button disabled={sending} className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                {sending ? "Envoi…" : "Recevoir"}
              </button>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-lg font-bold text-emerald-700">Rapport envoyé ✓</h2>
            <p className="mt-1 text-sm text-slate-600">Vérifiez votre boîte mail — ou consultez-le directement :</p>
            <a href={sent} className="mt-3 inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dark">
              Voir mon rapport complet
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
