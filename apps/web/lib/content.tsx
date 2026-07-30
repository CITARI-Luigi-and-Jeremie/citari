import type { ReactNode } from "react";
import { BOOKING_URL } from "./constants";

/** Mise en page commune des pages de contenu (format « réponse directe »). */
export function ArticleLayout({
  title,
  answer,
  updated,
  children,
}: {
  title: string;
  answer: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <a href="/" className="text-sm text-slate-500 hover:text-accent">← GEO Sprint</a>
      <h1 className="mt-4 text-4xl font-extrabold leading-tight">{title}</h1>
      {/* Réponse directe en tête : les 2 premières phrases répondent à la requête. */}
      <p className="mt-4 rounded-xl border-l-4 border-accent bg-accent-light/50 p-4 text-lg">{answer}</p>
      <p className="mt-3 text-xs text-slate-400">Mis à jour le {updated} · GEO Sprint</p>
      <div className="prose-geo mt-8 space-y-6">{children}</div>

      <section className="mt-12 rounded-2xl bg-accent p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Testez votre visibilité IA gratuitement</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-indigo-100">
          Score 0-100 sur ChatGPT, Claude, Gemini et Perplexity, part de voix face à vos concurrents et réponses
          réelles. 90 secondes, sans inscription.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a href="/" className="rounded-lg bg-white px-6 py-3 font-semibold text-accent">Lancer mon scan gratuit</a>
          <a href={BOOKING_URL} className="rounded-lg border border-white/60 px-6 py-3 font-semibold">Réserver un call</a>
        </div>
      </section>
    </main>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="pt-4 text-2xl font-bold">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg font-semibold">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-slate-700">{children}</p>;
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1.5 text-slate-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 align-top">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-4 text-slate-700">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** FAQ rendue + JSON-LD FAQPage correspondant (le site est sa propre démo GEO). */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <H2>Questions fréquentes</H2>
      <div className="space-y-3">
        {items.map((f) => (
          <details key={f.q} className="rounded-xl border border-slate-200 p-4">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-2 text-slate-700">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export function articleJsonLd(opts: { title: string; description: string; slug: string; updated: string }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    dateModified: opts.updated,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}${opts.slug}` },
    author: { "@type": "Organization", name: "GEO Sprint", url: base },
    publisher: { "@type": "Organization", name: "GEO Sprint", url: base },
  };
}

export function Sources({ items }: { items: { label: string; url: string }[] }) {
  return (
    <>
      <H2>Sources</H2>
      <ul className="ml-5 list-disc space-y-1 text-sm text-slate-600">
        {items.map((s) => (
          <li key={s.url}>
            <a className="text-accent underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
