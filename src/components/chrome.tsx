import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Label } from "@/components/kit";

const LIENS = [
  ["/guide-geo", "Guide du GEO"],
  ["/geo-vs-seo", "GEO vs SEO"],
  ["/alternatives-agence-seo", "Alternatives"],
] as const;

export function Chrome({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule-strong py-4">
        <Link to="/" className="font-display text-[22px] leading-none">
          GEO&nbsp;Sprint
        </Link>
        <nav className="flex flex-wrap gap-6">
          {LIENS.map(([to, label]) => (
            <Link key={to} to={to} className="label-xs hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <footer className="mt-28 border-t border-rule-strong py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          <span className="font-display text-[20px]">GEO&nbsp;Sprint</span>
          <nav className="flex flex-wrap gap-6">
            {[...LIENS, ["/mentions-legales", "Mentions légales"], ["/confidentialite", "Confidentialité"]].map(
              ([to, label]) => (
                <Link key={to} to={to} className="label-xs hover:text-ink">
                  {label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Mise en page éditoriale d'un article : colonnes inégales, rail de sommaire. */
export function Article({
  titre,
  chapeau,
  sommaire,
  children,
}: {
  titre: string;
  chapeau: ReactNode;
  sommaire: [string, string][];
  children: ReactNode;
}) {
  return (
    <article className="pt-14">
      <h1 className="max-w-[20ch] text-[46px] leading-[0.96] sm:text-[68px]">{titre}</h1>
      <div className="mt-8 max-w-[62ch] border-t border-rule-strong pt-4 text-[19px] leading-relaxed">
        {chapeau}
      </div>
      <div className="mt-16 grid gap-12 lg:grid-cols-[176px_minmax(0,1fr)] lg:gap-16">
        <nav className="h-max lg:sticky lg:top-10">
          <Label className="pb-2">sommaire</Label>
          <ol className="border-t border-rule-strong">
            {sommaire.map(([id, label], i) => (
              <li key={id} className="border-b border-rule">
                <a href={`#${id}`} className="flex gap-2 py-2 text-[13px] leading-snug hover:text-bordeaux">
                  <span className="num text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="max-w-[70ch]">{children}</div>
      </div>
    </article>
  );
}

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-8 border-b border-rule-strong pb-2 text-[32px] leading-none sm:text-[38px]">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">{children}</p>;
}

export function Liste({ items }: { items: [string, string][] }) {
  return (
    <dl className="mt-6 border-t border-rule">
      {items.map(([k, v]) => (
        <div key={k} className="grid gap-1 border-b border-rule py-3 sm:grid-cols-[minmax(0,22ch)_1fr] sm:gap-8">
          <dt className="text-[15px] font-medium">{k}</dt>
          <dd className="text-[15px] leading-snug text-ink-2">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FaqBloc({ items }: { items: { q: string; r: string }[] }) {
  return (
    <dl className="mt-6 border-t border-rule-strong">
      {items.map((f) => (
        <div key={f.q} className="border-b border-rule py-4">
          <dt className="text-[16px] font-medium">{f.q}</dt>
          <dd className="mt-1 text-[15px] leading-relaxed text-ink-2">{f.r}</dd>
        </div>
      ))}
    </dl>
  );
}

export function jsonLdArticle(titre: string, description: string, url: string, faq: { q: string; r: string }[]) {
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: titre,
      description,
      inLanguage: "fr",
      author: { "@type": "Organization", name: "Citari" },
      publisher: { "@type": "Organization", name: "Citari" },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.r },
      })),
    },
  ]);
}
