import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { Reveal } from "@/components/jeremie/Reveal";
import {
  CalculTable,
  CardGrid,
  ChiffresCles,
  DataRows,
  MethodeCard,
  MethodeTimeline,
  RepartitionBar,
} from "@/components/jeremie/methode";
import { SiteFooter } from "@/components/jeremie/SectionFinalCTA";

/**
 * La notice technique.
 *
 * Portée du projet Lovable de Jérémie le 08/08/2026. C'est la page la plus
 * exposée du site : elle publie la formule et déroule un calcul complet, donc
 * elle invite le lecteur à nous prendre en défaut. Les chiffres doivent rester
 * alignés sur `src/lib/score.ts` — présence 50 %, rang 20 %, recommandation
 * 20 %, tonalité 10 % — et sur la liste figée des six moteurs.
 */

const TITLE = "La méthode, en entier — Citari";
const DESCRIPTION =
  "Protocole, formule, barème et exemple de calcul complet du score de visibilité Citari sur les six moteurs d'IA. Recalculable à la main.";

export const Route = createFileRoute("/methode")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
    ],
  }),
  component: MethodePage,
});

const SECTIONS = [
  { id: "resume", num: "00", label: "En cinq lignes" },
  { id: "nom", num: "01", label: "Nous ne prononçons jamais votre nom" },
  { id: "protocole", num: "02", label: "Le protocole, en quatre temps" },
  { id: "formule", num: "03", label: "La formule" },
  { id: "exemple", num: "04", label: "Un exemple complet" },
  { id: "rejeu", num: "05", label: "Le rejeu à J+90" },
  { id: "garanties", num: "06", label: "Ce que nous ne garantissons pas" },
  { id: "limites", num: "07", label: "Les limites que nous assumons" },
  { id: "verifier", num: "08", label: "Ce que vous pouvez vérifier vous-même" },
];

const mono = "font-mono text-[12px] tracking-[0.08em]";

