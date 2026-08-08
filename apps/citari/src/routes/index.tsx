import { createFileRoute } from "@tanstack/react-router";

import { ScanForm } from "@/components/jeremie/ScanForm";
import { CostCalculator } from "@/components/jeremie/CostCalculator";
import { SectionProcedure } from "@/components/jeremie/SectionProcedure";
import { SectionFAQ } from "@/components/jeremie/SectionFAQ";
import { SectionFinalCTA, SiteFooter } from "@/components/jeremie/SectionFinalCTA";
import { HeroSpecimen } from "@/components/jeremie/HeroSpecimen";
import { Reveal } from "@/components/jeremie/Reveal";
import { CursorHalo, WaveField } from "@/components/jeremie/decor";
import { useScanFormFocus } from "@/lib/scan-form-focus";

/**
 * Page d'accueil.
 *
 * Portée du projet Lovable de Jérémie ; maquette remise à l'identique le
 * 08/08/2026 (deux colonnes, spécimen de rapport à droite). Le formulaire
 * appelle NOTRE fonction serveur `lancerScan` : rien de la couche données de
 * son projet n'a été repris.
 *
 * Elle a un seul objectif de conversion, faire lancer le scan gratuit. Le
 * sprint ne se vend pas ici : il se vend au diagnostic, en visio.
 */

const HERO_TITRE = "Vous perdez des clients que vous ne verrez jamais.";
const HERO_MOTS = HERO_TITRE.split(" ");

const TITLE = "Citari — scan de visibilité dans les réponses des IA";
const DESCRIPTION =
  "Six moteurs interrogés en direct avec les vraies questions de vos acheteurs. Votre score sur 100 et les phrases exactes, en 90 secondes.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <>
      <section className="surface-edge relative overflow-hidden">
        <CursorHalo />
        <WaveField />
        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <div>
              <Reveal delay={90}>
                <h1 className="max-w-[20ch] text-[34px] sm:text-[52px]">
                  {HERO_MOTS.map((mot, i) => (
                    <span
                      key={`${mot}-${i}`}
                      className="word-rise"
                      style={{ animationDelay: `${140 + i * 45}ms` }}
                    >
                      {mot}
                      {i < HERO_MOTS.length - 1 ? " " : ""}
                    </span>
                  ))}
                </h1>
              </Reveal>

              <Reveal
                as="p"
                delay={180}
                className="mt-6 max-w-[52ch] text-[18px] font-bold leading-relaxed text-ink-2 sm:text-[20px]"
              >
                Ils ont demandé à une IA. Elle a cité trois entreprises. Vous n'en faisiez pas
                partie, et personne ne vous l'a dit.
              </Reveal>

              <Reveal delay={260}>
                <ScanForm />
              </Reveal>
            </div>

            <Reveal delay={340}>
              <HeroSpecimen />
            </Reveal>
          </div>
        </div>
        <div className="rule-fade absolute inset-x-0 bottom-0" />
      </section>

      <CostCalculator onCta={focusAndScroll} />
      <SectionProcedure />
      <SectionFAQ />
      <SectionFinalCTA />
      <SiteFooter />
    </>
  );
}
