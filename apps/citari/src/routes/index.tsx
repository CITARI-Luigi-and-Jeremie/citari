import { createFileRoute } from "@tanstack/react-router";

import { ScanForm } from "@/components/jeremie/ScanForm";
import { CostCalculator } from "@/components/jeremie/CostCalculator";
import { SectionProcedure } from "@/components/jeremie/SectionProcedure";
import { SectionFAQ } from "@/components/jeremie/SectionFAQ";
import { SectionFinalCTA, SiteFooter } from "@/components/jeremie/SectionFinalCTA";
import { HeroSpecimen } from "@/components/jeremie/HeroSpecimen";
import { ProblemSolutionBridge } from "@/components/jeremie/ProblemSolutionBridge";
import { Quadrillage } from "@/components/jeremie/Quadrillage";
import { Reveal } from "@/components/jeremie/Reveal";
import { CursorHalo, WaveField } from "@/components/jeremie/decor";

/**
 * Page d'accueil.
 *
 * Maquette v3 de Jérémie, portée le 14/08/2026 : quadrillage sur le héros,
 * pont problème/solution en StrokeText après le héros, sections identifiées
 * pour la barre latérale (scan · probleme · cout · methode · faq · contact).
 * Le formulaire appelle NOTRE fonction serveur `lancerScan` : rien de la
 * couche données de son projet n'a été repris.
 */

const HERO_TITRE = "Vous perdez des clients que vous ne verrez jamais.";
const HERO_MOTS = HERO_TITRE.split(" ");

const TITLE = "Citari — scan de visibilité dans les réponses des IA";
/**
 * La description annonçait « Six moteurs interrogés (…) en 90 secondes »
 * (corrigé le 15/08/2026). Les 90 secondes sont celles du scan gratuit, qui
 * en interroge DEUX : c'était le même mensonge que les six logos du héros et
 * que le dernier appel, mais à l'endroit le plus exposé du site — le texte
 * que Google affiche et que les IA reprennent quand elles citent Citari.
 * Les six moteurs restent annoncés là où ils sont vrais : le diagnostic.
 */
const DESCRIPTION =
  "ChatGPT et Gemini interrogés en direct avec les vraies questions de vos acheteurs. Votre score sur 100 et les phrases exactes, en 90 secondes.";

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
  return (
    <>
      <section id="scan" className="surface-edge relative overflow-hidden">
        <Quadrillage variante="clair" />
        <CursorHalo />
        <WaveField />
        {/* pt-24 mobile : la marque flottante (fixed top-5) rognait la première
            ligne du titre avec le pt-12 de la maquette. */}
        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-24 sm:px-8 sm:pb-20 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <div>
              <Reveal delay={90}>
                {/* xl:62px depuis le 15/08/2026 : 52px pour toute largeur
                    au-delà de 640px laissait le titre sous-dimensionné sur un
                    écran de bureau, où le spécimen le dominait. */}
                <h1 className="max-w-[20ch] text-[34px] sm:text-[52px] xl:text-[62px]">
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
                className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-ink-2 sm:text-[20px]"
              >
                {/* La scène a trois temps, et le troisième est la raison
                    d'être du produit ; noyé dans un bloc gras uniformément
                    gris, il passait inaperçu. */}
                Ils ont demandé à une IA. Elle a cité trois entreprises, vous n'en faisiez pas
                partie. <strong className="font-bold text-ink">Et personne ne vous l'a dit.</strong>
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

      <ProblemSolutionBridge />
      <CostCalculator />
      {/* La section « Vérifiabilité » qui suivait a été supprimée le
          15/08/2026 : elle redisait ce que les trois cartes venaient de dire
          (doublon relevé par Luigi), et le Sprint n'y figurait pas. Chaque
          carte du parcours porte désormais SA notice technique en bouton :
          01 et 02 → /methode, 03 → /sprint. */}
      <SectionProcedure />
      <SectionFAQ />
      <SectionFinalCTA />
      <SiteFooter />
    </>
  );
}
