import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Les questions qu'on nous pose, y compris les désagréables.
 *
 * Portée du projet Lovable de Jérémie le 07/08/2026. Elle est balisée en
 * schema.org FAQPage, ce qui est exactement le format que les moteurs d'IA
 * reprennent le plus volontiers : le site est sa propre démonstration.
 *
 * Le fond de ces réponses EST le produit. Chacune est vérifiable, y compris
 * « nous n'avons pas encore de clients » et « nous ne garantissons aucun
 * score » : la doctrine d'honnêteté interdit de les adoucir.
 */

const LABEL = "questions reçues";
const TITRE = "Les questions que l'on nous pose, y compris les désagréables.";

type Entree = { q: string; r: React.ReactNode; plain: string };

const M = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[0.92em] tabular-nums">{children}</span>
);

const ENTREES: Entree[] = [
  {
    q: "Pourquoi le prix est-il affiché ?",
    plain:
      "Parce qu'un prix caché sert le vendeur, pas l'acheteur. Le Sprint GEO coûte 2 900 € HT, quel que soit votre chiffre d'affaires, et vous le savez avant de nous parler. Cela nous oblige à consacrer le rendez-vous à votre situation plutôt qu'à négocier un chiffre.",
    r: (
      <>
        Parce qu'un prix caché sert le vendeur, pas l'acheteur. Le Sprint GEO coûte{" "}
        <M>2 900 € HT</M>, quel que soit votre chiffre d'affaires, et vous le savez avant de nous
        parler. Cela nous oblige à consacrer le rendez-vous à votre situation plutôt qu'à négocier
        un chiffre.
      </>
    ),
  },
  {
    q: "Pourquoi un paiement unique et pas un abonnement ?",
    plain:
      "Parce qu'un abonnement récompense la durée, pas le résultat. Un sprint dure 30 jours, avec une mesure de contrôle 90 jours plus tard. Si vous n'avez plus besoin de nous ensuite, c'est le fonctionnement normal, pas un échec.",
    r: (
      <>
        Parce qu'un abonnement récompense la durée, pas le résultat. Un sprint dure <M>30 jours</M>,
        avec une mesure de contrôle <M>90 jours</M> plus tard. Si vous n'avez plus besoin de nous
        ensuite, c'est le fonctionnement normal, pas un échec.
      </>
    ),
  },
  {
    q: "Quel résultat garantissez-vous ?",
    plain:
      "Aucun score, aucune position. Il n'y a pas de classement dans ChatGPT : personne ne peut vendre une place qui n'existe pas. Nous garantissons les actions livrées, les correctifs posés, les contenus écrits, les cibles de citation traitées, et la mesure rejouée à l'identique pour que vous constatiez vous-même l'écart.",
    r: (
      <>
        Aucun score, aucune position. Il n'y a pas de classement dans <M>ChatGPT</M> : personne ne
        peut vendre une place qui n'existe pas. Nous garantissons les actions livrées, les
        correctifs posés, les contenus écrits, les cibles de citation traitées, et la mesure rejouée
        à l'identique pour que vous constatiez vous-même l'écart.
      </>
    ),
  },
  {
    q: "Combien de temps avant que ça se voie ?",
    plain:
      "Les moteurs intègrent les modifications d'un site en 4 à 12 semaines, selon leurs propres cycles. C'est pourquoi la mesure de contrôle est fixée à J+90 et pas à J+30.",
    r: (
      <>
        Les moteurs intègrent les modifications d'un site en <M>4 à 12 semaines</M>, selon leurs
        propres cycles. C'est pourquoi la mesure de contrôle est fixée à <M>J+90</M> et pas à{" "}
        <M>J+30</M>.
      </>
    ),
  },
  {
    q: "Comment savoir que l'écart ne vient pas du hasard ?",
    plain:
      "Les questions sont scellées le premier jour et rejouées telles quelles, sur les mêmes moteurs, avec la même formule. Nous ne pouvons pas choisir après coup des questions plus favorables. Une partie de l'écart vient malgré tout des mises à jour de modèles par les éditeurs : nous figeons les versions quand l'API le permet, et nous l'écrivons dans le rapport quand elle ne le permet pas.",
    r: (
      <>
        Les questions sont scellées le premier jour et rejouées telles quelles, sur les mêmes
        moteurs, avec la même formule. Nous ne pouvons pas choisir après coup des questions plus
        favorables. Une partie de l'écart vient malgré tout des mises à jour de modèles par les
        éditeurs : nous figeons les versions quand l'<M>API</M> le permet, et nous l'écrivons dans
        le rapport quand elle ne le permet pas.
      </>
    ),
  },
  {
    q: "Le scan gratuit, c'est un teaser ?",
    plain:
      "C'est une mesure réelle, sur un échantillon réduit du même protocole. Votre score s'affiche entier. Ce que vous n'avez pas gratuitement, ce sont les phrases exactes et le plan de correction, pas la mesure.",
    r: (
      <>
        C'est une mesure réelle, sur un échantillon réduit du même protocole. Votre score s'affiche
        entier. Ce que vous n'avez pas gratuitement, ce sont les phrases exactes et le plan de
        correction, pas la mesure.
      </>
    ),
  },
  {
    q: "Et si mon score est déjà bon ?",
    plain:
      "Nous vous le disons et nous ne vous vendons rien. C'est le cas le plus probable pour une marque déjà bien référencée sur son secteur, et ce n'est pas un problème : le scan aura répondu à la question que vous vous posiez.",
    r: (
      <>
        Nous vous le disons et nous ne vous vendons rien. C'est le cas le plus probable pour une
        marque déjà bien référencée sur son secteur, et ce n'est pas un problème : le scan aura
        répondu à la question que vous vous posiez.
      </>
    ),
  },
  {
    q: "En quoi est-ce différent du SEO ?",
    plain:
      "Le SEO vous fait apparaître dans une liste de liens. Le GEO vous fait citer dans une phrase. Un moteur d'IA ne classe pas dix résultats : il en nomme deux ou trois, et il n'y a pas de deuxième page. Les leviers se recouvrent en partie, la mesure et les priorités non.",
    r: (
      <>
        Le <M>SEO</M> vous fait apparaître dans une liste de liens. Le <M>GEO</M> vous fait citer
        dans une phrase. Un moteur d'IA ne classe pas dix résultats : il en nomme deux ou trois, et
        il n'y a pas de deuxième page. Les leviers se recouvrent en partie, la mesure et les
        priorités non.
      </>
    ),
  },
  {
    q: "Pourquoi pas un outil de suivi à 59 € par mois ?",
    plain:
      "Un outil mesure et affiche. Il ne réécrit pas vos pages, ne pose pas vos correctifs techniques et ne va pas chercher les sources que les IA citent. Si vous avez déjà l'équipe pour agir, un outil suffit peut-être. Le sprint existe pour ceux qui n'ont personne pour faire le travail.",
    r: (
      <>
        Un outil mesure et affiche. Il ne réécrit pas vos pages, ne pose pas vos correctifs
        techniques et ne va pas chercher les sources que les IA citent. Si vous avez déjà l'équipe
        pour agir, un outil suffit peut-être. Le sprint existe pour ceux qui n'ont personne pour
        faire le travail.
      </>
    ),
  },
  {
    q: "Pourquoi pas mon agence SEO actuelle ?",
    plain:
      "Si elle mesure votre présence dans les réponses d'IA et sait la corriger, gardez-la. Posez-lui la question avant de nous appeler : c'est la façon la plus rapide de savoir si vous avez besoin de nous.",
    r: (
      <>
        Si elle mesure votre présence dans les réponses d'IA et sait la corriger, gardez-la.
        Posez-lui la question avant de nous appeler : c'est la façon la plus rapide de savoir si
        vous avez besoin de nous.
      </>
    ),
  },
  {
    q: "Vous avez des clients à montrer ?",
    plain:
      "Pas encore. Citari est récente et nous préférons l'écrire plutôt que de maquiller trois logos. C'est aussi la raison pour laquelle le prix est affiché, la formule publiée et les questions scellées : nous n'avons rien d'autre à vous offrir que ce que vous pouvez vérifier vous-même.",
    r: (
      <>
        Pas encore. Citari est récente et nous préférons l'écrire plutôt que de maquiller trois
        logos. C'est aussi la raison pour laquelle le prix est affiché, la formule publiée et les
        questions scellées : nous n'avons rien d'autre à vous offrir que ce que vous pouvez vérifier
        vous-même.
      </>
    ),
  },
  {
    q: "Travaillez-vous avec mes concurrents ?",
    plain:
      "Un seul client par secteur et par zone, et trois sprints par mois au maximum. Si un concurrent direct est déjà engagé sur votre zone, nous vous le disons au premier échange.",
    r: (
      <>
        Un seul client par secteur et par zone, et <M>trois sprints par mois</M> au maximum. Si un
        concurrent direct est déjà engagé sur votre zone, nous vous le disons au premier échange.
      </>
    ),
  },
  {
    q: "Que faites-vous de mon adresse email ?",
    plain:
      "Elle sert à vous envoyer votre rapport et, si vous ne donnez pas suite, deux ou trois relances. Elle n'est ni revendue, ni transmise. Vous pouvez demander sa suppression à tout moment.",
    r: (
      <>
        Elle sert à vous envoyer votre rapport et, si vous ne donnez pas suite, deux ou trois
        relances. Elle n'est ni revendue, ni transmise. Vous pouvez demander sa suppression à tout
        moment.
      </>
    ),
  },
  {
    q: "Qu'attendez-vous de moi pendant le sprint ?",
    plain:
      "Un accès à votre site ou un interlocuteur technique disponible la première semaine, et une validation des contenus. C'est la seule dépendance du calendrier : un accès qui tarde décale tout le reste.",
    r: (
      <>
        Un accès à votre site ou un interlocuteur technique disponible la <M>première semaine</M>,
        et une validation des contenus. C'est la seule dépendance du calendrier : un accès qui tarde
        décale tout le reste.
      </>
    ),
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ENTREES.map((e) => ({
    "@type": "Question",
    name: e.q,
    acceptedAnswer: { "@type": "Answer", text: e.plain },
  })),
};

const num = (i: number) => String(i + 1).padStart(2, "0");

function Entree({ entree, index }: { entree: Entree; index: number }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="border-b border-rule">
      <h3 className="m-0">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          className="group flex w-full items-baseline gap-4 py-5 text-left transition-colors duration-200 hover:bg-paper-2/40 sm:gap-6"
        >
          <span className="w-[2.2em] shrink-0 font-mono text-[12px] tabular-nums text-ink-2">
            {num(index)}
          </span>
          <span className="flex-1 font-sans text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink sm:text-[21px]">
            {entree.q}
          </span>
          <span className="shrink-0 px-1">
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 text-ink-2 transition-transform duration-300 ease-out group-hover:text-ink"
              style={{ transform: ouvert ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </span>
        </button>
      </h3>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: ouvert ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-6 sm:pl-[calc(2.2em+1.5rem)]">
            <p className="max-w-[64ch] font-sans text-[15.5px] leading-[1.65] text-ink-2 sm:text-[16px]">
              {entree.r}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionFAQ() {
  const [visibles, setVisibles] = useState(5);
  const liste = ENTREES.slice(0, visibles);
  const reste = visibles < ENTREES.length;

  return (
    <section id="faq" className="surface-hollow relative">
      <div className="rule-fade absolute inset-x-0 top-0" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2">{LABEL}</p>
        <h2 className="mt-4 max-w-[24ch] font-sans text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink sm:text-[44px]">
          {TITRE}
        </h2>

        <div className="mt-12 border-t border-ink">
          {liste.map((e, i) => (
            <Entree key={e.q} entree={e} index={i} />
          ))}
        </div>

        {reste ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibles((n) => Math.min(n + 5, ENTREES.length))}
              className="cta-sweep group inline-flex items-center justify-center gap-3 border border-ink bg-ink px-6 py-3 text-paper transition-colors duration-300 active:scale-[0.98]"
            >
              <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em]">
                voir plus
              </span>
              <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-y-0.5">
                ↓
              </span>
            </button>
          </div>
        ) : null}

        <p className="mt-8 font-mono text-[12px] leading-[1.6] text-ink-2">
          Une question qui n'est pas là ?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-underline text-ink">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}
