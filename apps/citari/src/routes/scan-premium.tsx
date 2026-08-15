import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { Reveal } from "@/components/jeremie/Reveal";
import { CardGrid, DataRows, MethodeCard } from "@/components/jeremie/methode";
import { SiteFooter } from "@/components/jeremie/SectionFinalCTA";
import { bookingUrl } from "@/lib/site";

/**
 * Le scan premium, déplié.
 *
 * Troisième notice technique du site (15/08/2026), née d'un défaut relevé
 * par Luigi : les cartes 01 et 02 du parcours renvoyaient toutes deux vers
 * /methode. Deux étapes, deux documents — celle-ci décrit ce que le scan
 * premium mesure, ce qu'on en repart, et le cadre de l'appel.
 *
 * Sources de vérité : la carte de réservation du rapport (déroulé, ~300
 * appels payants), CarteDiagnostic (le comparatif aperçu/premium),
 * docs/LIVRAISON.md. Les règles de toujours : offert mais jamais « gratuit
 * et sans condition » — il se lit ENSEMBLE, en visio ; aucun score promis ;
 * un moteur en panne est exclu de la mesure, on ne promet donc jamais un
 * compte fixe de réponses par moteur.
 */

const TITLE = "Le scan premium, déplié — Citari";
const DESCRIPTION =
  "Ce que mesure le scan premium Citari : 24 questions posées aux six moteurs d'IA avec recherche web, les sources qu'ils consultent, votre note par moteur, et le cadre de l'appel de lecture. Offert, lancé dès la réservation.";

export const Route = createFileRoute("/scan-premium")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
    ],
  }),
  component: ScanPremiumPage,
});

const SECTIONS = [
  { id: "quoi", num: "00", label: "Ce que c'est" },
  { id: "mesure", num: "01", label: "La mesure, à l'échelle réelle" },
  { id: "repartez", num: "02", label: "Ce que vous emportez" },
  { id: "deroule", num: "03", label: "Le déroulé de l'appel" },
  { id: "offert", num: "04", label: "Pourquoi c'est offert" },
];

const mono = "font-mono text-[12px] tracking-[0.08em]";

