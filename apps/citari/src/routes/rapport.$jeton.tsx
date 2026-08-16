import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LogoLien } from "@/components/logo";
import { chargerRapport } from "@/lib/scan.functions";
import { Etiquette } from "@/components/kit";
import { cn } from "@/lib/utils";
import {
  LimiteMethodologique,
  type Mention,
  type Question,
  type Reponse,
} from "@/components/rapport";
import {
  BandeauMoteurs,
  BandeIntentions,
  ComposantesScore,
  Duel,
  FaceAFace,
  Frise90,
  Legende,
  MatriceReponses,
  MiroirDocument,
  PiecesDocument,
  Plan90,
  RegleScore,
  ReleveRobots,
  SourcesVue,
  TitreChiffre,
  TonaliteDepliee,
  VoixDocument,
} from "@/components/rapport-complet";
import { construireDocument, type LigneSourceReponse } from "@/lib/rapport-complet";
import { ProjectionComplet, classesVueDocument } from "@/components/rapport-complet-projection";
import { dateFr, fr, frTitre, verdict, NBSP } from "@/lib/typo";
import { CONTACT_EMAIL } from "@/lib/site";
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
            Réserver mon scan complet
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
        jeton={scan.report_token}
      />
    </div>
  );
}

/**
 * Le document de mesure, direction « cadastre » (16/08/2026).
 *
 * Le rail de sommaire collant a disparu : il mangeait 15 % de la largeur sur
 * toute la hauteur pour neuf liens, et il ne s'imprimait pas. Il est remplacé
 * par LE BORDEREAU, en ouverture : neuf lignes à points de conduite qui
 * portent chacune le chiffre clé de son chapitre. C'est la table des pièces
 * d'un dossier, et c'est en même temps le résumé exécutif — en partage
 * d'écran, on ouvre là-dessus, on annonce les neuf constats, puis on descend.
 *
 * LA CADENCE répond à l'uniformité de la version précédente : quatre densités
 * alternent, jamais deux planches consécutives. L'ouverture prend l'écran, la
 * planche déborde bord à bord sur `--paper-2`, le relevé tient en deux
 * colonnes asymétriques, le constat s'ancre à gauche avec de l'air à droite.
 */
