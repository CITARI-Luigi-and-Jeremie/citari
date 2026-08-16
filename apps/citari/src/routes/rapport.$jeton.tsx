import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LogoLien } from "@/components/logo";
import { chargerRapport } from "@/lib/scan.functions";
import { Etiquette, Label, Rule } from "@/components/kit";
import {
  AuditRobots,
  LimiteMethodologique,
  ScoreGeant,
  ScoresMoteurs,
  type Mention,
  type Question,
  type Reponse,
} from "@/components/rapport";
import {
  ComposantesScore,
  Duel,
  FaceAFace,
  MatriceReponses,
  MiroirDocument,
  PiecesDocument,
  Plan90,
  SourcesVue,
  VoixDocument,
} from "@/components/rapport-complet";
import { construireDocument, type LigneSourceReponse } from "@/lib/rapport-complet";
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

function RapportComplet() {
  const { scan, questions, reponses, mentions, precedent } = Route.useLoaderData();
  const marque = scan.brand_name;
  const score = Math.round(Number(scan.score_global ?? 0));

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
      }),
    [scan, questions, reponses, mentions],
  );

  // Les six, toujours. Il en manquait deux (Grok et Le Chat) et le rapport
  // les affichait donc « — » alors qu'ils avaient bien été interrogés et notés.
  const parMoteur: Record<string, number | null> = {
    ChatGPT: scan.score_chatgpt as number | null,
    Claude: scan.score_claude as number | null,
    Gemini: scan.score_gemini as number | null,
    Perplexity: scan.score_perplexity as number | null,
    Grok: scan.score_grok as number | null,
    "Le Chat": scan.score_mistral as number | null,
  };

  // Le sommaire suit les données : une section sans matière sort du document,
  // elle n'affiche jamais un gabarit vide.
  const bloques = donnees.technique?.bloques.length ?? 0;
  const sections: { id: string; nav: string }[] = [
    { id: "verdict", nav: "Le verdict" },
    { id: "carte", nav: "La carte des réponses" },
    { id: "forces", nav: "Le rapport de forces" },
    ...(donnees.pieces.length ? [{ id: "pieces", nav: "Les phrases exactes" }] : []),
    ...(donnees.questionCle ? [{ id: "decisive", nav: "La question décisive" }] : []),
    ...(donnees.miroir.length ? [{ id: "miroir", nav: "Ce que les IA racontent" }] : []),
    { id: "portes", nav: "L'accès des robots" },
    ...(donnees.sources.totalLectures ? [{ id: "lectures", nav: "Où les IA lisent" }] : []),
    { id: "plan", nav: "Le plan des 90 jours" },
  ];
  const numero = (id: string) => sections.findIndex((s) => s.id === id) + 1;

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
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
        {/* Le composant sert AUSSI le mode `controle` (24 × 4, télémétrie
            interne) : l'étiqueter « scan complet » contredirait la ligne
            « échantillon » deux lignes plus bas. */}
        <p className="label-xs mt-8">
          {frTitre(
            scan.mode === "controle"
              ? "document de mesure · contrôle à mi-parcours"
              : "document de mesure · scan complet",
          )}
        </p>
        <h1 className="mt-2 text-[56px] leading-[0.92] md:text-[88px]">{marque}</h1>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 border-t border-rule-strong pt-3">
          {[
            ["secteur", scan.sector],
            ["site", scan.website_url ?? "—"],
            ["date", scan.completed_at ? dateFr(scan.completed_at) : dateFr(scan.created_at)],
            [
              "échantillon",
              `${donnees.echantillon.questions} questions × ${donnees.echantillon.moteurs} moteurs`,
            ],
            [
              "réponses lues",
              donnees.echantillon.reponsesEnErreur
                ? `${donnees.echantillon.reponsesLues} · ${donnees.echantillon.reponsesEnErreur} en erreur, hors mesure`
                : `${donnees.echantillon.reponsesLues}`,
            ],
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

      <div className="mt-16 grid gap-12 lg:grid-cols-[176px_1fr] lg:gap-16">
        <nav className="no-print h-max lg:sticky lg:top-10">
          <Label className="pb-2">sommaire</Label>
          <Rule strong />
          <ol>
            {sections.map((s, i) => (
              <li key={s.id} className="border-b border-rule">
                <a
                  href={`#${s.id}`}
                  className="flex items-baseline gap-2 py-2 text-[13px] hover:text-signal"
                >
                  <span className="num text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  {s.nav}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0">
          {/* Le titre porte la présence, le cadran porte le score : les deux
              se complètent au lieu de se répéter. */}
          <Section
            id="verdict"
            numero={numero("verdict")}
            kicker="le verdict"
            titre={frTitre(
              `Sur ${donnees.echantillon.reponsesLues} réponses lues, votre marque apparaît dans ${donnees.voix.vosReponses}.`,
            )}
          >
            <ScoreGeant
              score={score}
              verdict={verdict(score)}
              ecart={precedent ? score - Math.round(precedent.score) : null}
            />
            <div className="mt-10 border-t border-rule pt-6">
              {donnees.composantes ? (
                <ComposantesScore
                  composantes={donnees.composantes}
                  reponsesLues={donnees.echantillon.reponsesLues}
                  reponsesEnErreur={donnees.echantillon.reponsesEnErreur}
                />
              ) : null}
            </div>
            <p className="mt-6 max-w-[58ch] text-[14px] leading-relaxed text-ink-2">
              {fr(
                "La formule est publiée et ne bouge jamais : présence 50 %, position 20 %, recommandation explicite 20 %, tonalité 10 %. Une réponse en erreur ne compte pas au dénominateur.",
              )}{" "}
              <Link to="/methode" className="ink-link">
                {fr("La méthode, publiée en entier")}
              </Link>
            </p>
            <div className="mt-10">
              <ScoresMoteurs scores={parMoteur} avant={precedent?.parMoteur ?? null} />
            </div>
          </Section>

          <Section
            id="carte"
            numero={numero("carte")}
            kicker="la mesure entière"
            titre={frTitre(donnees.titreMatrice)}
            sous={fr(
              "Chaque case est une réponse réelle, conservée mot pour mot. Le re-scan à J+90 rejoue exactement ces questions : c'est ce qui rend l'écart mesurable.",
            )}
          >
            <MatriceReponses
              matrice={donnees.matrice}
              reponses={reponses as unknown as LigneReponse[]}
              mentions={mentions as unknown as LigneMention[]}
              marque={marque}
            />
          </Section>

          <Section
            id="forces"
            numero={numero("forces")}
            kicker={donnees.duel ? donnees.duel.kicker : "le rapport de forces"}
            titre={frTitre(donnees.duel ? donnees.duel.titre : "Le rapport de forces.")}
            sous={fr(
              `${donnees.voix.marquesTotal} marques distinctes sont citées sur votre marché. Dans ${donnees.voix.reponsesPerdues} réponses, un concurrent est nommé et vous ne l'êtes pas.`,
            )}
          >
            {donnees.duel ? (
              <Duel
                marque={marque}
                vous={donnees.duel.vous}
                adversaire={donnees.duel.adversaire}
                total={donnees.duel.adversaire.total}
              />
            ) : null}
            <div className={donnees.duel ? "mt-12" : ""}>
              <Label className="pb-3">les marques les plus présentes</Label>
              <VoixDocument
                lignes={donnees.voix.lignes}
                reponsesLues={donnees.echantillon.reponsesLues}
              />
            </div>
          </Section>

          {donnees.pieces.length ? (
            <Section
              id="pieces"
              numero={numero("pieces")}
              kicker="les phrases exactes"
              titre={frTitre("Les phrases qui envoient vos prospects ailleurs.")}
              sous={fr(
                "Extraits mot pour mot des réponses collectées, concurrent surligné. Le texte intégral de chaque réponse reste lisible dans la carte des réponses.",
              )}
            >
              <PiecesDocument pieces={donnees.pieces} />
            </Section>
          ) : null}

          {donnees.questionCle ? (
            <Section
              id="decisive"
              numero={numero("decisive")}
              kicker="la question décisive"
              titre={frTitre(`« ${donnees.questionCle.texte} »`)}
              sous={fr(donnees.questionCle.enjeu)}
            >
              <FaceAFace faces={donnees.questionCle.faces} />
            </Section>
          ) : null}

          {donnees.miroir.length ? (
            <Section
              id="miroir"
              numero={numero("miroir")}
              kicker="la question miroir · hors score"
              titre={frTitre("Ce que chaque IA raconte quand on lui donne votre nom.")}
              sous={fr(
                "La seule question du scan qui prononce votre nom, posée à chaque moteur. Elle ne compte pas dans le score : les autres questions mesurent la découverte spontanée, celle-ci mesure ce que les IA récitent sur vous.",
              )}
            >
              <MiroirDocument miroir={donnees.miroir} />
            </Section>
          ) : null}

          <Section
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
            sous={fr(
              "Relevé sur le fichier public robots.txt de votre site, le jour de la mesure. Un robot refusé ne lira jamais ce que vous publiez, quel que soit le contenu.",
            )}
          >
            <AuditRobots audit={scan.audit} domaine={scan.website_url} />
          </Section>

          {donnees.sources.totalLectures ? (
            <Section
              id="lectures"
              numero={numero("lectures")}
              kicker="les sources"
              titre={frTitre(donnees.titreSources ?? "Où les IA vont lire.")}
              sous={fr(
                "Relevées dans les réponses elles-mêmes : ce sont les sites que les moteurs ont consultés pendant la mesure pour répondre aux questions de votre marché. Être cité là, c'est entrer dans la matière première des réponses.",
              )}
            >
              <SourcesVue sources={donnees.sources} />
            </Section>
          ) : null}

          <Section
            id="plan"
            numero={numero("plan")}
            kicker="les 90 prochains jours"
            titre={frTitre("Le plan, phase par phase.")}
            sous={fr(
              "Construit sur cette mesure, pas sur un gabarit : chaque phase part d'un constat relevé plus haut, et liste ce qu'il y a à faire pour le changer.",
            )}
          >
            <Plan90 phases={donnees.plan} />

            <div className="avoid-break mt-16 border border-ink p-6 sm:p-10">
              <Label>et maintenant</Label>
              <h3 className="mt-2 text-[24px] leading-tight sm:text-[30px]">
                {frTitre("Ce plan est exactement ce que le Sprint GEO exécute.")}
              </h3>
              <p className="measure mt-4 text-[15px] leading-relaxed text-ink-2">
                {fr(
                  `Les trois phases ci-dessus, livrées en 90 jours : les correctifs techniques posés, 5 contenus écrits pour les questions à prendre, 8 cibles de citation travaillées, et le re-scan à J+90 qui rejoue ces ${donnees.echantillon.questions} questions à l'identique pour mesurer l'écart. 2 900 € HT, une fois, sans abonnement.`,
                )}
              </p>
              <p className="mt-3 text-[14px] font-medium">
                {fr("Nous garantissons les actions livrées, jamais un score.")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                <Link to="/sprint" className="cta">
                  {fr("Le programme des 90 jours, étape par étape")}
                </Link>
                <a href={`mailto:${CONTACT_EMAIL}`} className="ink-link num text-[14px]">
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </Section>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
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
 * L'en-tête de chapitre : le numéro, l'angle, et un TITRE QUI ÉNONCE LE
 * CONSTAT avec les chiffres réels. « Part de voix » n'apprend rien ; « Sur 24
 * questions posées, votre marque apparaît sur 3 » se lit en partage d'écran
 * avant même que le consultant parle. Si la donnée manque, la section
 * n'existe pas.
 */
function Section({
  id,
  numero,
  kicker,
  titre,
  sous,
  children,
}: {
  id: string;
  numero: number;
  kicker: string;
  titre: React.ReactNode;
  sous?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-24 scroll-mt-8">
      <div className="mb-8 border-b border-rule-strong pb-5">
        <p className="num text-[11px] uppercase tracking-[0.16em] text-ink-3">
          {String(numero).padStart(2, "0")} · {kicker}
        </p>
        <h2 className="mt-2 max-w-[30ch] text-[30px] leading-[1.06] md:text-[42px]">{titre}</h2>
        {sous ? (
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{sous}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
