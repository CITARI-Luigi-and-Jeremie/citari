import { Link } from "@tanstack/react-router";

import { CONTACT_EMAIL, LEGAL_FORM } from "@/lib/site";
import { useScanFormFocus } from "@/lib/scan-form-focus";
import { CursorHalo } from "@/components/jeremie/decor";

/**
 * Dernier appel et pied de page.
 *
 * Portés du projet Lovable de Jérémie le 07/08/2026. Les liens du pied
 * pointent vers les routes RÉELLES de ce dépôt : son projet renvoyait vers
 * `/guide-geo`, `/geo-ou-seo` et `/alternatives-agence`, dont deux n'existent
 * pas ici. Un lien mort en pied de page est vu par les moteurs d'IA avant de
 * l'être par un humain.
 */

export function SectionFinalCTA() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <section className="surface-close relative overflow-hidden">
      <div className="rule-fade absolute inset-x-0 top-0" />
      <CursorHalo />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <h2 className="mx-auto max-w-[22ch] text-[28px] leading-[1.12] sm:text-[40px]">
          Votre score existe déjà. Vous ne l'avez simplement pas encore regardé.
        </h2>
        <p className="mt-5 text-ink-2">
          Six moteurs interrogés, sans inscription, sans engagement.
        </p>
        <div className="mt-9">
          <button
            type="button"
            onClick={focusAndScroll}
            className="cta cta-sweep transition-colors duration-300"
          >
            Lancer le scan
          </button>
        </div>
        <p className="mono mt-6 text-[13px] text-ink-2">
          Si votre score est bon, nous vous le dirons et nous ne vous vendrons rien.
        </p>
      </div>
    </section>
  );
}

const LIENS = [
  {
    label: "Mesurer",
    items: [
      { label: "Lancer le scan", to: "/", focus: true },
      { label: "La méthode, en entier", to: "/methode" },
    ],
  },
  {
    label: "Comprendre",
    items: [
      { label: "Guide du GEO", to: "/guide-geo" },
      { label: "GEO ou SEO", to: "/geo-vs-seo" },
      { label: "Les alternatives à une agence", to: "/alternatives-agence-seo" },
    ],
  },
  {
    label: "Cadre",
    items: [
      { label: "Mentions légales", to: "/mentions-legales" },
      { label: "Confidentialité", to: "/confidentialite" },
    ],
  },
];

const LOGOS = [
  { nom: "ChatGPT", src: "/img/chatgpt.svg" },
  { nom: "Claude", src: "/img/claude.png" },
  { nom: "Gemini", src: "/img/gemini.png" },
  { nom: "Perplexity", src: "/img/perplexity.webp" },
  { nom: "Grok", src: "/img/grok.png" },
  { nom: "Le Chat", src: "/img/lechat.png" },
];

export function SiteFooter() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <footer className="surface-lift relative border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="text-[18px] font-semibold">Citari</p>
            <p className="measure mt-3 text-[15px] text-ink-2">
              Mesure de la visibilité des marques dans les réponses des IA.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-3">
            {LIENS.map((col) => (
              <div key={col.label}>
                <p className="mono text-[12px] uppercase tracking-[0.08em] text-ink-2">
                  {col.label}
                </p>
                <ul className="mt-4 space-y-2">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        onClick={"focus" in item && item.focus ? focusAndScroll : undefined}
                        className="link-underline text-[15px] text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-rule pt-8">
          <p className="mono text-[13px] text-ink-2">
            Citari · {LEGAL_FORM} ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link-underline text-ink">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mono mt-3 text-[12px] text-ink-2">
            Les mesures publiées sur ce site sont datées et rejouables.
          </p>
        </div>

        <div className="mt-8 border-t border-rule pt-6">
          <p className="mono text-center text-[12px] uppercase tracking-[0.08em] text-ink-2">
            Moteurs interrogés
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {LOGOS.map((logo) => (
              <img
                key={logo.nom}
                src={logo.src}
                alt={logo.nom}
                className="logo-mute h-5 w-auto object-contain"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
