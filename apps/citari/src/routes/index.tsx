import { createFileRoute } from "@tanstack/react-router";

import { ScanForm } from "@/components/jeremie/ScanForm";
import { CostCalculator } from "@/components/jeremie/CostCalculator";
import { SectionProcedure } from "@/components/jeremie/SectionProcedure";
import { SectionFAQ } from "@/components/jeremie/SectionFAQ";
import { SectionFinalCTA, SiteFooter } from "@/components/jeremie/SectionFinalCTA";
import { HeroFloatingCards } from "@/components/jeremie/HeroFloatingCards";
import { Reveal } from "@/components/jeremie/Reveal";
import { CursorHalo, WaveField } from "@/components/jeremie/decor";
import { useScanFormFocus } from "@/lib/scan-form-focus";

/**
 * Page d'accueil.
 *
 * Portée du projet Lovable de Jérémie le 07/08/2026. Le formulaire appelle
 * NOTRE fonction serveur `lancerScan` : rien de la couche données de son
 * projet n'a été repris.
 *
 * Elle a un seul objectif de conversion, faire lancer le scan gratuit. Le
 * sprint ne se vend pas ici : il se vend au diagnostic, en visio.
 */

const HERO_TITRE = "Vos clients demandent à ChatGPT. Il répond trois noms. Le vôtre ?";
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
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
          <div className="relative">
            <HeroFloatingCards />

            <Reveal delay={90}>
              <h1 className="mx-auto max-w-[22ch] text-center text-[34px] sm:text-[58px] lg:max-w-[19ch]">
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
              className="measure mx-auto mt-6 text-center text-[18px] leading-relaxed text-ink-2 sm:text-[20px] lg:max-w-[54ch]"
            >
              On mesure si vous y êtes, on répare ce qui vous en empêche, on remesure à J+90 avec
              les mêmes questions.
            </Reveal>
          </div>

          <Reveal delay={260}>
            <ScanForm centered />
          </Reveal>
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
