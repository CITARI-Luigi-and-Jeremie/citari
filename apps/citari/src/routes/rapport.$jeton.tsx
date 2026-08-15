import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LogoLien } from "@/components/logo";
import { chargerRapport } from "@/lib/scan.functions";
import { Etiquette, Label, Rule } from "@/components/kit";
import {
  Actions,
  LimiteMethodologique,
  PartDeVoix,
  ScoreGeant,
  ScoresMoteurs,
  Sources,
  Miroir,
  AuditRobots,
  TableauRequetes,
  ToutesLesReponses,
  Verbatims,
  Vide,
  type Mention,
  type Question,
  type Reponse,
} from "@/components/rapport";
import { dateFr, fr, frTitre, verdict, MOTEURS, NBSP } from "@/lib/typo";
import { bookingUrl } from "@/lib/site";
import { useEffect, useMemo, useState } from "react";
import { SequenceResultat } from "@/components/jeremie/rapport/SequenceResultat";
import { BookingModal } from "@/components/jeremie/rapport/BookingModal";
import { construireSequence } from "@/lib/rapport-sequence";
import type { LigneMention, LigneQuestion, LigneReponse } from "@/lib/rapport-apercu";

export const Route = createFileRoute("/rapport/$jeton")({
  loader: async ({ params }) => {
    const data = await chargerRapport({ data: { jeton: params.jeton } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const titre = loaderData
      ? `Rapport de visibilité IA · ${loaderData.scan.brand_name}`
      : "Rapport indisponible";
    const desc =
      "Score de visibilité IA, part de voix et sources citées par ChatGPT, Claude, Gemini, Perplexity, Grok et Le Chat.";
    return {
      meta: [
        { title: titre },
        { name: "description", content: desc },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: titre },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32">
      <h1 className="text-[48px]">Rapport introuvable</h1>
      <p className="mt-4 text-ink-2">Ce lien est incorrect ou le rapport a été supprimé.</p>
      <Link to="/" className="ink-link mt-6 inline-block">
        Revenir à l’accueil
      </Link>
    </div>
  ),
  component: Rapport,
});

const SECTIONS = [
  ["score", "Score global"],
  ["voix", "Part de voix"],
  ["requetes", "Requête par requête"],
  ["verbatims", "Verbatims"],
  ["reponses", "Toutes les réponses"],
  ["miroir", "Ce que les IA disent de vous"],
  ["technique", "Accès des robots"],
  ["sources", "Sources citées"],
  ["actions", "Actions prioritaires"],
] as const;

/**
 * Le rapport, deux artefacts sous une seule adresse.
 *
 * En mode `apercu` (20 questions × 2 moteurs), c'est une page de conversion :
 * la maquette de Jérémie, où les quatre moteurs non interrogés sont montrés
 * verrouillés. En mode `complet` ou `controle`, c'est le document de mesure :
 * les six moteurs ont réellement répondu, et en verrouiller un serait mentir
 * au client qui vient de payer pour l'avoir.
 *
 * C'est le mode du scan qui décide, jamais une préférence d'affichage.
 */
function Rapport() {
  const data = Route.useLoaderData();
  return data.scan.mode === "apercu" ? <RapportDApercu /> : <RapportComplet />;
}

/**
 * L'aperçu, version v3 : la séquence de pop-ups de Jérémie, une carte à la
 * fois sur fond sombre quadrillé, alimentée par nos lignes réelles.
 */
function RapportDApercu() {
  const { scan, questions, reponses, mentions } = Route.useLoaderData();
  const [reservation, setReservation] = useState(false);
  const [large, setLarge] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  // Compteur, pas booléen : le lien de la barre haute doit pouvoir ramener à
  // l'étape des questions autant de fois qu'on clique dessus.
  const [sautQuestions, setSautQuestions] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const onChange = () => setLarge(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // L'email saisi au formulaire, si cette session de navigateur l'a gardé :
  // Calendly le préremplit. Un rapport rouvert ailleurs s'en passe simplement.
  useEffect(() => {
    try {
      setEmail(sessionStorage.getItem("citari:email"));
    } catch {
      setEmail(null);
    }
  }, []);

  const donnees = useMemo(
    () =>
      construireSequence({
        marque: scan.brand_name,
        domaine: scan.website_url,
        date: scan.completed_at ?? scan.created_at,
        score: Math.round(Number(scan.score_global ?? 0)),
        secteur: scan.sector,
        questions: questions as LigneQuestion[],
        reponses: reponses as unknown as LigneReponse[],
        mentions: mentions as unknown as LigneMention[],
        classes: (scan.concurrent_classes ?? {}) as Record<string, string>,
        alias: (scan.brand_aliases ?? {}) as Record<string, string>,
        // Payés par le scan gratuit, invisibles jusqu'au 14/08/2026 : les
        // composantes du score, la question miroir et l'audit des robots.
        mesures: scan,
        miroir: scan.miroir,
        audit: scan.audit,
      }),
    [scan, questions, reponses, mentions],
  );

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* barre haute */}
      <div className="flex items-center justify-between gap-4 border-b border-rule-strong bg-paper px-4 py-3 sm:px-10 sm:py-4">
        <Link to="/" aria-label="Citari, retour à l'accueil" className="block">
          <img src="/img/citari-logo.png" alt="Citari" width={680} height={160} className="h-[20px] w-auto" />
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-5">
          <span className="mono hidden text-[13px] text-ink-2 lg:inline">{donnees.domaine}</span>
          {/* L'accès direct aux questions, depuis la première carte. Il menait
              à une annexe sous la séquence ; il mène désormais à l'étape qui
              les porte, seule surface où elles vivent encore. */}
          <button
            type="button"
            onClick={() => setSautQuestions((n) => n + 1)}
            className="mono whitespace-nowrap text-[13px] text-ink-2 underline underline-offset-4 transition-colors hover:text-ink sm:text-[14px]"
          >
            Les {donnees.totalQuestions} questions
          </button>
          <button
            type="button"
            onClick={() => setReservation(true)}
            className="cta cta-sweep whitespace-nowrap rounded-[4px] px-3 py-2 text-[13px] sm:px-4 sm:py-2.5 sm:text-[15px]"
          >
            Réserver mon scan premium
          </button>
        </div>
      </div>

      {/* L'annexe des questions vivait ICI, sous la séquence, avec deux liens
          pour y descendre. Un écran plein la précédait : personne ne
          soupçonnait qu'il y avait quelque chose en dessous, et c'était la
          pièce qui prouve toute la mesure. Elle est devenue l'étape
          « questions » de la séquence (14/08/2026). Ne pas la rétablir ici :
          la même pièce à deux endroits est le piège déjà payé avec les deux
          comparatifs, et la page d'aperçu ne se scrolle plus du tout. */}
      <SequenceResultat
        data={donnees}
        questions={questions as Question[]}
        reponses={reponses as unknown as Reponse[]}
        mentions={mentions as unknown as Mention[]}
        wide={large}
        onBook={() => setReservation(true)}
        sautVersQuestions={sautQuestions}
      />

      <BookingModal
        open={reservation}
        onClose={() => setReservation(false)}
        marque={donnees.marque}
        email={email}
      />
    </div>
  );
}

function RapportComplet() {
  const { scan, questions, reponses, mentions, precedent } = Route.useLoaderData();
  const marque = scan.brand_name;
  const score = Math.round(Number(scan.score_global ?? 0));
  const pdv = (Array.isArray(scan.share_of_voice) ? scan.share_of_voice : []) as {
    name: string;
    count: number;
    share: number;
    target: boolean;
  }[];
  const actions = (Array.isArray(scan.actions) ? scan.actions : []) as {
    chantier: string;
    titre: string;
    pourquoi: string;
    effort: string;
  }[];
  // Les six, toujours. Il en manquait deux — Grok et Le Chat — et le rapport
  // les affichait donc « — » alors qu'ils avaient bien été interrogés et notés.
  const parMoteur: Record<string, number | null> = {
    ChatGPT: scan.score_chatgpt as number | null,
    Claude: scan.score_claude as number | null,
    Gemini: scan.score_gemini as number | null,
    Perplexity: scan.score_perplexity as number | null,
    Grok: scan.score_grok as number | null,
    "Le Chat": scan.score_mistral as number | null,
  };
  // Le nombre de moteurs dépend du mode : annoncer « × 6 moteurs » sur un
  // aperçu qui en interroge deux gonfle l'ampleur de la mesure vendue.
  const moteursInterroges = MOTEURS.filter((m) => parMoteur[m] !== null).length || MOTEURS.length;

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
      {/* En-tête éditorial, calé à gauche */}
      <header className="pt-14 md:pt-20">
        <div className="flex items-baseline justify-between gap-6">
          <LogoLien hauteur={24} className="no-print" />
          <button
            type="button"
            onClick={() => window.print()}
            className="label-xs no-print ink-link"
          >
            imprimer
          </button>
        </div>
        <h1 className="mt-8 text-[64px] leading-[0.92] md:text-[96px]">{marque}</h1>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 border-t border-rule-strong pt-3">
          {[
            ["secteur", scan.sector],
            ["site", scan.website_url ?? "—"],
            ["date", scan.completed_at ? dateFr(scan.completed_at) : dateFr(scan.created_at)],
            ["échantillon", `${questions.length} questions × ${moteursInterroges} moteurs`],
            ["réponses", `${reponses.length}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-xs">{k}</dt>
              <dd className="num text-[14px]">{v}</dd>
            </div>
          ))}
        </dl>
        {precedent ? (
          <div className="mt-4">
            <Etiquette ton="signal">
              mode comparaison · scan initial du {precedent.date ? dateFr(precedent.date) : "—"}
            </Etiquette>
          </div>
        ) : null}
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[168px_1fr] lg:gap-16">
        {/* Rail de navigation */}
        <nav className="no-print h-max lg:sticky lg:top-10">
          <Label className="pb-2">sections</Label>
          <Rule strong />
          <ol>
            {SECTIONS.map(([id, titre], i) => (
              <li key={id} className="border-b border-rule">
                <a href={`#${id}`} className="flex items-baseline gap-2 py-2 text-[13px] hover:text-signal">
                  <span className="num text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  {titre}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0">
          <Section id="score" titre="Score de visibilité IA">
            <ScoreGeant
              score={score}
              verdict={verdict(score)}
              ecart={precedent ? score - Math.round(precedent.score) : null}
            />
            <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
              {fr(
                `Le score pondère quatre indicateurs : taux de mention (50 %), position moyenne dans la réponse (20 %), recommandation explicite (20 %) et sentiment (10 %).`,
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-x-12 gap-y-4 border-t border-rule pt-4">
              {[
                ["taux de mention", pct(scan.mention_rate)],
                ["position moyenne", scan.avg_position ? Number(scan.avg_position).toFixed(1).replace(".", ",") : "—"],
                ["recommandation explicite", pct(scan.reco_rate)],
                ["sentiment", pct(scan.sentiment_score)],
              ].map(([k, v]) => (
                <div key={k}>
                  <Label>{k}</Label>
                  <div className="num text-[26px] leading-tight">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <ScoresMoteurs scores={parMoteur} avant={precedent?.parMoteur ?? null} />
            </div>
          </Section>

          <Section id="voix" titre="Part de voix">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Mentions de la marque rapportées au total des mentions relevées, concurrents compris. La marque suivie est en rouge signal ; le contexte reste neutre.",
              )}
            </p>
            <PartDeVoix items={pdv} />
            {precedent && Array.isArray(precedent.pdv) && precedent.pdv.length ? (
              <div className="mt-10">
                <Label className="pb-3">au scan initial</Label>
                <PartDeVoix items={precedent.pdv} />
              </div>
            ) : null}
          </Section>

          <Section id="requetes" titre="Requête par requête">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Échantillon figé : le re-scan à J+90 rejoue exactement ces mêmes questions, sinon la comparaison ne vaut rien.",
              )}
            </p>
            <TableauRequetes
              questions={questions as Question[]}
              reponses={reponses as unknown as Reponse[]}
              mentions={mentions as unknown as Mention[]}
              marque={marque}
            />
          </Section>

          <Section id="verbatims" titre="Verbatims bruts">
            <Verbatims mentions={mentions as unknown as Mention[]} marque={marque} />
          </Section>

          <Section id="reponses" titre="Toutes les réponses, mot pour mot">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Rien n'est résumé ni reformulé : chaque réponse est conservée telle que le moteur l'a produite, et rejouable à l'identique au re-scan. Dépliez une question pour lire ce que chaque IA a répondu.",
              )}
            </p>
            <ToutesLesReponses
              questions={questions as Question[]}
              reponses={reponses as unknown as Reponse[]}
              mentions={mentions as unknown as Mention[]}
              marque={marque}
            />
          </Section>

          {/* Le miroir et l'audit des robots : le rapport GRATUIT les affiche
              depuis le 14/08/2026, et le tableau comparatif promet ici « 6
              moteurs » et les robots contrôlés. Un rapport payant qui tient
              moins que l'aperçu qu'il prolonge est la pire promesse rompue
              possible. */}
          <Section id="miroir" titre="Ce que les IA disent de vous">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "La seule question du scan qui prononce votre nom, posée à chaque moteur. Elle est hors méthodologie et ne compte pas dans le score : les autres questions mesurent la découverte spontanée, celle-ci mesure ce que les IA récitent quand on les interroge sur vous.",
              )}
            </p>
            <Miroir miroir={scan.miroir} marque={marque} />
          </Section>

          <Section id="technique" titre="Ce que les robots d'IA peuvent lire">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Relevé sur le fichier public robots.txt de votre site. Un robot refusé ne lira jamais ce que vous publiez, quel que soit le contenu.",
              )}
            </p>
            <AuditRobots audit={scan.audit} domaine={scan.website_url} />
          </Section>

          <Section id="sources" titre="Sources citées par Perplexity">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Voilà où il faut être. Ces domaines sont ceux que le moteur consulte pour répondre aux questions de votre marché.",
              )}
            </p>
            <Sources reponses={reponses as unknown as Reponse[]} />
          </Section>

          <Section id="actions" titre="Dix actions prioritaires">
            <Actions actions={actions} />
          </Section>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <LimiteMethodologique />
            <div className="max-w-[46ch] border-t border-rule-strong pt-3">
              <Etiquette>engagement</Etiquette>
              <p className="mt-2 text-[13px] leading-snug text-ink-2">
                {fr(
                  "Nous garantissons les actions livrées, pas un score. Les moteurs intègrent les changements de contenu et de citations en 4 à 12 semaines : c’est pourquoi le re-scan est planifié à J+90.",
                )}
              </p>
            </div>
          </div>

          {!reponses.length ? <Vide>Aucune réponse collectée pour ce scan.</Vide> : null}

          <Restitution marque={marque} />
        </main>
      </div>

      <footer className="mt-24 border-t border-rule-strong pt-4">
        <p className="num text-[11px] text-ink-3">
          Citari{NBSP}· rapport {scan.report_token.slice(0, 8)}{NBSP}·{" "}
          {frTitre("mesure par API officielles, sans scraping")}
        </p>
      </footer>
    </div>
  );
}

