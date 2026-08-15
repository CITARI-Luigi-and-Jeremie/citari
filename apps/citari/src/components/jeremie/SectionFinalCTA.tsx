import { Link } from "@tanstack/react-router";

import { CONTACT_EMAIL, LEGAL_FORM } from "@/lib/site";
import { useScanFormFocus } from "@/lib/scan-form-focus";
import { Reveal } from "@/components/jeremie/Reveal";
import { Quadrillage } from "@/components/jeremie/Quadrillage";

/**
 * Dernier appel et pied de page, version v3 sombre quadrillée de Jérémie,
 * portée le 14/08/2026.
 *
 * Deux écarts assumés avec sa copie :
 * - il avait supprimé la colonne « Comprendre » ; nos pages de contenu
 *   (guide-geo, geo-vs-seo, alternatives) existent et sont notre matière GEO,
 *   le pied de page est leur seule navigation, elles restent liées ;
 * - son titre de logos « Nous travaillons avec » est faux, nous ne
 *   travaillons avec aucun de ces éditeurs : « Moteurs interrogés ».
 */

export function SectionFinalCTA() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <section id="contact" className="relative overflow-hidden">
      <Quadrillage variante="sombre" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <Reveal>
          <h2 className="mx-auto max-w-[22ch] text-[28px] leading-[1.12] text-paper sm:text-[40px]">
            Votre score existe déjà. Vous ne l'avez simplement pas encore regardé.
          </h2>
        </Reveal>

        {/* Disait « Six moteurs interrogés » au-dessus du bouton du scan
            GRATUIT, qui en interroge deux (15/08/2026). Même correction que
            sous le formulaire du héros : on annonce ce que ce bouton
            déclenche, et les six restent la promesse du diagnostic. */}
        <Reveal
          as="p"
          delay={90}
          className="mt-5 text-[color-mix(in_srgb,var(--paper)_72%,transparent)]"
        >
          ChatGPT et Gemini interrogés en direct, sans inscription, sans engagement.
        </Reveal>

        <Reveal delay={160} className="mt-9">
          <button
            type="button"
            onClick={focusAndScroll}
            className="group inline-flex items-center justify-center gap-4 border border-signal bg-signal px-7 py-4 text-paper transition-colors duration-300 hover:bg-paper hover:text-signal active:scale-[0.98]"
          >
            <span className="mono text-[12px] font-semibold uppercase tracking-[0.2em]">
              lancer le scan
            </span>
            <span className="text-[20px] leading-none transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </button>
        </Reveal>

        <Reveal
          as="p"
          delay={230}
          className="mono mt-6 text-[13px] text-[color-mix(in_srgb,var(--paper)_58%,transparent)]"
        >
          Si votre score est bon, nous vous le dirons et nous ne vous vendrons rien.
        </Reveal>
      </div>
    </section>
  );
}

const LOGOS = [
  { nom: "ChatGPT", src: "/img/chatgpt.svg" },
  { nom: "Claude", src: "/img/claude.png" },
  { nom: "Gemini", src: "/img/gemini.png" },
  { nom: "Perplexity", src: "/img/perplexity.webp" },
  { nom: "Grok", src: "/img/grok.png" },
  { nom: "Le Chat", src: "/img/lechat.png" },
];

const LIENS = [
  {
    label: "Mesurer",
    items: [
      { label: "Lancer le scan", to: "/", focus: true },
      { label: "La méthode, en entier", to: "/methode" },
      { label: "Le scan complet, déplié", to: "/scan-complet" },
      { label: "Le Sprint, déplié", to: "/sprint" },
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

export function SiteFooter() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <footer className="relative overflow-hidden">
      <Quadrillage variante="sombre" halo={false} />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          <div>
            <p className="text-[18px] font-semibold text-paper">Citari</p>
            <p className="measure mt-3 text-[15px] text-[color-mix(in_srgb,var(--paper)_65%,transparent)]">
              Mesure de la visibilité des marques dans les réponses des IA.
            </p>
          </div>

          {LIENS.map((col) => (
            <div key={col.label}>
              <p className="mono text-[12px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--paper)_55%,transparent)]">
                {col.label}
              </p>
              <ul className="mt-4 space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      onClick={"focus" in item && item.focus ? focusAndScroll : undefined}
                      className="link-underline text-[15px] text-paper"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-[color-mix(in_srgb,var(--paper)_14%,transparent)] pt-8">
          {/* La forme juridique ne s'affiche que si elle est RENSEIGNÉE : le
              pied de page publiait « Citari · [forme juridique à compléter] »
              sur le site en ligne (15/08/2026). Un gabarit visible sur la
              page qui vend l'exactitude coûte plus cher que la mention
              manquante. À rétablir dès que la structure existe (SETUP.md). */}
          <p className="mono text-[13px] text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
            Citari{LEGAL_FORM.includes("[") ? "" : ` · ${LEGAL_FORM}`} ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link-underline text-paper">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mono mt-3 text-[12px] text-[color-mix(in_srgb,var(--paper)_50%,transparent)]">
            Les mesures publiées sur ce site sont datées et rejouables.
          </p>
        </div>

        <div className="mt-8 border-t border-[color-mix(in_srgb,var(--paper)_14%,transparent)] pt-6">
          <p className="mono text-center text-[12px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--paper)_50%,transparent)]">
            Moteurs interrogés
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {LOGOS.map((logo) => (
              <img
                key={logo.nom}
                src={logo.src}
                alt={logo.nom}
                className="h-5 w-auto object-contain opacity-60 transition-opacity duration-300 hover:opacity-100"
                style={{ filter: "grayscale(1) brightness(0) invert(1)" }}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