function RapportComplet() {
  const { scan, questions, reponses, mentions, precedent } = Route.useLoaderData();
  const marque = scan.brand_name;
  const score = Math.round(Number(scan.score_global ?? 0));

  // ÉCRAN = projection (la séquence guidée), PAPIER = document. La vue
  // document reste accessible pour qui préfère dérouler, et elle reste
  // MONTÉE en permanence : Cmd+P imprime toujours le document, jamais une
  // carte. L'état initial est déterministe, donc sûr à l'hydratation.
  const [vue, setVue] = useState<"projection" | "document">("projection");
  const [large, setLarge] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const onChange = () => setLarge(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const donnees = useMemo(
    () =>
      construireDocument({
        marque: scan.brand_name,
        site: scan.website_url,
        questions: questions as LigneQuestion[],
        reponses: reponses as unknown as LigneSourceReponse[],
        mentions: mentions as unknown as LigneMention[],
        classes: (scan.concurrent_classes ?? {}) as Record<string, string>,
        alias: (scan.brand_aliases ?? {}) as Record<string, string>,
        mesures: scan,
        miroir: scan.miroir,
        audit: scan.audit,
        actions: scan.actions,
        ville: scan.city,
      }),
    [scan, questions, reponses, mentions],
  );

  const parMoteur: Record<string, number | null> = {
    ChatGPT: scan.score_chatgpt as number | null,
    Claude: scan.score_claude as number | null,
    Gemini: scan.score_gemini as number | null,
    Perplexity: scan.score_perplexity as number | null,
    Grok: scan.score_grok as number | null,
    "Le Chat": scan.score_mistral as number | null,
  };

  const bloques = donnees.technique?.bloques.length ?? 0;
  const actionsTotal = donnees.plan.reduce((n, p) => n + p.actions.length, 0);
  const lues = donnees.echantillon.reponsesLues;
  const citees = donnees.matrice.questionsCitees;

  /**
   * Les chapitres, et le chiffre clé que chacun porte au bordereau. Une
   * section sans donnée n'est pas déclarée : la numérotation, la pagination
   * et le bordereau se dérivent tous de cette liste, jamais d'un « 9 » écrit
   * en dur.
   */
  const sections: {
    id: string;
    nav: string;
    cle: string;
    variante: "ouverture" | "planche" | "releve" | "constat";
  }[] = [
    { id: "verdict", nav: "Le verdict", cle: `${score}/100`, variante: "ouverture" },
    {
      id: "carte",
      nav: "La carte des réponses",
      cle: `${citees}/${donnees.matrice.questionsMesurees} questions`,
      variante: "planche",
    },
    {
      id: "forces",
      nav: "Le rapport de forces",
      cle: `${donnees.voix.marquesTotal} marques`,
      variante: "releve",
    },
    ...(donnees.pieces.length
      ? [
          {
            id: "pieces",
            nav: "Les phrases exactes",
            cle: `${donnees.pieces.length} pièce${donnees.pieces.length > 1 ? "s" : ""}`,
            variante: "constat" as const,
          },
        ]
      : []),
    ...(donnees.questionCle
      ? [
          {
            id: "decisive",
            nav: "La question décisive",
            cle: `question ${String(donnees.questionCle.rang).padStart(2, "0")}`,
            variante: "releve" as const,
          },
        ]
      : []),
    ...(donnees.miroir.length
      ? [
          {
            id: "miroir",
            nav: "Ce que les IA racontent",
            cle: `${donnees.miroir.length} moteur${donnees.miroir.length > 1 ? "s" : ""}`,
            variante: "planche" as const,
          },
        ]
      : []),
    {
      id: "portes",
      nav: "L'accès des robots",
      cle: bloques === 0 ? "toutes ouvertes" : `${bloques} refusé${bloques > 1 ? "s" : ""}`,
      variante: "releve",
    },
    ...(donnees.sources.totalLectures
      ? [
          {
            id: "lectures",
            nav: "Où les IA lisent",
            cle: `${donnees.sources.totalLectures} lectures`,
            variante: "planche" as const,
          },
        ]
      : []),
    {
      id: "plan",
      nav: "Le plan des 90 jours",
      cle: `${actionsTotal} actions`,
      variante: "planche",
    },
  ];
  const numero = (id: string) => sections.findIndex((s) => s.id === id) + 1;
  const varianteDe = (id: string) => sections.find((s) => s.id === id)?.variante ?? "releve";

  return (
    <>
      {vue === "projection" ? (
        <div className="flex min-h-screen flex-col">
          <ProjectionComplet
            donnees={donnees}
            reponses={reponses as unknown as LigneReponse[]}
            mentions={mentions as unknown as LigneMention[]}
            score={score}
            precedent={
              precedent
                ? { score: Number(precedent.score), parMoteur: precedent.parMoteur }
                : null
            }
            parMoteur={parMoteur}
            wide={large}
            onImprimer={() => setVue("document")}
          />
        </div>
      ) : null}

      <div className={cn("doc-clip", classesVueDocument(vue))}>
      <div className="mx-auto max-w-[1240px] px-6 pb-32 lg:px-10">
        {/* ---------------------------------------------- la garde */}
        <header className="pt-14 md:pt-20">
          <div className="flex items-baseline justify-between gap-6">
            <LogoLien hauteur={24} className="no-print" />
            <span className="no-print flex items-center gap-5">
              <button
                type="button"
                onClick={() => setVue("projection")}
                className="label-xs ink-link"
              >
                version projection
              </button>
              <button type="button" onClick={() => window.print()} className="label-xs ink-link">
                imprimer
              </button>
            </span>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="kicker">
                {scan.mode === "controle"
                  ? "document de mesure · contrôle à mi-parcours"
                  : "document de mesure · scan complet"}
              </p>
              {/* 800 explicite : `@layer base` impose 600 à tous les h1, et
                  c'est ce 600 uniforme qui aplatissait la page. Le 800 n'a
                  qu'un seul emploi dans le document, ici, ce qui lui rend
                  son poids. */}
              <h1 className="mt-2 text-[46px] font-extrabold leading-[0.88] tracking-[-0.045em] md:text-[88px]">
                {marque}
              </h1>
            </div>

            {/* Le cartouche : le bloc de titre normalisé d'un plan. */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border border-rule-strong p-5 sm:grid-cols-3 lg:w-[440px] lg:grid-cols-2">
              {[
                ["secteur", scan.sector],
                ["portée", scan.city ? scan.city : "nationale"],
                ["site", (scan.website_url ?? "—").replace(/^https?:\/\//, "")],
                ["date", scan.completed_at ? dateFr(scan.completed_at) : dateFr(scan.created_at)],
                [
                  "échantillon",
                  `${donnees.echantillon.questions} × ${donnees.echantillon.moteurs} moteurs`,
                ],
                [
                  "réponses lues",
                  donnees.echantillon.reponsesEnErreur
                    ? `${lues} · ${donnees.echantillon.reponsesEnErreur} hors mesure`
                    : `${lues}`,
                ],
                ["référence", scan.report_token.slice(0, 8)],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="label-xs">{k}</dt>
                  <dd className="num truncate text-[13px]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {precedent ? (
            <div className="mt-5">
              <Etiquette ton="signal">
                mode comparaison · scan initial du {precedent.date ? dateFr(precedent.date) : "—"}
              </Etiquette>
            </div>
          ) : null}

          {/* La légende, déclarée UNE fois pour tout le document. */}
          <div className="mt-8 border-t border-rule pt-4">
            <Legende />
          </div>
        </header>

        {/* ------------------------------------------ le bordereau */}
        <nav className="mt-16 border-t-2 border-ink">
          <p className="label-xs py-3">les {sections.length} constats</p>
          <ol className="border-t border-rule">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="row-hover flex items-baseline gap-3 border-b border-rule py-2.5"
                >
                  <span className="num shrink-0 text-[12px] text-ink-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="shrink-0 text-[15px] font-medium sm:text-[17px]">{s.nav}</span>
                  <span className="conduite" aria-hidden />
                  <span className="num shrink-0 text-[13px] sm:text-[15px]">{s.cle}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0">
          {/* ------------------------------------------ 01 · verdict */}
          <Chapitre
            id="verdict"
            numero={numero("verdict")}
            kicker="le verdict"
            titre={fr(
              `Sur ${lues} réponses lues, votre marque apparaît dans ${donnees.voix.vosReponses}.`,
            )}
            alerte={[String(donnees.voix.vosReponses)]}
            variante={varianteDe("verdict")}
          >
            <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[7fr_5fr]">
              <RegleScore
                score={score}
                verdict={verdict(score)}
                precedent={precedent ? Math.round(precedent.score) : null}
              />
              <p className="max-w-[46ch] self-end text-[15px] leading-relaxed text-ink-2">
                {fr(
                  "La formule est publiée et ne bouge jamais : présence 50 %, position 20 %, recommandation explicite 20 %, tonalité 10 %. Une réponse en erreur ne compte pas au dénominateur.",
                )}{" "}
                <Link to="/methode" className="ink-link">
                  {fr("La méthode, publiée en entier")}
                </Link>
              </p>
            </div>

            {donnees.composantes ? (
              <div className="mt-16">
                <p className="label-xs pb-3">les quatre composantes, à leur poids réel</p>
                <ComposantesScore
                  composantes={donnees.composantes}
                  reponsesLues={lues}
                  reponsesEnErreur={donnees.echantillon.reponsesEnErreur}
                />
                {donnees.tonalite ? (
                  <div className="mt-10">
                    <TonaliteDepliee tonalite={donnees.tonalite} />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-16">
              <p className="label-xs pb-3">moteur par moteur</p>
              <BandeauMoteurs scores={parMoteur} avant={precedent?.parMoteur ?? null} />
            </div>
          </Chapitre>

          {/* -------------------------------------------- 02 · carte */}
          <Chapitre
            id="carte"
            numero={numero("carte")}
            kicker="la mesure entière"
            titre={frTitre(donnees.titreMatrice)}
            alerte={[String(citees)]}
            sous={fr(
              "Chaque case est une réponse réelle, conservée mot pour mot. Le re-scan à J+90 rejoue exactement ces questions : c'est ce qui rend l'écart mesurable. Cliquez une ligne pour lire les réponses en entier.",
            )}
            variante={varianteDe("carte")}
          >
            <BandeIntentions groupes={donnees.intentions} portee={donnees.portee} />
            <MatriceReponses
              matrice={donnees.matrice}
              reponses={reponses as unknown as LigneReponse[]}
              mentions={mentions as unknown as LigneMention[]}
              marque={marque}
            />
          </Chapitre>

          {/* ------------------------------------------- 03 · forces */}
          <Chapitre
            id="forces"
            numero={numero("forces")}
            kicker={donnees.duel ? donnees.duel.kicker.toLowerCase() : "le rapport de forces"}
            titre={frTitre(donnees.duel ? donnees.duel.titre : "Le rapport de forces.")}
            variante={varianteDe("forces")}
          >
            <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[7fr_5fr]">
              <div>
                {donnees.duel ? (
                  <Duel
                    marque={marque}
                    vous={donnees.duel.vous}
                    adversaire={donnees.duel.adversaire}
                    lues={lues}
                    recoVous={donnees.duel.recoVous}
                    recoAdversaire={donnees.duel.recoAdversaire}
                  />
                ) : null}
              </div>
              <div className="self-start">
                <p className="num text-[56px] leading-none text-signal sm:text-[72px]">
                  {donnees.voix.reponsesPerdues}
                </p>
                <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-ink-2">
                  {fr(
                    `réponses où un concurrent est nommé et vous ne l'êtes pas. ${donnees.voix.marquesTotal} marques distinctes se partagent votre marché.`,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-16">
              <p className="label-xs pb-3">les marques les plus présentes</p>
              <VoixDocument lignes={donnees.voix.lignes} lues={lues} />
            </div>
          </Chapitre>

          {/* ------------------------------------------ 04 · phrases */}
          {donnees.pieces.length ? (
            <Chapitre
              id="pieces"
              numero={numero("pieces")}
              kicker="les phrases exactes"
              titre={frTitre("Les phrases qui envoient vos prospects ailleurs.")}
              sous={fr(
                "Extraits mot pour mot des réponses collectées, concurrent surligné. Le texte intégral de chaque réponse reste lisible dans la carte des réponses.",
              )}
              variante={varianteDe("pieces")}
            >
              <PiecesDocument pieces={donnees.pieces} />
            </Chapitre>
          ) : null}

          {/* ----------------------------------------- 05 · décisive */}
          {donnees.questionCle ? (
            <Chapitre
              id="decisive"
              numero={numero("decisive")}
              kicker="la question décisive"
              titre={frTitre(`« ${donnees.questionCle.texte} »`)}
              sous={fr(donnees.questionCle.enjeu)}
              variante={varianteDe("decisive")}
              large
            >
              <FaceAFace faces={donnees.questionCle.faces} />
            </Chapitre>
          ) : null}

          {/* ------------------------------------------- 06 · miroir */}
          {donnees.miroir.length ? (
            <Chapitre
              id="miroir"
              numero={numero("miroir")}
              kicker="la question miroir · hors score"
              titre={frTitre("Ce que chaque IA raconte quand on lui donne votre nom.")}
              sous={fr(
                "La seule question du scan qui prononce votre nom, posée à chaque moteur. Elle ne compte pas dans le score : les autres mesurent la découverte spontanée, celle-ci mesure ce que les IA récitent sur vous.",
              )}
              variante={varianteDe("miroir")}
            >
              <MiroirDocument miroir={donnees.miroir} />
            </Chapitre>
          ) : null}

          {/* ------------------------------------------- 07 · portes */}
          <Chapitre
            id="portes"
            numero={numero("portes")}
            kicker="l'accès technique"
            titre={frTitre(
              donnees.technique === null
                ? "Le robots.txt du site n'a pas pu être lu."
                : bloques === 0
                  ? "Toutes les portes sont ouvertes. Ce qui manque, c'est la matière."
                  : bloques === 1
                    ? "Un robot d'IA est refusé à votre porte."
                    : `${bloques} robots d'IA sont refusés à votre porte.`,
            )}
            alerte={bloques > 1 ? [String(bloques)] : []}
            sous={fr(
              "Relevé sur le fichier public robots.txt de votre site, le jour de la mesure. Un robot refusé ne lira jamais ce que vous publiez, quel que soit le contenu.",
            )}
            variante={varianteDe("portes")}
          >
            <ReleveRobots technique={donnees.technique} domaine={scan.website_url} />
          </Chapitre>

          {/* ----------------------------------------- 08 · lectures */}
          {donnees.sources.totalLectures ? (
            <Chapitre
              id="lectures"
              numero={numero("lectures")}
              kicker="les sources"
              titre={frTitre(donnees.titreSources ?? "Où les IA vont lire.")}
              /* Aucun chiffre en alerte ici : quand le site n'a jamais été lu,
                 le titre dit « jamais » et il n'y a pas de nombre à colorer ;
                 quand il l'a été, ce n'est pas une mauvaise nouvelle. Le rouge
                 ne dit que la perte. */
              alerte={[]}
              sous={fr(
                "Relevées dans les réponses elles-mêmes : les sites que les moteurs ont consultés pendant la mesure. Être cité là, c'est entrer dans la matière première des réponses.",
              )}
              variante={varianteDe("lectures")}
            >
              <SourcesVue sources={donnees.sources} />
            </Chapitre>
          ) : null}

          {/* --------------------------------------------- 09 · plan */}
          <Chapitre
            id="plan"
            numero={numero("plan")}
            kicker="les 90 prochains jours"
            titre={frTitre("Le plan, phase par phase.")}
            sous={fr(
              "Construit sur cette mesure, pas sur un gabarit : chaque phase part d'un constat relevé plus haut, et liste ce qu'il y a à faire pour le changer. Les trois chantiers se chevauchent.",
            )}
            variante={varianteDe("plan")}
          >
            <Frise90 phases={donnees.plan} questions={donnees.echantillon.questions} />
            <Plan90 phases={donnees.plan} />

            {/* L'acte d'engagement. */}
            <div className="avoid-break mt-24 grid gap-10 border border-ink p-6 sm:p-10 lg:grid-cols-[1fr_320px]">
              <div>
                <p className="label-xs">et maintenant</p>
                <h3 className="serif-roman mt-2 text-[26px] leading-tight sm:text-[34px]">
                  {frTitre("Ce plan est exactement ce que le Sprint GEO exécute.")}
                </h3>
                <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
                  {fr(
                    `Les trois phases ci-dessus, livrées en 90 jours, puis le re-scan qui rejoue ces ${donnees.echantillon.questions} questions à l'identique pour mesurer l'écart.`,
                  )}
                </p>
                <p className="mt-4 border-t border-rule-strong pt-3 text-[14px] font-semibold">
                  {fr("Nous garantissons les actions livrées, jamais un score.")}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link to="/sprint" className="cta cta-sweep">
                    {fr("Le programme des 90 jours, étape par étape")}
                  </Link>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="ink-link num text-[14px]">
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              <dl className="border-t border-rule-strong pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                {[
                  ["contenus écrits", "5"],
                  ["cibles de citation", "8"],
                  ["re-scan", "J+90"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
                    <dt className="text-[13px] text-ink-2">{k}</dt>
                    <dd className="num text-[15px]">{v}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4 pt-3">
                  <dt className="text-[13px] text-ink-2">une fois, sans abonnement</dt>
                  <dd className="num text-[26px] sm:text-[30px]">2{NBSP}900{NBSP}€</dd>
                </div>
              </dl>
            </div>
          </Chapitre>

          <div className="mt-24 grid gap-8 md:grid-cols-2">
            <LimiteMethodologique />
            <div className="max-w-[46ch] border-t border-rule-strong pt-3">
              <Etiquette>engagement</Etiquette>
              <p className="mt-2 text-[13px] leading-snug text-ink-2">
                {fr(
                  "Les moteurs intègrent les changements de contenu et de citations en 4 à 12 semaines : c'est pourquoi le re-scan est planifié à J+90, sur exactement les mêmes questions.",
                )}
              </p>
            </div>
          </div>
        </main>

        <footer className="mt-24 border-t border-rule-strong pt-4">
          <p className="num text-[11px] text-ink-3">
            Citari{NBSP}· rapport {scan.report_token.slice(0, 8)}{NBSP}·{" "}
            {frTitre("mesure par API officielles, sans scraping")}
          </p>
        </footer>
      </div>
      </div>
    </>
  );
}

/**
 * La tête de chapitre, et la CADENCE du document.
 *
 * Le titre énonce le constat avec ses chiffres réels, et ces chiffres passent
 * en monospace : c'est la signature du document, et elle distribue la tension
 * sur tous les chapitres au lieu de la concentrer dans un cadran. `alerte`
 * liste les nombres à rendre en signal — le chiffre en défaut, jamais celui
 * qui donne le contexte.
 *
 * Quatre densités, qui ne se suivent jamais deux fois : `ouverture` prend
 * l'écran, `planche` déborde bord à bord sur un fond distinct (le changement
 * de fond devient un signal de rythme, pas une décoration), `releve` tient en
 * colonne, `constat` s'ancre à gauche avec de l'air à droite.
 */
function Chapitre({
  id,
  numero,
  kicker,
  titre,
  alerte = [],
  sous,
  variante,
  large = false,
  children,
}: {
  id: string;
  numero: number;
  kicker: string;
  titre: string;
  alerte?: string[];
  sous?: string;
  variante: "ouverture" | "planche" | "releve" | "constat";
  /** Le contenu déborde de la mesure de lecture (six colonnes de journal). */
  large?: boolean;
  children: React.ReactNode;
}) {
  const planche = variante === "planche";
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-8",
        planche ? "planche mt-24 bg-paper-2 py-20" : "mt-24",
        variante === "ouverture" && "mt-16 min-h-[80vh]",
      )}
    >
      <div className={cn(planche && "mx-auto max-w-[1240px]")}>
        <div className={cn("border-b border-rule-strong pb-6", !large && "max-w-[62ch]")}>
          <p className="kicker">
            {String(numero).padStart(2, "0")} · {kicker}
          </p>
          <h2 className="serif-roman mt-3 max-w-[26ch] text-[30px] leading-[1.06] tracking-[-0.012em] md:text-[46px]">
            <TitreChiffre texte={titre} alerte={alerte} />
          </h2>
          {sous ? (
            <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.62] text-ink-2">{sous}</p>
          ) : null}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
