import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { LogoMoteur } from "@/components/jeremie/LogosMoteurs";
import { bookingUrl } from "@/lib/site";
import { dateFr, fr, verdict } from "@/lib/typo";
import type { Adversaire, Case, QuestionPreparee } from "@/lib/rapport-apercu";

/**
 * Le rapport d'aperçu, maquette de conversion.
 *
 * Portée de `CitariReportScreen` du projet Lovable de Jérémie le 08/08/2026 :
 * verdict, « qui prend votre place », bande de questions, réponses moteur par
 * moteur, et les moteurs du diagnostic complet montrés verrouillés. Sa version
 * tournait sur un jeu d'exemple (« Ledgio, 9 fois sur 36 ») ; celle-ci est
 * alimentée par `rapportParJeton`.
 *
 * Deux écarts assumés avec sa maquette :
 *
 * - Elle est peinte avec NOS jetons (encre, papier, signal) et non sa palette
 *   en dur, qui introduisait un orange hors charte. Le site n'a qu'une palette.
 * - Une carte de moteur verrouillé ne contient AUCUN texte. La sienne floutait
 *   la vraie réponse ; ici le moteur n'a simplement pas été interrogé, il n'y a
 *   rien à cacher et rien à inventer pour meubler la carte.
 *
 * Cette page ne s'affiche que pour un scan en mode aperçu. Verrouiller un
 * moteur réellement interrogé serait un mensonge : voir la route.
 */

type Props = {
  marque: string;
  domaine: string | null;
  date: string | null;
  score: number;
  questions: QuestionPreparee[];
  adversaire: Adversaire | null;
  vosCitations: number;
  laPlusDure: { moteur: string; texte: string; marque: string } | null;
  pdv: { name: string; count: number; share: number; target: boolean }[];
  moteursVerrouilles: string[];
  questionsDuComplet: number;
};

export function RapportApercu({
  marque,
  domaine,
  date,
  score,
  questions,
  adversaire,
  vosCitations,
  laPlusDure,
  pdv,
  moteursVerrouilles,
  questionsDuComplet,
}: Props) {
  const [choisie, setChoisie] = useState(0);
  const [reservation, setReservation] = useState(false);
  const question = questions[choisie];

  return (
    <div className="min-h-screen bg-paper">
      <BarreHaute marque={marque} domaine={domaine} date={date} score={score} onReserver={() => setReservation(true)} />

      <Verdict
        score={score}
        date={date}
        adversaire={adversaire}
        vosCitations={vosCitations}
        laPlusDure={laPlusDure}
        pdv={pdv}
      />

      <AppelIntermediaire onReserver={() => setReservation(true)} />

      {question ? (
        <BandeQuestions
          questions={questions}
          choisie={choisie}
          onChoisir={setChoisie}
          questionsDuComplet={questionsDuComplet}
        />
      ) : null}

      {question ? (
        <Reponses question={question} onReserver={() => setReservation(true)} />
      ) : null}

      <AppelFinal
        moteursVerrouilles={moteursVerrouilles}
        questionsDuComplet={questionsDuComplet}
        onReserver={() => setReservation(true)}
      />

      <FenetreReservation
        ouverte={reservation}
        onFermer={() => setReservation(false)}
        marque={marque}
      />
    </div>
  );
}

/* ───────────────────────────── barre haute ───────────────────────────── */

