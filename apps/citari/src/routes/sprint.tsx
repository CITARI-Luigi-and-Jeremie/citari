import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { Reveal } from "@/components/jeremie/Reveal";
import { CardGrid, DataRows, MethodeCard } from "@/components/jeremie/methode";
import { SiteFooter } from "@/components/jeremie/SectionFinalCTA";
import { useScanFormFocus } from "@/lib/scan-form-focus";

/**
 * Le Sprint GEO, déplié.
 *
 * Écrite le 15/08/2026 à la demande de Luigi : « montre qu'on crée une
 * grosse valeur ajoutée, technique et pertinente, très vendeur ». La page
 * vend donc par le DÉTAIL de ce qui est réellement exécuté, pas par des
 * promesses — c'est la seule façon d'être à la fois spectaculaire et
 * conforme à la doctrine.
 *
 * Chaque ligne vient de `docs/LIVRAISON.md`, qui fait foi : les trois
 * chantiers, les huit phases, les 47 étapes, les commandes du toolkit et
 * leurs vérifications. RIEN ici ne doit être inventé, et surtout pas :
 * aucun résultat client (il n'y en a pas encore), aucun score promis,
 * aucun témoignage. Ce qui reste interne au manuel ne monte pas ici : les
 * coûts d'API, la Vigie (non arbitrée), l'état d'avancement du code.
 *
 * L'argument le plus fort de la page est vrai et vérifiable : les jours 31
 * à 90. Une agence livre au jour 30, quand rien n'a encore bougé dans les
 * moteurs. C'est la partie que personne ne fait, et c'est elle qui produit
 * l'écart mesuré à J+90.
 */

const TITLE = "Le Sprint GEO, déplié — Citari";
const DESCRIPTION =
  "Les trois chantiers, les huit phases et les 47 étapes d'un Sprint GEO Citari : ce que la machine exécute, ce que nous faisons à la main, et comment chaque action est vérifiée en ligne.";

export const Route = createFileRoute("/sprint")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
    ],
  }),
  component: SprintPage,
});

const SECTIONS = [
  { id: "regle", num: "00", label: "La règle du jeu" },
  { id: "chantier-1", num: "01", label: "Rendre le site lisible" },
  { id: "chantier-2", num: "02", label: "Créer ce qui se cite" },
  { id: "chantier-3", num: "03", label: "Exister ailleurs" },
  { id: "apres", num: "04", label: "Les 60 jours que personne ne fait" },
  { id: "preuve", num: "05", label: "La preuve, chaque semaine" },
  { id: "prix", num: "06", label: "Le prix, et ce qu'il contient" },
  { id: "limites", num: "07", label: "Ce que nous ne promettons pas" },
];

const mono = "font-mono text-[12px] tracking-[0.08em]";

const CHIFFRES = [
  { valeur: "47", libelle: "étapes suivies, du jour 1 au jour 90" },
  { valeur: "30", libelle: "jours de production" },
  { valeur: "90", libelle: "jours d'accompagnement" },
  { valeur: "24", libelle: "questions scellées, rejouées à l'identique" },
];