const CHIFFRES = [
  { valeur: "144", libelle: "réponses d'IA lues, contre 40 à l'aperçu" },
  { valeur: "6", libelle: "moteurs, recherche web activée" },
  { valeur: "30", libelle: "minutes en visio, pour le lire ensemble" },
  { valeur: "0 €", libelle: "offert, lancé dès votre réservation" },
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

/** Une pièce du rapport : ce que c'est, pourquoi elle compte. */
function Pieces({ lignes }: { lignes: { quoi: string; detail: string }[] }) {
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

const PIECES = [
  {
    quoi: "Les adresses que chaque moteur a ouvertes avant de citer un nom",
    detail:
      "Quatre des six moteurs lisent le web en répondant, et disent où. Vous obtenez la liste des pages qui font recommander vos concurrents aujourd'hui : c'est là qu'il faut apparaître, et c'est le point de départ de tout le travail.",
  },
  {
    quoi: "Votre note, moteur par moteur",
    detail:
      "Les six moteurs ne se ressemblent pas : être bien traité par Gemini n'a jamais protégé personne chez Perplexity. Vous voyez où ça va, et où ça brûle.",
  },
  {
    quoi: "La fiche que chaque IA récite quand on lui donne votre nom",
    detail:
      "Souvent périmée, parfois confondue avec un homonyme. C'est la réponse que reçoit un prospect, un candidat ou un banquier qui vous cherche, et personne ne vous l'avait montrée.",
  },
  {
    quoi: "Toutes les réponses, conservées mot pour mot",
    detail:
      "Rien n'est résumé ni reformulé. Un dirigeant sceptique peut relire chaque réponse et retrouver la phrase exacte qui recommande son concurrent.",
  },
  {
    quoi: "L'ordre des corrections",
    detail:
      "Ce que votre développeur règle en une heure, ce qui mérite un vrai chantier, et ce que vous pouvez faire sans nous. Classé, pas empilé.",
  },
  {
    quoi: "Votre point de départ, scellé",
    detail:
      "Les 24 questions sont figées le jour de la mesure et rejouables à l'identique dans 90 jours. Si un travail est mené ensuite, son effet se mesurera chiffre contre chiffre, il ne se racontera pas.",
  },
];

function ScanPremiumPage() {
  const lienReservation = bookingUrl();

  return (
    <>
      <div className="surface-edge relative">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-20 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
          <Toc />

          <div className="max-w-[68ch]">
            <p className={`${mono} uppercase text-ink-2`}>La mesure complète</p>
            <h1 className="mt-3 font-sans text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]">
              Le scan premium, déplié.
            </h1>
            <p className="mt-6 font-sans text-[17px] leading-[1.6] text-ink sm:text-[19px]">
              L'aperçu gratuit vous a montré la surface : deux moteurs, de mémoire. Le scan premium
              rejoue la mesure en conditions réelles — six moteurs, recherche web activée — et
              remonte ce qu'aucun aperçu ne peut voir : les sources exactes sur lesquelles les IA
              s'appuient pour recommander quelqu'un d'autre.
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
              <Section id="quoi" num="00" title="Ce que c'est">
                <p>
                  Une mesure complète de votre visibilité dans les réponses des IA,{" "}
                  <strong className="font-semibold">
                    lancée dès que vous réservez votre créneau
                  </strong>
                  . Quand nous nous parlons, les 144 réponses sont déjà collectées : l'appel n'est
                  pas un rendez-vous de découverte, c'est la lecture de votre rapport, ensemble, en
                  trente minutes.
                </p>
                <p>
                  Vous repartez avec le rapport complet et le plan d'action,{" "}
                  <strong className="font-semibold">que vous travailliez avec nous ou non</strong>.
                  Ni carte bancaire, ni engagement : un créneau et votre email suffisent.
                </p>
              </Section>

              <Section id="mesure" num="01" title="La mesure, à l'échelle réelle">
                <p>
                  L'aperçu interroge deux moteurs qui répondent de mémoire. Le scan premium
                  interroge <strong className="font-semibold">les six, recherche web activée</strong> :
                  les moteurs vont lire le web au moment de répondre, exactement comme ils le font
                  devant vos clients. C'est ce qui change tout — et c'est ce qui coûte.
                </p>
                <CardGrid>
                  <MethodeCard eyebrow="L'aperçu gratuit">
                    <DataRows
                      rows={[
                        ["Questions", "20"],
                        ["Moteurs", "2"],
                        ["Réponses lues", "40"],
                        ["Recherche web", "non"],
                        ["Sources remontées", "non"],
                      ]}
                    />
                  </MethodeCard>
                  <MethodeCard eyebrow="Le scan premium">
                    <DataRows
                      rows={[
                        ["Questions", "24"],
                        ["Moteurs", "6"],
                        ["Réponses lues", "144"],
                        ["Recherche web", "oui"],
                        ["Sources remontées", "la liste"],
                      ]}
                    />
                  </MethodeCard>
                </CardGrid>
                {/* La frontière entre les deux notices, dite explicitement :
                    Luigi a lui-même demandé si elles ne se ressemblaient pas.
                    /methode = COMMENT on mesure (commune aux deux scans) ;
                    cette page = ce que le scan premium LIVRE. */}
                <p>
                  Le <em>comment</em> — protocole, formule, barème, exemple recalculable à la main
                  — vit sur une seule page,{" "}
                  <Link to="/methode" className="link-underline text-ink">
                    la méthode
                  </Link>
                  , commune aux deux scans. Ici, ce qui vous concerne : ce que la mesure complète
                  livre, et ce que vous en faites.
                </p>
              </Section>

              <Section id="repartez" num="02" title="Ce que vous emportez">
                <p>
                  Six pièces, toutes issues de votre mesure — pas d'un gabarit. La première est
                  celle qui vaut le déplacement : personne d'autre ne vous la donnera.
                </p>
                <Pieces lignes={PIECES} />
              </Section>

              <Section id="deroule" num="03" title="Le déroulé de l'appel">
                <p>
                  Trente minutes en visio, structurées. Pas un tunnel commercial : une lecture de
                  résultats.
                </p>
                <ol className="mt-6 border-l border-rule-strong">
                  {[
                    {
                      quand: "Avant l'appel",
                      quoi: "La mesure tourne. 24 questions, six moteurs, 144 réponses, recherche web activée : tout est collecté et analysé avant que nous nous parlions.",
                    },
                    {
                      quand: "Pendant",
                      quoi: "On ouvre votre rapport ensemble : votre note par moteur, les sites où vos concurrents sont trouvés, la cause de chaque absence.",
                    },
                    {
                      quand: "À la fin",
                      quoi: "Vos actions, classées de la plus prioritaire à la moins urgente — et celles que vous pouvez mener sans nous.",
                    },
                  ].map((t, i) => (
                    <li key={t.quand} className={`relative pl-6 sm:pl-9 ${i === 2 ? "pb-0" : "pb-10"}`}>
                      <span
                        aria-hidden="true"
                        className="absolute -left-[5px] top-[7px] size-[9px] rounded-full bg-ink"
                      />
                      <p className={`${mono} uppercase text-ink-2`}>{t.quand}</p>
                      <p className="mt-2 font-sans text-[16px] leading-[1.6] text-ink">{t.quoi}</p>
                    </li>
                  ))}
                </ol>
                <p className="pt-2">
                  Et si votre visibilité est déjà bonne, nous vous le disons tel quel :{" "}
                  <strong className="font-semibold">
                    nous n'avons rien à vendre à une entreprise que les IA citent déjà.
                  </strong>
                </p>
              </Section>

              <Section id="offert" num="04" title="Pourquoi c'est offert">
                <p>
                  Un scan premium déclenche près de{" "}
                  <strong className="font-semibold">300 appels payants</strong> chez six éditeurs
                  d'IA, recherche web activée, chaque réponse étant ensuite relue par un modèle
                  d'analyse. Neuf minutes de calcul. Nous le prenons à notre charge, parce qu'il
                  n'y a pas de conversation utile sans mesure.
                </p>
                <p>
                  La seule contrepartie est le rendez-vous : ces résultats se lisent à deux. Un
                  score sans quelqu'un pour dire lesquelles de ces données comptent dans votre cas
                  reste un tableau de chiffres.
                </p>
              </Section>

              <section className="border-t border-ink pt-10">
                <h2 className="font-sans text-[24px] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink sm:text-[30px]">
                  La mesure part dès que vous réservez.
                </h2>
                <p className="mt-4 font-sans text-[16px] leading-[1.65] text-ink-2 sm:text-[17px]">
                  Choisissez un créneau : les 144 réponses seront collectées avant l'appel.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-5">
                  <a
                    href={lienReservation}
                    className="cta cta-sweep group inline-flex items-center gap-3 rounded-[4px] px-6 py-3.5"
                  >
                    <span>Réserver mon scan premium</span>
                    <span
                      aria-hidden
                      className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </a>
                  <Link to="/" className="link-underline font-sans text-[15px] text-ink-2">
                    D'abord le scan gratuit, 90 secondes
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
