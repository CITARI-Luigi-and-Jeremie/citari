import type { ReactNode } from "react";

import { useScanFormFocus } from "@/lib/scan-form-focus";
import { Reveal } from "@/components/jeremie/Reveal";
import { ScrollFloat } from "@/components/jeremie/ScrollFloat";
import { Quadrillage } from "@/components/jeremie/Quadrillage";

/**
 * Les trois étapes du tunnel, sur fond sombre quadrillé.
 *
 * Version v3 de Jérémie, portée le 14/08/2026 : gros numéros d'étape,
 * libellés CE QUE VOUS RECEVEZ / CE QUE ÇA VOUS COÛTE, textes longs.
 *
 * Trois retouches de doctrine par rapport à sa copie, parce qu'il n'y a pas
 * encore de client ni de prospect réel :
 * - « La plupart de nos prospects découvrent... » affirmait un historique qui
 *   n'existe pas → reformulé au conditionnel, même rythme ;
 * - « C'est déjà arrivé, et ça arrivera encore » (dire qu'un score est bon
 *   sans rien vendre) → coupé, la promesse seule suffit ;
 * - « Dans trente jours, si » promettait qu'une IA aurait à DIRE : les moteurs
 *   intègrent en 4 à 12 semaines (notre propre page méthode). « À lire »
 *   est la version vraie : la matière existe bien à J+30.
 */

type Etape = {
  num: string;
  label?: string;
  titre: string;
  cout: string;
  labelCout?: string;
  duree: string;
  labelObtenu?: string;
  obtenu: ReactNode;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAspect: string;
  alt: string;
};

const ETAPES: Etape[] = [
  {
    num: "01",
    label: "LE SCAN",
    titre: "Vous voyez enfin ce qu'on répond à votre place",
    cout: "Votre adresse professionnelle. Ni carte bancaire, ni rendez-vous, ni engagement.",
    labelCout: "CE QUE ÇA VOUS COÛTE",
    duree: "Gratuit · 90 secondes",
    labelObtenu: "CE QUE VOUS RECEVEZ",
    obtenu: (
      <div className="space-y-4">
        <p>
          Nous posons à ChatGPT et Gemini les questions que vos acheteurs tapent vraiment. Pas des
          simulations : 40 réponses réelles, sous vos yeux, en direct.
        </p>
        <p>
          Vous découvrez qui est cité, combien de fois, et dans quel ordre. Toutes les marques qui
          sortent, pas seulement celles que vous surveillez.
        </p>
        <p>
          Et la phrase exacte. Mot pour mot. Celle où une IA recommande quelqu'un de votre secteur
          à un client qui aurait pu être le vôtre.
        </p>
        <p>
          Vous découvrirez peut-être un score que vous n'imaginiez pas.{" "}
          <strong className="font-semibold text-ink">Dans les deux sens.</strong>
        </p>
      </div>
    ),
    image: "/img/etape-scan.png",
    imageWidth: 1024,
    imageHeight: 640,
    imageAspect: "aspect-[2/1]",
    alt: "Une loupe posée sur des lignes de texte, illustration abstraite du scan.",
  },
  {
    num: "02",
    label: "LE DIAGNOSTIC",
    titre: "Vous repartez avec le plan, que vous travailliez avec nous ou non",
    cout: "30 minutes. Rien d'autre.",
    labelCout: "CE QUE ÇA VOUS COÛTE",
    duree: "Gratuit · 30 minutes",
    labelObtenu: "CE QUE VOUS RECEVEZ",
    obtenu: (
      <div className="space-y-4">
        <p>
          Dès que vous réservez, nous lançons l'analyse complète : 24 questions, 6 moteurs, 144
          réponses.{" "}
          <strong className="font-semibold text-ink">
            Ce travail est facturé plusieurs centaines d'euros ailleurs.
          </strong>
        </p>
        <p>Lors de notre visio vous saurez :</p>
        <ul className="list-disc space-y-2 pl-4">
          <li>les sources exactes sur lesquelles les IA s'appuient pour citer vos concurrents ;</li>
          <li>ce qui bloque techniquement sur votre site ;</li>
          <li>l'ordre des corrections, et lesquelles vous pouvez faire seul.</li>
        </ul>
        <p>Vous repartez avec ce plan. Il est à vous.</p>
        <p>
          <strong className="font-semibold text-ink">
            Si votre score est bon, on vous le dit et on ne vous vend rien.
          </strong>
        </p>
      </div>
    ),
    image: "/img/etape-citations.png",
    imageWidth: 900,
    imageHeight: 1400,
    imageAspect: "aspect-[9/14]",
    alt: "Un guillemet au-dessus de quatre filets, dont un surligné en rouge.",
  },
  {
    num: "03",
    label: "LE SPRINT GEO",
    titre: "Aujourd'hui, une IA n'a presque rien à lire sur vous. Dans trente jours, si.",
    cout: "2 900 € HT, une fois. 50 % à la commande, 50 % à la livraison. Aucun abonnement, aucune reconduction.",
    duree: "30 jours",
    labelObtenu: "CE QUE NOUS FAISONS",
    obtenu: (
      <div className="space-y-4">
        <p>Trois chantiers, menés en parallèle pendant un mois.</p>
        <p>
          Nous rendons votre site lisible par les IA, la plupart leur ferment la porte sans le
          savoir. Nous écrivons ce qui manque sur les questions précises où votre nom n'est pas
          sorti. Et nous allons vous faire exister sur les sources que les moteurs consultent avant
          de répondre : c'est le chantier que personne ne fait, et c'est celui qui compte le plus.
        </p>
        <p>
          Puis à J+90, le même relevé qu'aujourd'hui, mot pour mot.{" "}
          <strong className="font-semibold text-ink">
            C'est la seule chose que nous garantissons, et c'est la seule qui se vérifie.
          </strong>
        </p>
      </div>
    ),
    labelCout: "CE QUE ÇA VOUS DEMANDE",
    image: "/img/etape-diagnostic.png",
    imageWidth: 1024,
    imageHeight: 640,
    imageAspect: "aspect-[2/1]",
    alt: "Un cadran de mesure avec une aiguille rouge, illustration du diagnostic.",
  },
];