function useActiveSection() {
  const [active, setActive] = useState<string>(SECTIONS[0]!.id);
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

/** Une ligne de travail : ce qui est exécuté, et la vérification qui suit. */
function Travaux({ lignes }: { lignes: { quoi: string; detail: string }[] }) {
  return (
    <ol className="mt-6 border-t border-rule-strong">
      {lignes.map((l, i) => (
        <li key={l.quoi} className="flex gap-4 border-b border-rule py-4 sm:gap-6">
          <span className="mt-[3px] font-mono text-[11px] tabular-nums text-signal">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="font-sans text-[16px] font-semibold leading-snug text-ink">{l.quoi}</p>
            <p className="mt-1.5 font-sans text-[15px] leading-[1.55] text-ink-2">{l.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Le fil des 90 jours. Les phases après J30 portent l'accent. */
function Phases({ phases }: { phases: { quand: string; titre: string; corps: string; fort?: boolean }[] }) {
  return (
    <ol className="mt-8 border-l border-rule-strong">
      {phases.map((p, i) => (
        <li
          key={p.quand}
          className={`relative pl-6 sm:pl-9 ${i === phases.length - 1 ? "pb-0" : "pb-10 sm:pb-12"}`}
        >
          <span
            aria-hidden="true"
            className={`absolute -left-[5px] top-[7px] size-[9px] rounded-full ${
              p.fort ? "bg-signal" : "bg-ink"
            }`}
          />
          <Reveal>
            <span className={`${mono} uppercase ${p.fort ? "text-signal" : "text-ink-2"}`}>
              {p.quand}
            </span>
            <h3 className="mt-2 font-sans text-[19px] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink sm:text-[22px]">
              {p.titre}
            </h3>
            <p className="mt-2.5 font-sans text-[15.5px] leading-[1.6] text-ink-2 sm:text-[16px]">
              {p.corps}
            </p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

const PHASES = [
  {
    quand: "Jours 1 à 7 · production",
    titre: "On ouvre les portes",
    corps:
      "Audit technique du site lu comme un robot d'IA, correctifs générés et déployés, puis revérifiés en ligne. Verrouillage de votre identité : mêmes nom, adresse et téléphone partout, fiche Wikidata, liens sameAs, pour qu'aucun moteur ne vous confonde avec un homonyme.",
  },
  {
    quand: "Jours 8 à 21 · production",
    titre: "On écrit ce que les IA peuvent citer",
    corps:
      "Les questions perdues sont classées par gagnabilité, puis les contenus sont rédigés au format que les moteurs reprennent : la réponse en deux phrases, les faits ensuite, le balisage intégré. Chaque page publiée est signalée à Bing dans la foulée.",
  },
  {
    quand: "Jours 22 à 30 · production",
    titre: "On vérifie tout, en ligne",
    corps:
      "Chaque contenu est contrôlé sur le site réel : la page répond, elle porte son balisage, elle figure dans le llms.txt. Chaque citation obtenue est crawlée pour confirmer que votre nom y est vraiment. Puis le rapport de fin de sprint, action par action.",
  },
  {
    quand: "Jours 31 à 45 · maturation",
    titre: "On fait aboutir ce qui a été lancé",
    fort: true,
    corps:
      "Rien de neuf n'est créé : les pitchs restés sans réponse sont relancés, les inscriptions en annuaire suivies jusqu'à validation, et les correctifs techniques revérifiés. Un redéploiement de votre site peut les avoir écrasés sans que personne ne s'en aperçoive : cela arrive, et cela anéantit un sprint en silence.",
  },
  {
    quand: "Jours 45 à 60 · contrôle",
    titre: "Le seul moment où la trajectoire peut encore changer",
    fort: true,
    corps:
      "Une mesure interne rejoue vos questions sur les quatre moteurs qui lisent le web, les seuls susceptibles d'avoir déjà bougé. Si c'est plat, on cherche pourquoi et on réoriente pendant qu'il en est encore temps. Au-delà du jour 60, une action nouvelle n'a plus le temps d'être intégrée par les moteurs.",
  },
  {
    quand: "Jours 60 à 75 · consolidation",
    titre: "On empêche les acquis de disparaître",
    fort: true,
    corps:
      "Une fiche supprimée, une page déplacée, un article dépublié : ce qui a été obtenu peut se défaire. Les citations et les contenus sont recontrôlés un par un, et la dernière vague de relances presse part maintenant, pour qu'une parution ait le temps d'être vue.",
  },
  {
    quand: "Jours 75 à 90 · mesure",
    titre: "Le re-scan, mot pour mot",
    fort: true,
    corps:
      "Les mêmes 24 questions, les mêmes six moteurs, la même formule. Puis le comparatif avant/après, sans mise en scène, et un appel de restitution — y compris si le résultat est mauvais.",
  },
];

const CHANTIER_1 = [
  {
    quoi: "Votre site est lu comme un robot d'IA le lit",
    detail:
      "Robots bloqués, llms.txt absent, balisage manquant : l'audit relève ce qui empêche un moteur de vous comprendre. Beaucoup de sites ferment la porte aux IA sans le savoir, et tant que c'est fermé, rien d'autre ne sert.",
  },
  {
    quoi: "Les correctifs sont écrits, prêts à poser",
    detail:
      "robots.txt, llms.txt, balisage schema.org, plus un document d'instructions pour votre développeur si vous préférez qu'il les pose lui-même.",
  },
  {
    quoi: "Ils sont revérifiés sur le site en ligne",
    detail:
      "C'est le piège numéro un d'un sprint : un correctif écrit n'est pas un correctif déployé. La vérification se fait sur votre site réel, pas sur nos fichiers.",
  },
  {
    quoi: "Les passages des robots sont comptés dans vos logs",
    detail:
      "GPTBot, ClaudeBot, PerplexityBot : leurs visites réelles sont relevées dans les journaux de votre serveur. Passer de zéro à plusieurs dizaines de visites par semaine est une preuve indépendante du score.",
  },
  {
    quoi: "Votre identité est verrouillée",
    detail:
      "Mêmes nom, adresse et téléphone partout, fiche Wikidata, liens sameAs. Une demi-journée qui évite qu'un moteur vous confonde avec un homonyme.",
  },
];

const CHANTIER_2 = [
  {
    quoi: "Les questions perdues sont classées par gagnabilité",
    detail:
      "Toutes ne se valent pas. Certaines sont tenues par des géants pour longtemps, d'autres se prennent en trois mois. Les contenus visent le haut de cette liste, pas les questions les plus flatteuses.",
  },
  {
    quoi: "Chaque contenu est écrit au format que les moteurs reprennent",
    detail:
      "La réponse en deux phrases au début, les faits ensuite, le balisage intégré. Une plaquette commerciale n'est jamais citée ; une page qui répond, si.",
  },
  {
    quoi: "Vos chiffres réels remplacent chaque champ laissé vide",
    detail:
      "La machine rédige la structure et laisse en clair ce qu'elle ne sait pas. Elle n'invente aucun chiffre à votre place : c'est vous qui les fournissez, nous qui les intégrons.",
  },
  {
    quoi: "Bing est prévenu dès la publication",
    detail:
      "La recherche de ChatGPT s'appuie sur Bing. Signaler une page dès sa mise en ligne la fait indexer en heures au lieu de semaines. Presque personne ne le fait.",
  },
  {
    quoi: "Chaque page est recontrôlée en ligne",
    detail:
      "Elle répond, elle porte son balisage, elle figure dans le llms.txt. Sinon elle ne compte pas.",
  },
];

const CHANTIER_3 = [
  {
    quoi: "On part des pages que les moteurs ont réellement ouvertes",
    detail:
      "Votre scan a relevé les sources consultées avant de recommander vos concurrents. Ce ne sont pas des cibles supposées : ce sont les pages qui les font citer aujourd'hui.",
  },
  {
    quoi: "Les annuaires et comparateurs de votre secteur",
    detail:
      "Inscriptions, fiches, comptes à créer et à faire valider. Le délai de validation est de deux à quatre semaines : c'est précisément pour cela que le suivi ne s'arrête pas au jour 30.",
  },
  {
    quoi: "Le placement dans les classements que les IA citent déjà",
    detail:
      "Les prendre un par un pour y faire ajouter votre nom. Certains sont payants, entre 100 et 300 € : c'est annoncé dans la proposition, jamais découvert en cours de route.",
  },
  {
    quoi: "Les pitchs presse, écrits puis relancés",
    detail:
      "Rédigés à partir de votre mesure, envoyés, puis relancés deux fois. Un pitch sans relance ne produit presque jamais de parution.",
  },
  {
    quoi: "Le kit « dix avis en trente jours »",
    detail:
      "Des gabarits d'email pour vos vrais clients et un QR code. La tonalité et la recommandation explicite pèsent près d'un tiers du score. Des avis réels, de vraies personnes : jamais de faux avis, jamais de faux comptes.",
  },
];

function SprintPage() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    <>
      <div className="surface-edge relative">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-20 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
          <Toc />

          <div className="max-w-[68ch]">
            <p className={`${mono} uppercase text-ink-2`}>Le programme, déplié</p>
            <h1 className="mt-3 font-sans text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]">
              Trente jours de travail. Quatre-vingt-dix jours de suivi.
            </h1>
            <p className="mt-6 font-sans text-[17px] leading-[1.6] text-ink sm:text-[19px]">
              Cette page décrit ce qui se passe réellement après votre signature : les trois
              chantiers, les huit phases, et les quarante-sept étapes qui les composent. Chaque
              action y est vérifiée sur votre site en ligne, pas cochée dans un tableau.
            </p>

            <dl className="mt-10 grid grid-cols-2 border-t border-ink sm:grid-cols-4">
              {CHIFFRES.map((c) => (
                <div
                  key={c.libelle}
                  className="border-b border-rule px-0 py-4 sm:border-r sm:border-rule sm:px-4 sm:first:pl-0 sm:last:border-r-0"
                >
                  <dt className="font-mono text-[26px] leading-none tabular-nums text-ink sm:text-[30px]">
                    {c.valeur}
                  </dt>
                  <dd className="mt-2 font-mono text-[11px] uppercase leading-[1.4] tracking-[0.08em] text-ink-2">
                    {c.libelle}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12">
              <MobileToc />
            </div>

            <div className="mt-12 lg:mt-16">
              <Section id="regle" num="00" title="La règle du jeu">
                <p>
                  Un sprint GEO n'est pas une campagne à l'aveugle.{" "}
                  <strong className="font-semibold">
                    Nous connaissons les questions de l'examen.
                  </strong>{" "}
                  Votre scan en a posé vingt-quatre, elles sont scellées le premier jour, et le
                  re-scan reposera exactement les mêmes. Chaque question où votre nom n'est pas
                  sorti devient une cible précise, pas une intuition.
                </p>
                <p>
                  Deuxième règle, celle qui décide du calendrier : les moteurs ne réagissent pas à
                  la même vitesse.
                </p>
                <CardGrid>
                  <MethodeCard eyebrow="Ils lisent le web en répondant">
                    <p className="mb-3 text-ink-2">
                      ChatGPT, Gemini, Claude et Perplexity consultent des pages au moment de
                      répondre, et citent leurs sources. Ce sont eux qui bougent en premier.
                    </p>
                    <DataRows
                      rows={[
                        ["Délai pour bouger", "semaines"],
                        ["Sources ramenées, mesuré", "739"],
                      ]}
                    />
                  </MethodeCard>
                  <MethodeCard eyebrow="Ils répondent de mémoire">
                    <p className="mb-3 text-ink-2">
                      Grok et Le Chat puisent dans leur entraînement. Le travail les atteint aussi,
                      mais plus tard : c'est celui qui paye sur douze mois.
                    </p>
                    <DataRows
                      rows={[
                        ["Délai pour bouger", "mois"],
                        ["Sources ramenées, mesuré", "0"],
                      ]}
                    />
                  </MethodeCard>
                </CardGrid>
                <p>
                  Nous le disons dès le cadrage plutôt qu'au moment du bilan : le progrès à
                  quatre-vingt-dix jours viendra d'abord des quatre premiers.
                </p>
              </Section>

              <Section id="chantier-1" num="01" title="Rendre votre site lisible">
                <p>
                  Tant qu'un robot d'IA ne peut pas entrer, tout le reste est inutile. Ce chantier
                  est le moins spectaculaire et le plus décisif : c'est la porte.
                </p>
                <Travaux lignes={CHANTIER_1} />
              </Section>

              <Section id="chantier-2" num="02" title="Créer ce que les IA peuvent citer">
                <p>
                  Une IA ne cite pas une page « à propos ». Elle cite une page qui répond à une
                  question précise, avec des faits vérifiables et un balisage qu'elle comprend.
                </p>
                <Travaux lignes={CHANTIER_2} />
                <MethodeCard eyebrow="La règle des comparatifs">
                  <p>
                    Nos comparatifs incluent les vraies forces de vos concurrents. Ce n'est pas de
                    la modestie : une publicité déguisée n'est jamais reprise par un moteur, une
                    comparaison loyale l'est.{" "}
                    <strong className="font-semibold">
                      Et celui qui écrit la comparaison en choisit le cadre.
                    </strong>
                  </p>
                </MethodeCard>
              </Section>

              <Section id="chantier-3" num="03" title="Vous faire exister ailleurs">
                <p>
                  Les moteurs qui lisent le web se fient à des sources tierces. Si personne ne parle
                  de vous, il n'y a rien à reprendre. C'est le chantier que presque aucune agence ne
                  mène, parce qu'il ne s'automatise pas : ce sont des inscriptions, des dossiers et
                  des relances.
                </p>
                <Travaux lignes={CHANTIER_3} />
              </Section>

              <Section id="apres" num="04" title="Les soixante jours que personne ne fait">
                <p>
                  Une agence classique livre au trentième jour et disparaît. Le problème est
                  qu'au trentième jour,{" "}
                  <strong className="font-semibold">presque rien n'a encore bougé</strong> : les
                  pitchs n'ont pas reçu de réponse, les inscriptions ne sont pas validées, les
                  contenus commencent à peine à être indexés.
                </p>
                <p>
                  Le travail se termine donc au jour quatre-vingt-dix, pas au jour trente. Les
                  phases en rouge ci-dessous sont celles qui produisent l'écart mesuré.
                </p>
                <Phases phases={PHASES} />
              </Section>

              <Section id="preuve" num="05" title="La preuve, chaque semaine">
                <p>
                  Vous n'avez pas à nous croire sur parole pendant trente jours. Chaque vendredi du
                  sprint, un email de preuve : ce qui a été fait, avec les liens et les captures.
                  Puis chaque mois jusqu'au terme.
                </p>
                <CardGrid>
                  <MethodeCard eyebrow="Pendant le sprint">
                    <DataRows
                      rows={[
                        ["Email de preuve", "chaque vendredi"],
                        ["Rapport d'étape", "jour 30"],
                        ["Passages de robots", "relevés en continu"],
                      ]}
                    />
                  </MethodeCard>
                  <MethodeCard eyebrow="Jusqu'au jour 90">
                    <DataRows
                      rows={[
                        ["Point d'avancement", "chaque mois"],
                        ["Contrôle interne", "jour 45"],
                        ["Re-scan et comparatif", "jour 90"],
                      ]}
                    />
                  </MethodeCard>
                </CardGrid>
                <p>
                  Le contrôle du jour quarante-cinq ne vous est jamais présenté comme un score :
                  c'est un instrument de pilotage, pas une note. La seule mesure qui vous engage et
                  nous engage est celle du jour quatre-vingt-dix.
                </p>
              </Section>

              <Section id="prix" num="06" title="Le prix, et ce qu'il contient">
                {/* Une seule offre depuis le 15/08/2026 (décision Luigi :
                    « on fait que celui à 2 900 € »). Le Sprint Domination ne
                    s'affiche plus sur le site ; `proposition.ts` sait
                    toujours le générer si un cas s'y prête un jour. Chiffres
                    alignés sur ce fichier, qui produit le document remis au
                    client. */}
                <CardGrid>
                  <MethodeCard eyebrow="Sprint GEO">
                    <p className="mb-3 font-sans text-[24px] font-extrabold tracking-[-0.02em] text-ink">
                      2 900 € HT
                    </p>
                    <DataRows
                      rows={[
                        ["Contenus rédigés", "5"],
                        ["Cibles de citation", "8"],
                        ["Jours de production", "30"],
                        ["Jours de suivi", "90"],
                        ["Re-scan à J+90", "inclus"],
                        ["Paiement", "50 % / 50 %"],
                      ]}
                    />
                  </MethodeCard>
                  <MethodeCard eyebrow="Ce que ça exclut, volontairement">
                    <p className="text-ink-2">
                      Pas d'abonnement, pas de reconduction, pas d'option cachée découverte en
                      cours de route.{" "}
                      <strong className="font-semibold text-ink">
                        Un prix, un programme, une mesure finale.
                      </strong>{" "}
                      Les seuls frais possibles hors sprint sont certains classements payants (100
                      à 300 €), annoncés dans la proposition, jamais imposés.
                    </p>
                  </MethodeCard>
                </CardGrid>
                <p>
                  Une fois, pas par mois.{" "}
                  <strong className="font-semibold">
                    Aucun abonnement, aucune reconduction, rien à résilier.
                  </strong>{" "}
                  Le re-scan du jour quatre-vingt-dix est inclus : il ne serait pas honnête de faire
                  payer la vérification de notre propre travail.
                </p>
                <MethodeCard eyebrow="Un seul client par secteur et par zone">
                  <p>
                    On ne peut pas pousser deux noms sur les trois mêmes places. C'est une règle
                    absolue, et elle joue pour vous exactement autant qu'elle jouerait contre vous
                    si votre concurrent signait le premier.
                  </p>
                </MethodeCard>
              </Section>

              <Section id="limites" num="07" title="Ce que nous ne promettons pas">
                <p>
                  Personne ne contrôle les modèles, et quiconque vous garantit une place dans leurs
                  réponses décrit un mécanisme qui n'existe pas.{" "}
                  <strong className="font-semibold">
                    Nous ne garantissons donc jamais un score.
                  </strong>
                </p>
                <p>Nous garantissons deux choses, toutes deux vérifiables par vous :</p>
                <ol className="border-t border-rule-strong">
                  {[
                    "L'exécution intégrale des trois chantiers, détaillée action par action dans le rapport de fin de mission, avec les vérifications en ligne qui l'accompagnent.",
                    "Le re-scan au jour quatre-vingt-dix : mêmes questions, mêmes moteurs, même formule. Vous comparez chiffre contre chiffre.",
                  ].map((l, i) => (
                    <li key={l} className="flex gap-4 border-b border-rule py-3.5 sm:gap-5">
                      <span className="font-mono text-[12px] tabular-nums text-ink-2">0{i + 1}</span>
                      <span className="min-w-0">{l}</span>
                    </li>
                  ))}
                </ol>
                <p className="pt-2">
                  Les contenus, le balisage et les citations obtenues vous appartiennent, et
                  continuent de travailler pour vous sans nous.{" "}
                  <Link to="/methode" className="link-underline text-ink">
                    La méthode de mesure est publiée en entier
                  </Link>
                  , formule comprise.
                </p>
              </Section>

              <section className="border-t border-ink pt-10">
                <h2 className="font-sans text-[24px] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink sm:text-[30px]">
                  Tout cela commence par une mesure.
                </h2>
                <p className="mt-4 font-sans text-[16px] leading-[1.65] text-ink-2 sm:text-[17px]">
                  Le scan est gratuit et prend quatre-vingt-dix secondes. Si les IA vous citent
                  déjà correctement, nous vous le dirons et nous ne vous vendrons rien.
                </p>
                <div className="mt-7">
                  <Link
                    to="/"
                    onClick={focusAndScroll}
                    className="cta cta-sweep group inline-flex items-center gap-3 rounded-[4px] px-6 py-3.5"
                  >
                    <span>Lancer le scan gratuit</span>
                    <span
                      aria-hidden
                      className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