function BarreHaute({
  marque,
  domaine,
  date,
  score,
  onReserver,
}: {
  marque: string;
  domaine: string | null;
  date: string | null;
  score: number;
  onReserver: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-ink bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link to="/" aria-label="Citari, retour à l'accueil" className="flex items-center">
          <img src="/img/citari-logo.png" alt="Citari" width={680} height={160} className="h-[22px] w-auto" />
        </Link>

        <div className="flex items-center gap-5">
          <span className="mono hidden text-[13px] text-ink-2 lg:inline">
            {domaine ?? marque}
            {date ? ` · ${dateFr(date)}` : ""}
          </span>
          <span className="hidden items-baseline gap-2 sm:flex">
            <span className="mono text-[13px] text-ink-2">score</span>
            <span className="text-[19px] font-extrabold tracking-[-0.03em]">{score}/100</span>
          </span>
          <button type="button" onClick={onReserver} className="cta cta-sweep whitespace-nowrap px-4 py-2.5 text-[15px]">
            Réserver mon diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── verdict et adversaire ──────────────────────── */

function Verdict({
  score,
  date,
  adversaire,
  vosCitations,
  laPlusDure,
  pdv,
}: {
  score: number;
  date: string | null;
  adversaire: Adversaire | null;
  vosCitations: number;
  laPlusDure: { moteur: string; texte: string; marque: string } | null;
  pdv: Props["pdv"];
}) {
  const max = pdv.length ? Math.max(...pdv.map((p) => p.count)) : 1;
  const visibles = pdv.slice(0, 5);

  return (
    <div className="border-b border-ink lg:flex">
      <div className="flex flex-none flex-col justify-center gap-3 border-b border-rule px-5 py-8 sm:px-8 lg:w-[420px] lg:border-b-0 lg:border-r lg:py-14 lg:pl-12">
        <span className="mono text-[12px] uppercase tracking-[0.13em] text-ink-2">
          votre score{date ? ` · ${dateFr(date)}` : ""}
        </span>
        <p className="flex items-baseline gap-2">
          <span className="text-[104px] font-extrabold leading-[0.78] tracking-[-0.06em] lg:text-[120px]">
            {score}
          </span>
          <span className="text-[30px] font-extrabold tracking-[-0.04em] text-ink-2 lg:text-[34px]">
            /100
          </span>
        </p>
        <p className="text-[19px] font-semibold tracking-[-0.02em]">{verdict(score)}</p>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 py-8 sm:px-8 lg:py-14 lg:pr-12">
        <div className="flex flex-col gap-2.5">
          <span className="mono text-[12px] uppercase tracking-[0.13em]" style={{ color: "var(--signal)" }}>
            qui prend votre place
          </span>
          {adversaire ? (
            <>
              <p className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] lg:text-[44px]">
                {adversaire.nom}, {adversaire.citations} fois sur {adversaire.total}.
              </p>
              <p className="max-w-[62ch] text-[15.5px] leading-[1.5] text-ink-2 lg:text-[17px]">
                {fr(
                  `C'est le nom qui revient le plus souvent quand les moteurs répondent aux questions de votre marché. Vous êtes nommé ${vosCitations} fois.`,
                )}
              </p>
            </>
          ) : (
            <p className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em]">
              Aucun concurrent ne ressort de cet échantillon.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          {laPlusDure ? (
            <figure
              className="flex flex-1 flex-col gap-2 border-l-2 pl-4"
              style={{ borderColor: "var(--signal)" }}
            >
              <blockquote className="quote-serif text-[18px] leading-[1.45] lg:text-[21px]">
                « {laPlusDure.texte} »
              </blockquote>
              <figcaption className="mono text-[13px] text-ink-2">
                {laPlusDure.moteur} · recommande{" "}
                <span style={{ color: "var(--signal)" }}>{laPlusDure.marque}</span> sur une question
                où vous n’apparaissez pas.
              </figcaption>
            </figure>
          ) : null}

          {visibles.length ? (
            <div className="flex w-full flex-none flex-col gap-3 lg:w-[300px]">
              {visibles.map((p) => (
                <div key={p.name} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-[15.5px] font-semibold"
                      style={p.target ? { color: "var(--signal)" } : undefined}
                    >
                      {p.target ? "Vous" : p.name}
                    </span>
                    <span className="mono text-[13px] text-ink-2">{p.count} mentions</span>
                  </div>
                  <span className="block h-[9px] w-full bg-paper-2">
                    <span
                      className="block h-full"
                      style={{
                        width: `${Math.max(2, (p.count / max) * 100)}%`,
                        backgroundColor: p.target ? "var(--signal)" : "var(--ink)",
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AppelIntermediaire({ onReserver }: { onReserver: () => void }) {
  return (
    <div className="border-b border-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex flex-col gap-1.5">
          <p className="text-[20px] font-bold leading-[1.2] tracking-[-0.03em] lg:text-[26px]">
            Vous avez vu le problème. On vous montre quoi en faire, en trente minutes.
          </p>
          <span className="mono text-[12px] uppercase tracking-[0.12em] text-ink-2">
            30 min · visio · sans obligation d’achat
          </span>
        </div>
        <button type="button" onClick={onReserver} className="cta cta-sweep shrink-0 self-start lg:self-auto">
          Réserver mon diagnostic
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── la bande des questions ─────────────────────── */

function BandeQuestions({
  questions,
  choisie,
  onChoisir,
  questionsDuComplet,
}: {
  questions: QuestionPreparee[];
  choisie: number;
  onChoisir: (i: number) => void;
  questionsDuComplet: number;
}) {
  return (
    <div className="border-b border-ink bg-paper-2 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className="mono text-[12px] uppercase tracking-[0.13em] text-ink-2">
            les {questions.length} questions posées · cliquez pour voir les réponses
          </span>
          <span className="text-[15px] text-ink-2">
            {questionsDuComplet} questions sont posées dans le diagnostic complet.
          </span>
        </div>
      </div>

      <div className="mx-auto mt-1 max-w-6xl">
        <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 pt-1 sm:px-8">
          {questions.map((q, i) => {
            const actif = i === choisie;
            const citee = q.cases.filter((c) => c.etat === "cite").length;
            return (
              <li key={q.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => onChoisir(i)}
                  aria-current={actif ? "true" : undefined}
                  className={`flex h-full w-[244px] flex-col gap-2.5 border p-4 text-left transition-colors duration-200 ${
                    actif ? "border-ink bg-ink text-paper" : "border-rule-strong bg-paper hover:border-ink"
                  }`}
                >
                  <span className={`mono text-[12px] ${actif ? "opacity-70" : "text-ink-2"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[16px] font-semibold leading-[1.3]">{fr(q.texte)}</span>
                  <span className={`mono mt-auto text-[12px] ${actif ? "opacity-70" : "text-ink-2"}`}>
                    {citee > 0 ? `${citee}/${q.ouverts} vous citent` : "aucun ne vous cite"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ───────────────────────── réponses par moteur ───────────────────────── */

function Reponses({
  question,
  onReserver,
}: {
  question: QuestionPreparee;
  onReserver: () => void;
}) {
  // Les moteurs qui ne citent pas passent devant : c'est l'information qui
  // fait agir, la mettre en bas reviendrait à la cacher.
  const rang = (c: Case) => (c.etat === "verrouille" ? 3 : c.etat === "cite" ? 2 : c.etat === "panne" ? 1 : 0);
  const cases = [...question.cases].sort((a, b) => rang(a) - rang(b));

  return (
    <div className="border-b border-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-11 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex flex-col gap-2">
            <span className="mono text-[12px] uppercase tracking-[0.13em] text-ink-2">
              question {String(question.rang).padStart(2, "0")}
            </span>
            <h2 className="max-w-[24ch] text-[24px] font-bold leading-[1.22] tracking-[-0.028em] lg:text-[30px]">
              {fr(question.texte)}
            </h2>
          </div>
          <p className="max-w-[42ch] text-[16px] leading-[1.5] text-ink-2 lg:text-right">
            {question.sansVous} moteur{question.sansVous > 1 ? "s" : ""} sur {question.ouverts}{" "}
            interrogé{question.ouverts > 1 ? "s" : ""} ne vous mentionne
            {question.sansVous > 1 ? "nt" : ""} pas.
          </p>
        </div>

        <ul className="flex max-w-[1000px] flex-col gap-2">
          {cases.map((c) => (
            <li key={c.moteur}>
              <CarteReponse c={c} onReserver={onReserver} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CarteReponse({ c, onReserver }: { c: Case; onReserver: () => void }) {
  if (c.etat === "verrouille") {
    return (
      <div className="border border-rule-strong bg-paper-2">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
          <span className="flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.015em] text-ink-2">
            <LogoMoteur nom={c.moteur} size={18} />
            {c.moteur}
          </span>
          <span className="mono border border-rule-strong bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-ink-2">
            diagnostic complet
          </span>
        </div>
        {/* Aucun texte : ce moteur n'a pas été interrogé dans l'aperçu. Il n'y a
            rien à flouter, et rien à fabriquer pour donner l'illusion d'une
            réponse retenue. */}
        <button
          type="button"
          onClick={onReserver}
          className="flex w-full flex-col items-center gap-2 px-4 py-8 text-center transition-colors hover:bg-paper"
        >
          <Cadenas />
          <span className="mono text-[11px] uppercase tracking-[0.14em]">
            non interrogé dans l’aperçu
          </span>
          <span className="mono text-[11px] text-ink-2">
            Ouvert pendant la visioconférence
          </span>
        </button>
      </div>
    );
  }

  if (c.etat === "panne") {
    return (
      <div className="border border-rule-strong bg-paper-2 px-4 py-4">
        <span className="flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.015em] text-ink-2">
          <LogoMoteur nom={c.moteur} size={18} />
          {c.moteur}
        </span>
        <p className="mono mt-2 text-[13px] text-ink-2">
          Moteur indisponible sur cette question. Cette réponse ne compte pas dans votre score.
        </p>
      </div>
    );
  }

  const cite = c.etat === "cite";

  return (
    <div
      className="border border-rule-strong bg-paper px-4 py-4 sm:px-5"
      style={{ borderLeftWidth: 3, borderLeftColor: cite ? "var(--ink)" : "var(--signal)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.015em]">
          <LogoMoteur nom={c.moteur} size={18} />
          {c.moteur}
        </span>
        <span
          className="mono whitespace-nowrap px-2 py-1 text-[11px] uppercase tracking-[0.06em]"
          style={
            cite
              ? { backgroundColor: "var(--ink)", color: "var(--paper)" }
              : { backgroundColor: "var(--signal-tint)", color: "var(--signal)" }
          }
        >
          {cite ? `cité${c.rang ? ` · rang ${c.rang}` : ""}` : "sans vous"}
        </span>
      </div>

      {c.extrait ? (
        <p className="mt-3 text-[16px] leading-[1.55]">
          <Surligne texte={c.extrait} concurrents={c.concurrents} />
        </p>
      ) : (
        <p className="mono mt-3 text-[13px] text-ink-2">
          Aucune marque n’est nommée dans cette réponse.
        </p>
      )}

      {cite && c.recommande ? (
        <p className="mono mt-3 text-[12px] uppercase tracking-[0.08em] text-ink-2">
          recommandation explicite
        </p>
      ) : null}
    </div>
  );
}

/** Les concurrents nommés ressortent en signal ; le reste est de l'encre. */
function Surligne({ texte, concurrents }: { texte: string; concurrents: string[] }) {
  const noms = concurrents.filter((n) => n && n.length > 1);
  if (noms.length === 0) return <>{texte}</>;

  const motif = new RegExp(
    `(${noms.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );

  return (
    <>
      {texte.split(motif).map((part, i) =>
        noms.some((n) => n.toLowerCase() === part.toLowerCase()) ? (
          <span key={i} className="font-bold" style={{ color: "var(--signal)" }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Cadenas() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--signal)"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
    </svg>
  );
}

/* ────────────────────────────── appel final ────────────────────────────── */

const CE_QUE_LAPERCU_NE_MONTRE_PAS = [
  {
    num: "01",
    titre: "Les sources.",
    texte:
      "Les pages exactes que les moteurs ont ouvertes avant de répondre. Vous saurez sur quels sites votre marché se décide, et sur lesquels votre nom n’apparaît pas.",
  },
  {
    num: "02",
    titre: "La question la plus chère, mot pour mot.",
    texte:
      "Celle où un client s’apprête à choisir, avec le nom qui sort à la place du vôtre.",
  },
  {
    num: "03",
    titre: "Ce que les moteurs racontent de vous.",
    texte:
      "On les interroge directement sur votre entreprise, hors méthodologie de mesure. Informations périmées, confusion avec un homonyme, invention pure : vous verrez.",
  },
  {
    num: "04",
    titre: "Si votre site est lisible par les robots d’IA.",
    texte:
      "GPTBot, ClaudeBot, PerplexityBot, Google-Extended : ouverts ou bloqués. Beaucoup de sites les bloquent sans le savoir.",
  },
  {
    num: "05",
    titre: "Combien ça vous coûte, en euros.",
    texte:
      "Votre panier moyen rapporté au prix du sprint. Vous saurez en une division combien de clients récupérés le remboursent. Si le compte ne tombe pas juste, on vous le dit.",
  },
];

function AppelFinal({
  moteursVerrouilles,
  questionsDuComplet,
  onReserver,
}: {
  moteursVerrouilles: string[];
  questionsDuComplet: number;
  onReserver: () => void;
}) {
  const ouverts = 6 - moteursVerrouilles.length;

  return (
    <div className="bg-ink text-paper">
      <div className="mx-auto flex max-w-[920px] flex-col items-start gap-6 px-5 py-12 sm:px-8 lg:gap-9 lg:py-14">
        <div className="flex flex-col gap-1.5">
          <span className="mono text-[12px] uppercase tracking-[0.13em] opacity-60">
            votre aperçu a interrogé {ouverts} moteur{ouverts > 1 ? "s" : ""}. vos clients en
            utilisent 6.
          </span>
          <span className="mono text-[12px] uppercase tracking-[0.12em] opacity-60">
            30 minutes · en visio · 0 €
          </span>
        </div>

        <p className="text-[16px] leading-[1.55] opacity-90 lg:text-[19px]">
          {fr(
            `Dès votre réservation, nous lançons le scan complet : ${questionsDuComplet} questions sur les six moteurs, 144 réponses réelles. Vous ne recevez pas un PDF. On l’ouvre ensemble, à l’écran.`,
          )}
        </p>

        <div className="flex w-full flex-col gap-4 lg:gap-5">
          <span className="mono text-[12px] uppercase tracking-[0.13em] opacity-60">
            ce que l’aperçu ne pouvait pas vous montrer
          </span>
          <ol className="flex flex-col gap-3 lg:gap-4">
            {CE_QUE_LAPERCU_NE_MONTRE_PAS.map((item) => (
              <li key={item.num} className="flex items-start gap-3 lg:gap-4">
                <span className="mono min-w-[24px] flex-none pt-[3px] text-[13px] opacity-60">
                  {item.num}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[17px] font-bold leading-[1.35]">{item.titre}</span>
                  <span className="text-[16px] leading-[1.5] opacity-70">{item.texte}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <p className="text-[16px] font-semibold leading-[1.45]">
            {fr(
              "L’épreuve du direct : on rejoue une question devant vous, en visio. Vous choisissez laquelle. Rien n’est précuit.",
            )}
          </p>
          <p className="text-[16px] leading-[1.5] opacity-70">
            Si votre score est bon, on vous le dit et on ne vous vend rien.
          </p>
          <p className="text-[14px] leading-[1.5] opacity-60">
            {fr(
              "Pourquoi c’est gratuit : ce diagnostic nous coûte environ 1 € en appels d’API. C’est le prix que nous acceptons de payer pour trente minutes de votre attention. Nous en tenons trois par semaine.",
            )}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={onReserver}
            className="w-full rounded-[2px] bg-paper px-7 py-4 text-[17px] font-bold text-ink transition-opacity hover:opacity-90 lg:w-auto lg:self-start"
          >
            Réserver mon diagnostic
          </button>
          <span className="mono text-[12px] uppercase tracking-[0.12em] opacity-60">
            30 minutes · en visio · 0 €
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[920px] flex-col gap-1.5 border-t border-paper/15 px-5 py-5 sm:px-8 lg:flex-row lg:justify-between">
        <span className="mono text-[12px] uppercase tracking-[0.12em] opacity-60">
          le sprint coûte 2 900 € HT. le prix est sur le site. la visio ne sert pas à vous
          l’annoncer.
        </span>
        <span className="mono text-[12px] uppercase tracking-[0.12em] opacity-60">
          3 sprints · 1 client par secteur et par ville
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── fenêtre de réservation ───────────────────────── */

function FenetreReservation({
  ouverte,
  onFermer,
  marque,
}: {
  ouverte: boolean;
  onFermer: () => void;
  marque: string;
}) {
  useEffect(() => {
    if (!ouverte) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [ouverte, onFermer]);

  if (!ouverte) return null;

  return (
    <div
      className="anim-veil fixed inset-0 z-[100] flex items-center justify-center bg-ink/85 sm:p-[2vh_2vw]"
      onMouseDown={onFermer}
      role="dialog"
      aria-modal="true"
      aria-label="Réserver le diagnostic complet"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative h-full w-full overflow-hidden bg-paper sm:h-[90vh] sm:w-[95%] sm:max-w-[1100px]"
      >
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full border border-rule-strong bg-paper text-[24px] leading-none text-ink-2 transition-colors hover:text-ink"
        >
          ×
        </button>
        <iframe
          title="Réserver le diagnostic complet"
          src={bookingUrl({ name: marque })}
          className="block h-full w-full border-0"
        />
      </div>
    </div>
  );
}