export function SectionProcedure() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <section id="methode" className="relative scroll-mt-20 overflow-hidden bg-ink">
      <Quadrillage variante="sombre" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <p className="mono text-[12px] uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--paper)_55%,transparent)]">
            NOTRE MÉTHODE
          </p>
        </Reveal>

        <ScrollFloat
          className="mt-5 max-w-[600px] text-[34px] text-paper sm:text-[52px]"
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
          <p className="measure mt-5 text-[color-mix(in_srgb,var(--paper)_72%,transparent)]">
            Vous pouvez vous arrêter après n'importe laquelle. Chacune se suffit à elle-même,{" "}
            <strong className="font-semibold text-paper">
              et rien ne se déclenche sans que vous l'ayez décidé.
            </strong>
          </p>
        </Reveal>

        {/* Cartes empilées : chaque étape se superpose à la précédente au défilement. */}
        <ul className="mt-12">
          {ETAPES.map((etape, i) => (
            <li
              key={etape.num}
              className="stack-card"
              style={{
                top: `calc(6rem + ${i * 1.25}rem)`,
                marginBottom: i === ETAPES.length - 1 ? 0 : "2.5rem",
                zIndex: i + 1,
              }}
            >
              <Reveal delay={i * 120} className="block">
                <div>
                  <div className="card-lift group grid gap-0 overflow-hidden border border-rule bg-paper shadow-[0_32px_70px_-36px_rgba(251,250,247,0.18)] hover:border-signal sm:grid-cols-2">
                    <img
                      src={etape.image}
                      alt={etape.alt}
                      loading="lazy"
                      width={etape.imageWidth}
                      height={etape.imageHeight}
                      className={`${etape.imageAspect} w-full border-b border-rule object-cover sm:aspect-auto sm:h-full sm:border-b-0 sm:border-r`}
                    />

                    <div className="flex flex-col p-7 sm:p-9">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="mono text-[56px] font-bold leading-[0.85] tracking-tighter text-ink sm:text-[64px]">
                            {etape.num}
                          </span>
                          {etape.label ? (
                            <span className="mono mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-2">
                              {etape.label}
                            </span>
                          ) : null}
                        </div>
                        <span className="mono mt-2 text-[12px] tabular-nums text-ink-2">
                          {etape.duree}
                        </span>
                      </div>

                      <h3 className="mt-5 text-[26px] leading-[1.15] text-ink sm:mt-4 sm:text-[30px]">
                        {etape.titre}
                      </h3>

                      <div className="mt-7 sm:mt-5">
                        <p className="mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                          {etape.labelObtenu ?? "vous obtenez"}
                        </p>
                        <div className="mt-2 text-[16px] leading-[1.65] text-ink-2">
                          {etape.obtenu}
                        </div>
                      </div>

                      <dl className="mono mt-7 border-l-2 border-rule pl-4 text-[14px] tabular-nums sm:mt-8 sm:border-l sm:pl-3">
                        <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-2">
                          {etape.labelCout ?? "coût"}
                        </dt>
                        <dd className="mt-1.5 leading-snug text-ink">{etape.cout}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

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