/**
 * Le mur de restitution.
 *
 * Porté du projet Lovable de Jérémie (`BookingWall`) le 08/08/2026 : le rapport
 * s'arrêtait jusqu'ici sur une note méthodologique, sans jamais proposer la
 * suite. C'est pourtant la page où le prospect est le plus convaincu.
 *
 * Ne rien promettre sur le résultat : on vend trente minutes de lecture du
 * rapport, et on dit à voix haute qu'un bon score ne débouche sur aucune vente.
 */
function Restitution({ marque }: { marque: string }) {
  const lien = bookingUrl({ name: marque });
  return (
    <section className="no-print mt-24 border border-ink p-6 sm:p-12">
      <h2 className="measure text-[26px] sm:text-[34px]">Le rapport se lit mieux à deux.</h2>
      <p className="measure mt-6 text-ink-2">
        {fr(
          "Trente minutes en visio : les questions une par une, les sources sur lesquelles les moteurs s’appuient pour recommander vos concurrents, et vos actions prioritaires, classées. Vous repartez avec le diagnostic, qu’on travaille ensemble ou non.",
        )}
      </p>
      <div className="mt-8">
        <iframe
          src={lien}
          title="Réserver trente minutes avec Citari"
          loading="lazy"
          className="h-[620px] w-full border border-rule-strong bg-paper"
        />
      </div>
      <p className="mt-6">
        <a href={lien} className="cta">
          Réserver mes 30 minutes
        </a>
      </p>
      <p className="mono mt-4 text-[13px] text-ink-2">
        {fr(
          "Appel gratuit. Si votre score est bon, nous vous le disons et nous ne vous vendons rien. Le Sprint GEO, si vous le faites : 2 900 € HT une fois, sans abonnement.",
        )}
      </p>
    </section>
  );
}

function pct(v: unknown) {
  const n = Number(v ?? 0);
  return `${Math.round(n * 100)}${NBSP}%`;
}

function Section({ id, titre, children }: { id: string; titre: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20 scroll-mt-8">
      <div className="mb-6 flex items-baseline gap-4 border-b border-rule-strong pb-2">
        <h2 className="text-[34px] leading-none md:text-[42px]">{titre}</h2>
      </div>
      {children}
    </section>
  );
}
