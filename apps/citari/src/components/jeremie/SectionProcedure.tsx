import type { ReactNode } from "react";

import { useScanFormFocus } from "@/lib/scan-form-focus";
import { Reveal } from "@/components/jeremie/Reveal";
import { ScrollFloat } from "@/components/jeremie/ScrollFloat";

/**
 * Les trois étapes du tunnel, avec leur coût annoncé d'avance.
 *
 * Portée du projet Lovable de Jérémie le 07/08/2026. Les chiffres cités
 * (40 réponses en aperçu, 24 questions × 6 moteurs et 144 réponses en
 * diagnostic, 2 900 € HT, 5 contenus, 8 sources, J+90) doivent rester alignés
 * sur ce que le moteur fait réellement — c'est le genre d'écart qui se vérifie
 * en trente secondes et qui coûte la crédibilité de toute la mesure.
 */

type Etape = {
  num: string;
  titre: string;
  cout: string;
  duree: string;
  obtenu: ReactNode;
  image: string;
  alt: string;
};

const ETAPES: Etape[] = [
  {
    num: "01",
    titre: "Le scan offert",
    cout: "Votre adresse email, rien d'autre.",
    duree: "90 secondes",
    obtenu:
      "40 réponses réelles, collectées sous vos yeux. Votre nom compté face aux trois concurrents que vous choisissez, l'écart affiché en points. Et la phrase exacte où une IA recommande quelqu'un de votre secteur : peut-être vous, peut-être pas.",
    image: "/img/etape-scan.png",
    alt: "Une loupe posée sur des lignes de texte, illustration abstraite du scan.",
  },
  {
    num: "02",
    titre: "Votre diagnostic complet, en visioconférence",
    cout: "30 minutes de votre temps",
    duree: "30 minutes de visio",
    obtenu: (
      <>
        Dès votre réservation, nous lançons le scan complet : vos 24 questions sur les six
        moteurs, 144 réponses au lieu de 40. En visio, on vous présente les phrases exactes où
        votre marché se joue, les sources que les IA citent, l'audit de votre site et le plan
        d'action.{" "}
        <strong className="font-semibold text-ink">
          Si votre score est bon, on vous le dit et on ne vous vend rien.
        </strong>
      </>
    ),
    image: "/img/etape-citations.png",
    alt: "Un guillemet au-dessus de quatre filets, dont un surligné en rouge.",
  },
  {
    num: "03",
    titre: "30 jours pour entrer dans les réponses des IA",
    cout: "2 900 € HT, une fois. 50 % à la commande, 50 % à la livraison.",
    duree: "30 jours",
    obtenu:
      "Les verrous trouvés à votre diagnostic, levés un par un : votre site rendu lisible par les IA, 5 contenus écrits pour être cités, 8 sources que les IA consultent où nous vous installons. Et à J+90, les mêmes 24 questions rejouées à l'identique : l'avant/après, que le résultat nous arrange ou non.",
    image: "/img/etape-diagnostic.png",
    alt: "Un cadran de mesure avec une aiguille rouge, illustration du diagnostic.",
  },
];

export function SectionProcedure() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <section className="surface-edge relative">
      <div className="rule-fade absolute inset-x-0 top-0" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <p className="mono text-[12px] uppercase tracking-[0.12em] text-ink-2">
            comment ça se passe
          </p>
        </Reveal>

        <ScrollFloat
          className="mt-5 max-w-[600px] text-[34px] sm:text-[52px]"
          style={{
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            textWrap: "pretty" as never,
          }}
        >
          Trois étapes. Vous savez d'avance ce que chacune coûte.
        </ScrollFloat>

        <Reveal>
          <p className="measure mt-5 text-ink-2">
            Vous pouvez vous arrêter après n'importe laquelle. Chacune se suffit à elle-même,{" "}
            <strong className="font-semibold text-ink">
              et rien ne se déclenche sans que vous l'ayez décidé.
            </strong>
          </p>
        </Reveal>

        {/* Cartes empilées : chaque étape se superpose à la précédente au défilement. */}
        <div className="mt-12" role="list">
          {ETAPES.map((etape, i) => (
            <div
              key={etape.num}
              role="listitem"
              className="stack-card"
              style={{
                top: `calc(6rem + ${i * 1.25}rem)`,
                marginBottom: i === ETAPES.length - 1 ? 0 : "2.5rem",
                zIndex: i + 1,
              }}
            >
              <div className="card-lift group grid gap-0 overflow-hidden border border-rule bg-paper shadow-[0_28px_60px_-40px_color-mix(in_srgb,var(--ink)_55%,transparent)] hover:border-signal sm:grid-cols-2">
                <img
                  src={etape.image}
                  alt={etape.alt}
                  loading="lazy"
                  width={1024}
                  height={640}
                  className="aspect-[2/1] w-full border-b border-rule object-cover sm:aspect-auto sm:h-full sm:border-b-0 sm:border-r"
                />

                <div className="flex flex-col p-7 sm:p-9">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                    <span className="mono text-[13px] text-ink-2">{etape.num}</span>
                    <span className="mono text-[12px] tabular-nums text-ink-2">{etape.duree}</span>
                  </div>

                  <h3 className="mt-5 text-[26px] leading-[1.15] sm:mt-4 sm:text-[30px]">
                    {etape.titre}
                  </h3>

                  <dl className="mono mt-7 border-l-2 border-rule-strong pl-4 text-[14px] tabular-nums sm:mt-5 sm:border-l sm:pl-3">
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-2">coût</dt>
                    <dd className="mt-1.5 leading-snug">{etape.cout}</dd>
                  </dl>

                  <div className="mt-7 sm:mt-5">
                    <p className="mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                      vous obtenez
                    </p>
                    <p className="mt-2 text-[16px] leading-[1.65] text-ink-2">{etape.obtenu}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Reveal as="div" delay={400} className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={focusAndScroll}
            className="group inline-flex items-center justify-between gap-10 border border-signal bg-signal px-6 py-4 text-paper transition-colors duration-300 hover:bg-paper hover:text-signal active:scale-[0.98]"
          >
            <span className="mono text-[12px] font-semibold uppercase tracking-[0.2em]">
              lancer le scan
            </span>
            <span className="text-[22px] leading-none transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
