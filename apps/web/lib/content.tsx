import type { ReactNode } from "react";
import { BOOKING_URL } from "./constants";

/**
 * Mise en page des pages éditoriales (DESIGN.md §5) : grille asymétrique,
 * rail de métadonnées à gauche, colonne de texte étroite et lisible.
 */
export function ArticleLayout({
  title,
  answer,
  updated,
  kicker,
  children,
}: {
  title: string;
  answer: string;
  updated: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-shell px-4 lg:px-8">
      <header className="flex items-baseline justify-between border-b border-rule py-6">
        <a href="/" className="font-mono text-sm tracking-wider text-ink transition-colors duration-150 ease-sharp hover:text-signal">
          GEO&nbsp;SPRINT
        </a>
        <a href="/" className="label transition-colors duration-150 ease-sharp hover:text-ink">
          Scan gratuit
        </a>
      </header>

      <div className="py-16 lg:py-24">
        <p className="label">{kicker ?? "Guide"}</p>
        <h1 className="mt-6 max-w-[18ch] font-editorial text-hero text-ink">{title}</h1>
        {/* Réponse directe en tête : les deux premières phrases répondent à la requête. */}
        <p className="mt-8 max-w-prose border-l-2 border-signal pl-6 text-lg text-ink">{answer}</p>
        <p className="label mt-6">Mis à jour le {updated}</p>
      </div>

      <div className="grid gap-12 border-t border-rule pt-16 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-16">
        <div className="label lg:sticky lg:top-8 lg:self-start">GEO Sprint · analyse</div>
        <article className="min-w-0 space-y-6">{children}</article>
      </div>

      <section className="mt-24 border border-signal">
        <div className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
          <div>
            <h2 className="font-editorial text-2xl text-ink">Testez votre visibilité IA</h2>
            <p className="mt-3 max-w-prose text-sm text-ink-dim">
              Score 0-100 sur ChatGPT, Claude, Gemini et Perplexity, part de voix face à vos concurrents et réponses
              réelles. Quatre-vingt-dix secondes, sans inscription.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/" className="btn-signal whitespace-nowrap">Lancer le scan</a>
            <a href={BOOKING_URL} className="btn-ghost whitespace-nowrap">Réserver un call</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-rule py-12">
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["/guide-geo", "Guide GEO"],
            ["/geo-vs-seo", "GEO vs SEO"],
            ["/alternatives-agence-seo", "Alternatives aux agences SEO"],
            ["/mentions-legales", "Mentions légales"],
            ["/confidentialite", "Confidentialité"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="label transition-colors duration-150 ease-sharp hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="border-t border-rule pt-8 font-editorial text-2xl text-ink">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 font-mono text-sm uppercase tracking-wider text-ink">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-ink-dim">{children}</p>;
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="max-w-prose border-t border-rule">
      {items.map((it, i) => (
        <li key={i} className="flex gap-4 border-b border-rule py-3 text-ink-dim">
          <span className="font-mono text-signal">{String(i + 1).padStart(2, "0")}</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto border border-rule">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="bg-paper-raised">
            {head.map((h, i) => (
              <th key={i} className="label border-b border-rule px-4 py-3 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 ? "bg-paper-sunken" : undefined}>
              {r.map((c, j) => (
                <td key={j} className="border-b border-rule px-4 py-3 align-top text-sm text-ink-dim">{c}</td>
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
      <div className="border-t border-rule">
        {items.map((f) => (
          <details key={f.q} className="group border-b border-rule py-4">
            <summary className="flex cursor-pointer items-baseline gap-4 font-mono text-sm text-ink marker:content-['']">
              <span className="text-signal transition-transform duration-150 ease-sharp group-open:rotate-45">+</span>
              {f.q}
            </summary>
            <p className="mt-3 max-w-prose pl-8 text-sm text-ink-dim">{f.a}</p>
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
      <ol className="border-t border-rule">
        {items.map((s, i) => (
          <li key={s.url} className="flex gap-4 border-b border-rule py-3">
            <span className="tnum font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
            <a
              className="text-sm text-ink-dim transition-colors duration-150 ease-sharp hover:text-signal"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}