function useActiveSection() {
  const [active, setActive] = useState<string>("resume");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

function SectionTitle({ num, children }: { num: string; children: ReactNode }) {
  return (
    <header className="mb-8 border-t border-ink pt-4">
      <span className={`${mono} block uppercase text-ink-2`}>{num}</span>
      <h2 className="mt-2 font-sans text-[26px] font-extrabold leading-[1.12] tracking-[-0.01em] text-ink sm:text-[32px]">
        {children}
      </h2>
    </header>
  );
}

function Section({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pb-24 sm:pb-32">
      <Reveal>
        <SectionTitle num={num}>{title}</SectionTitle>
      </Reveal>
      <div className="space-y-5 font-sans text-[16px] leading-[1.65] text-ink sm:text-[17px]">
        {children}
      </div>
    </section>
  );
}

function Toc() {
  const active = useActiveSection();
  return (
    <nav aria-label="Sommaire" className="hidden lg:block">
      <div className="sticky top-24">
        <p className={`${mono} mb-4 uppercase text-ink-2`}>Sommaire</p>
        <ol className="border-t border-rule">
          {SECTIONS.map((s) => (
            <li key={s.id} className="border-b border-rule">
              <a
                href={`#${s.id}`}
                className="flex gap-3 py-2.5 font-mono text-[12px] leading-[1.45] text-ink-2 transition-colors hover:text-ink"
                aria-current={active === s.id ? "true" : undefined}
              >
                <span className={active === s.id ? "text-ink" : ""}>{s.num}</span>
                <span className={active === s.id ? "text-ink" : ""}>{s.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

function MobileToc() {
  return (
    <details className="mb-14 border-y border-ink lg:hidden">
      <summary className={`${mono} cursor-pointer list-none py-3 uppercase text-ink`}>
        Sommaire — {SECTIONS.length} sections
      </summary>
      <ol className="pb-3">
        {SECTIONS.map((s) => (
          <li key={s.id} className="border-t border-rule">
            <a href={`#${s.id}`} className="flex gap-3 py-2.5 font-mono text-[12px] text-ink-2">
              <span>{s.num}</span>
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

const RESUME = [
  "Nous posons les questions de vos acheteurs, sans jamais citer votre marque.",
  "Chaque question part vers les 6 moteurs, par leurs API officielles.",
  "144 réponses réelles sont lues : qui est nommé, à quelle place, sur quel ton.",
  "Un score sur 100 en sort, avec une formule publiée que vous pouvez refaire.",
  "Les questions sont scellées le premier jour et rejouées telles quelles à J+90.",
];

function MethodePage() {
  return (
    <>
      <div className="surface-edge relative">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-20 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
          <Toc />

          <div className="max-w-[68ch]">
            <p className={`${mono} uppercase text-ink-2`}>Notice technique</p>
            <h1 className="mt-3 font-sans text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]">
              La méthode, en entier.
            </h1>
            <p className="mt-6 font-sans text-[17px] leading-[1.6] text-ink sm:text-[19px]">
              Vous pouvez recalculer notre score à la main. C'est le but. Cette page décrit le
              protocole, publie la formule, donne le barème et déroule un exemple complet. Si
              vous trouvez une faille, nous préférons l'apprendre de vous que de personne.
            </p>

            <ChiffresCles />

            <div className="mt-12">
              <MobileToc />
            </div>

            <div className="mt-12 lg:mt-16">
              <Section id="resume" num="00" title="En cinq lignes">
                <ol className="border-t border-rule-strong">
                  {RESUME.map((ligne, i) => (
                    <li key={ligne} className="flex gap-4 border-b border-rule py-3.5 sm:gap-5">
                      <span className="font-mono text-[12px] tabular-nums text-ink-2">
                        0{i + 1}
                      </span>
                      <span className="min-w-0">{ligne}</span>
                    </li>
                  ))}
                </ol>
              </Section>

              <Section id="nom" num="01" title="Nous ne prononçons jamais votre nom">
                <p>
                  Si nous demandions à ChatGPT ce qu'il pense de votre entreprise, il en dirait
                  du bien : nous lui aurions soufflé la réponse. Nous posons donc les questions
                  que vos acheteurs posent réellement, sans jamais citer votre marque, et nous
                  regardons si elle apparaît d'elle-même.
                </p>
                <p>C'est ce qui sépare une mesure d'une démonstration.</p>
              </Section>

              <Section id="protocole" num="02" title="Le protocole, en quatre temps">
                <p>
                  De la génération des questions au scellement, chaque temps est daté et
                  consigné dans le rapport.
                </p>
                <MethodeTimeline />
              </Section>

              <Section id="formule" num="03" title="La formule">
                <p>
                  Le score va de{" "}
                  <span className="font-mono text-[15px] tabular-nums">0 à 100</span>. Quatre
                  composantes, quatre coefficients :
                </p>
                <RepartitionBar />
                <CardGrid>
                  <MethodeCard eyebrow="Barème de position">
                    <p className="mb-3 text-ink-2">
                      Une marque citée en tête ne vaut pas une marque citée en fin de liste.
                    </p>
                    <DataRows
                      rows={[
                        ["1ʳᵉ position", "1,0"],
                        ["2ᵉ position", "0,8"],
                        ["3ᵉ position", "0,6"],
                        ["4ᵉ et 5ᵉ", "0,4"],
                        ["6ᵉ et au-delà", "0,2"],
                      ]}
                    />
                  </MethodeCard>
                  <MethodeCard eyebrow="Barème de tonalité">
                    <p className="mb-3 text-ink-2">
                      Le ton de la phrase où la marque est nommée.
                    </p>
                    <DataRows
                      rows={[
                        ["Positif", "1,0"],
                        ["Neutre", "0,5"],
                        ["Négatif", "0"],
                      ]}
                    />
                  </MethodeCard>
                </CardGrid>
                <div className="border-l border-ink pl-5">
                  <span className={`${mono} block uppercase text-ink-2`}>
                    Une précision qui compte
                  </span>
                  <p className="mt-2">
                    La position et la recommandation sont divisées par le nombre total de
                    réponses, pas par le nombre de citations. Autrement dit : on ne gagne pas de
                    points de position sur une réponse où l'on n'est pas cité. Être bien placé
                    trois fois sur cent quarante-quatre ne vaut pas être bien placé trois fois
                    sur trois.
                  </p>
                </div>
                <div className="border-l border-ink pl-5">
                  <span className={`${mono} block uppercase text-ink-2`}>
                    Une réponse en panne ne compte pas
                  </span>
                  <p className="mt-2">
                    Si un moteur renvoie une erreur, sa réponse sort du dénominateur au lieu
                    d'être comptée comme une absence. Sans cette règle, une panne chez un
                    éditeur ferait baisser votre note sans que rien n'ait changé chez vous.
                  </p>
                </div>
              </Section>

              <Section id="exemple" num="04" title="Un exemple complet">
                <p>Les données brutes d'une mesure, avant tout calcul :</p>
                <DataRows
                  rows={[
                    ["Réponses où la marque est citée", "43 / 144"],
                    ["Citations en 1ʳᵉ position", "6"],
                    ["En 2ᵉ position", "9"],
                    ["En 3ᵉ position", "11"],
                    ["En 4ᵉ ou 5ᵉ position", "12"],
                    ["Au-delà de la 5ᵉ", "5"],
                    ["Recommandations explicites", "9"],
                    ["Ton : positif / neutre / négatif", "22 / 18 / 3"],
                  ]}
                />
                <CalculTable />
                <p className="text-ink-2">
                  Ce{" "}
                  <span className="font-mono text-[15px] tabular-nums text-ink">27 / 100</span>{" "}
                  se lit ainsi : la marque existe pour les moteurs, mais elle arrive rarement en
                  tête et n'est presque jamais recommandée nommément. C'est le profil le plus
                  fréquent, et celui sur lequel un sprint bouge le plus vite.
                </p>
              </Section>

              <Section id="rejeu" num="05" title="Le rejeu à J+90">
                <p>
                  <span className="font-mono text-[15px] tabular-nums">Quatre-vingt-dix jours</span>{" "}
                  après la première mesure, nous rejouons exactement les mêmes questions, sur les
                  mêmes moteurs, avec la même formule. Les questions ayant été scellées le
                  premier jour, nous ne pouvons pas les remplacer par des questions plus
                  favorables. C'est ce qui rend l'écart avant/après opposable.
                </p>
              </Section>

              <Section id="garanties" num="06" title="Ce que nous ne garantissons pas">
                <CardGrid>
                  <MethodeCard eyebrow="Aucun score, aucune position">
                    Il n'y a pas de classement dans ChatGPT : personne ne peut vendre une place
                    qui n'existe pas. Ce que nous garantissons, ce sont les actions livrées, pas
                    leur effet chiffré.
                  </MethodeCard>
                  <MethodeCard eyebrow="Aucun délai d'effet">
                    Les moteurs intègrent les modifications d'un site en{" "}
                    <span className="font-mono text-[15px] tabular-nums">4 à 12 semaines</span>,
                    selon leurs propres cycles. Nous ne les maîtrisons pas.
                  </MethodeCard>
                  <MethodeCard eyebrow="Aucun résultat identique d'un jour sur l'autre">
                    Un moteur interrogé deux fois ne répond pas exactement pareil. C'est pourquoi
                    le score se lit sur{" "}
                    <span className="font-mono text-[15px] tabular-nums">144 réponses</span>, et
                    non sur une.
                  </MethodeCard>
                </CardGrid>
              </Section>

              <Section id="limites" num="07" title="Les limites que nous assumons">
                <CardGrid>
                  <MethodeCard eyebrow="Les modèles changent entre deux mesures">
                    Les éditeurs mettent leurs modèles à jour sans préavis. Nous figeons les
                    versions quand l'API le permet, et nous l'écrivons dans le rapport quand elle
                    ne le permet pas. Une partie de l'écart à{" "}
                    <span className="font-mono text-[15px] tabular-nums">J+90</span> vient de là,
                    et le rapport le dit.
                  </MethodeCard>
                  <MethodeCard eyebrow="Un score n'est comparable qu'à un score établi sur les mêmes moteurs">
                    Si un moteur tombe en panne pendant une mesure, le score bouge tout seul.
                    Nous recalculons alors sur le socle commun aux deux mesures.
                  </MethodeCard>
                  <MethodeCard eyebrow="Les moteurs écrivent rarement un nom deux fois pareil">
                    Une même société apparaît sous plusieurs écritures dans une même mesure. Nous
                    les regroupons sous le nom le plus employé par les moteurs, et le détail des
                    variantes reste consultable dans le rapport.
                  </MethodeCard>
                </CardGrid>
              </Section>

              <Section id="verifier" num="08" title="Ce que vous pouvez vérifier vous-même">
                <p>
                  Ouvrez ChatGPT et posez la question ci-dessous. Vous obtiendrez une réponse
                  proche de la nôtre, sans être identique, c'est précisément ce que mesure le
                  protocole.
                </p>
                <figure className="my-8 rounded-[2px] border border-rule-strong bg-paper-2 p-5 sm:p-7">
                  <p className={`${mono} uppercase text-ink-2`}>Exemple — données fictives</p>
                  <blockquote className="mt-4 font-quote text-[19px] italic leading-[1.55] text-ink sm:text-[22px]">
                    « Pour une PME à Lyon, je recommande plutôt Concurrent A, dont
                    l'accompagnement comptable est souvent cité comme le plus complet. »
                  </blockquote>
                  <figcaption className="mt-5 border-t border-rule pt-3 font-mono text-[12px] leading-[1.6] text-ink-2">
                    <span className="block">Moteur : ChatGPT</span>
                    <span className="block">
                      Question : « Quel cabinet comptable choisir à Lyon ? »
                    </span>
                    <span className="block">
                      Réponse reconstituée pour l'illustration, avec un concurrent fictif.
                    </span>
                  </figcaption>
                </figure>
              </Section>

              <div className="border-t border-ink pt-8">
                <p className="font-sans text-[17px] leading-[1.6] text-ink sm:text-[19px]">
                  La méthode est lue. La suite se mesure sur votre marque.
                </p>
                <Link
                  to="/"
                  className="mt-5 inline-flex items-center gap-6 rounded-[2px] bg-ink px-6 py-4 text-paper transition-opacity hover:opacity-90"
                >
                  <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em]">
                    lancer le scan
                  </span>
                  <span aria-hidden="true" className="text-[20px] leading-none">
                    →
                  </span>
                </Link>
                <p className="mt-4 font-mono text-[12px] text-ink-2">
                  90 secondes · sans carte bancaire
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
