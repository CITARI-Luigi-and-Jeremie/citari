import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { chargerVisio } from "@/lib/scan.functions";
import { construireDocument, type LigneSourceReponse } from "@/lib/rapport-complet";
import { TitreChiffre, TexteMarque } from "@/components/rapport-complet";
import { acteDe, construireVisio, type EcranVisio } from "@/lib/visio";
import type { LigneMention, LigneQuestion } from "@/lib/rapport-apercu";
import { dateFr, fr, frTitre, NBSP } from "@/lib/typo";
import { cn } from "@/lib/utils";

/**
 * LA VISIO — le support de présentation du scan complet, plein écran.
 *
 * Un déroulé que Luigi commente en partage d'écran : flèches (et télécommande
 * de présentation : PageUp/PageDown), numéro d'écran visible, un message par
 * écran, jamais de défilement. Ce n'est pas le rapport autonome : l'URL
 * n'est liée nulle part, elle se tape.
 *
 * L'esthétique applique DESIGN.md à la lettre, et la discipline d'un
 * document d'expertise : un CHROME IDENTIQUE sur chaque écran (filet haut
 * avec l'acte et le numéro, filet bas avec la marque et la date, tout en
 * mono), une grille ancrée à gauche, trois tailles de texte par écran au
 * plus, plus de la moitié de vide, zéro carte, zéro ombre, zéro icône. Le
 * minium ne dit qu'une chose : la perte. Les concurrents se surlignent en
 * encre. C'est la constance du gabarit qui fait « pro », pas les effets.
 */

const RechercheVisio = z.object({
  /** Places restantes du mois, saisies par Luigi (`?places=2`) : un chiffre
   *  réel ou rien. La doctrine interdit une rareté inventée. */
  places: z.coerce.number().int().min(0).max(9).optional(),
});

export const Route = createFileRoute("/visio/$jeton")({
  validateSearch: (search) => RechercheVisio.parse(search),
  loader: async ({ params }) => {
    const data = await chargerVisio({ data: { jeton: params.jeton } });
    if (!data || data.scan.mode === "apercu") throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Visio · ${loaderData.scan.brand_name}` : "Visio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32">
      <h1 className="text-[40px]">Présentation introuvable</h1>
      <p className="mt-4 text-ink-2">Ce lien ne correspond à aucun scan complet.</p>
    </div>
  ),
  component: Visio,
});

function Visio() {
  const { scan, questions, reponses, mentions, apercu } = Route.useLoaderData();
  const { places } = Route.useSearch();
  const score = Math.round(Number(scan.score_global ?? 0));

  const classes = (scan.concurrent_classes ?? {}) as Record<string, string>;
  const alias = (scan.brand_aliases ?? {}) as Record<string, string>;

  const { ecrans, actes } = useMemo(() => {
    const donnees = construireDocument({
      marque: scan.brand_name,
      site: scan.website_url,
      questions: questions as LigneQuestion[],
      reponses: reponses as unknown as LigneSourceReponse[],
      mentions: mentions as unknown as LigneMention[],
      classes,
      alias,
      mesures: scan,
      miroir: scan.miroir,
      audit: scan.audit,
      actions: scan.actions,
      ville: scan.city,
    });
    return construireVisio({
      donnees,
      questions: questions as LigneQuestion[],
      mentions: mentions as unknown as LigneMention[],
      classes,
      alias,
      date: scan.completed_at ? dateFr(scan.completed_at) : dateFr(scan.created_at),
      completedAt: scan.completed_at ?? scan.created_at,
      apercu,
      score,
      places: places ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan, questions, reponses, mentions, apercu, places]);

  const [index, setIndex] = useState(0);
  const aller = useCallback(
    (cible: number) => setIndex(Math.max(0, Math.min(ecrans.length - 1, cible))),
    [ecrans.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // PageDown/PageUp : les télécommandes de présentation parlent ce
      // langage, pas celui des flèches.
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        aller(index + 1);
      }
      if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        aller(index - 1);
      }
      if (e.key === "Home") aller(0);
      if (e.key === "End") aller(ecrans.length - 1);
      if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aller, index, ecrans.length]);

  const ecran = ecrans[index]!;
  const acte = acteDe(actes, index);

  return (
    <div className="fixed inset-0 flex flex-col bg-paper text-ink">
      {/* ------------------------------------------------ chrome haut */}
      <header className="flex items-baseline justify-between border-b border-rule px-[4vw] py-3">
        <span className="num text-[10px] uppercase tracking-[0.22em] text-ink-3">
          acte {acte.numero} · {acte.nom}
        </span>
        <span className="num text-[11px] tabular-nums">
          {String(index + 1).padStart(2, "0")}
          <span className="text-ink-3"> / {String(ecrans.length).padStart(2, "0")}</span>
        </span>
      </header>

      {/* ---------------------------------------------------- l'écran */}
      <main key={index} className="relative min-h-0 flex-1 px-[7vw] py-[5vh]">
        <Ecran ecran={ecran} marque={scan.brand_name} />

        {/* Zones de clic discrètes, pour présenter au trackpad. */}
        <button
          type="button"
          aria-label="Écran précédent"
          onClick={() => aller(index - 1)}
          className="absolute inset-y-0 left-0 w-[8%] cursor-w-resize opacity-0"
        />
        <button
          type="button"
          aria-label="Écran suivant"
          onClick={() => aller(index + 1)}
          className="absolute inset-y-0 right-0 w-[8%] cursor-e-resize opacity-0"
        />
      </main>

      {/* ------------------------------------------------- chrome bas */}
      <footer className="flex items-baseline justify-between border-t border-rule px-[4vw] py-3">
        <span className="num text-[10px] uppercase tracking-[0.22em] text-ink-3">
          citari · document de mesure
        </span>
        <span className="num text-[10px] text-ink-3">
          {scan.brand_name} ·{" "}
          {scan.completed_at ? dateFr(scan.completed_at) : dateFr(scan.created_at)}
        </span>
      </footer>
    </div>
  );
}

/* ==================================================================== */
/*  Les écrans. Trois tailles par écran, jamais plus : l'énoncé en       */
/*  serif, le chiffre en mono, la métadonnée en mono 10px.               */
/* ==================================================================== */

function Ecran({ ecran, marque }: { ecran: EcranVisio; marque: string }) {
  switch (ecran.type) {
    /* -------------------------------------------------- 01 · la garde */
    case "garde":
      return (
        <div className="flex h-full flex-col justify-between">
          <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-3">
            mesure du {ecran.date}
          </p>
          <div>
            <h1 className="text-[9vw] font-extrabold leading-[0.9] tracking-[-0.04em]">
              {ecran.marque}
            </h1>
            <p className="serif-roman mt-[4vh] max-w-[30ch] text-[2.2vw] leading-[1.25]">
              <TitreChiffre
                texte={fr(
                  `${ecran.questions} questions d'acheteur, posées aux ${ecran.moteurs} moteurs, web ouvert.`,
                )}
              />
            </p>
          </div>
          <p className="num text-[11px] text-ink-3">
            {ecran.reponsesLues} réponses lues · conservées mot pour mot · aucune donnée simulée
          </p>
        </div>
      );

    /* -------------------------------------------------- 02 · le score */
    case "score":
      return (
        <div className="flex h-full items-center gap-[6vw]">
          <div className="min-w-0 flex-1">
            <p className="serif-roman max-w-[18ch] text-[3vw] leading-[1.18]">
              <TitreChiffre
                texte={fr(
                  `Sur ${ecran.lues} réponses, votre nom sort ${ecran.vosReponses} fois.`,
                )}
                alerte={[String(ecran.vosReponses)]}
              />
            </p>
            {ecran.apercu ? (
              <p className="num mt-[5vh] border-t border-rule pt-3 text-[12px] text-ink-2">
                aperçu, de mémoire ({dateFr(ecran.apercu.date)}) : {ecran.apercu.score}
                {NBSP}·{NBSP}moteurs connectés au web : {ecran.score}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <div className="num text-[18vw] leading-[0.8] tracking-[-0.06em]">{ecran.score}</div>
            <div className="mt-2 flex items-baseline justify-end gap-3">
              <span className="num text-[12px] text-ink-3">sur 100</span>
              <span className="text-[1.6vw] font-bold text-signal">{ecran.verdictMot}</span>
            </div>
          </div>
        </div>
      );

    /* -------------------------------------------- 03 · la part de voix */
    case "voix": {
      const maxi = Math.max(...ecran.lignes.map((l) => l.reponses), 1);
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="serif-roman max-w-[28ch] text-[2.6vw] leading-[1.15]">
            <TitreChiffre
              texte={
                ecran.facteur
                  ? fr(
                      `Chacun de vos rivaux est nommé au moins ${ecran.facteur} fois plus que vous.`,
                    )
                  : fr("Voici qui occupe vos réponses, comptées une à une.")
              }
            />
          </p>
          <div className="mt-[6vh] max-w-[74vw]">
            {ecran.lignes.map((l) => (
              <div key={l.nom} className="flex items-center gap-[2vw] border-b border-rule py-[1.6vh]">
                <span
                  className={cn(
                    "w-[16vw] shrink-0 truncate text-[1.3vw]",
                    l.cible ? "font-semibold text-signal" : "text-ink",
                  )}
                >
                  {l.nom}
                </span>
                <span className="h-[2.6vh] flex-1">
                  <span
                    className={cn("block h-full", l.cible ? "bg-signal" : "bg-ink")}
                    style={{ width: `${Math.max(1, (l.reponses / maxi) * 100)}%` }}
                  />
                </span>
                <span className="num w-[4ch] shrink-0 text-right text-[1.4vw] tabular-nums">
                  {l.reponses}
                </span>
              </div>
            ))}
          </div>
          <p className="num mt-4 text-[11px] text-ink-3">
            réponses distinctes où la marque apparaît, sur {ecran.lues} lues · variantes regroupées
          </p>
        </div>
      );
    }

    /* ---------------------------------------------- 04 · 50 contre 6 */
    case "reco":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="serif-roman max-w-[26ch] text-[2.8vw] leading-[1.15]">
            {fr("Être cité n'est pas être recommandé.")}
          </p>
          <div className="mt-[7vh] flex max-w-[60vw] items-end gap-[8vw]">
            <div>
              <div className="num text-[9vw] leading-[0.85] tracking-[-0.05em]">
                {ecran.recoAdversaire}
              </div>
              <p className="num mt-3 border-t border-rule pt-2 text-[13px]">
                réponses où {ecran.adversaire} est recommandé
              </p>
            </div>
            <div>
              <div className="num text-[9vw] leading-[0.85] tracking-[-0.05em] text-signal">
                {ecran.recoVous}
              </div>
              <p className="num mt-3 border-t border-rule pt-2 text-[13px] text-signal">
                où vous l'êtes
              </p>
            </div>
          </div>
          <p className="num mt-[6vh] text-[11px] text-ink-3">
            recommandations explicites, relevées phrase par phrase · voici les pièces
          </p>
        </div>
      );

    /* ------------------------------------------ 05-09 · les pièces */
    case "piece":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            pièce {ecran.indexPiece} / {ecran.totalPieces} · question{" "}
            {String(ecran.piece.rang).padStart(2, "0")} · {ecran.piece.moteur}
          </p>
          <p className="mt-[2vh] max-w-[58ch] text-[1.25vw] font-medium leading-snug text-ink-2">
            {ecran.piece.question}
          </p>
          <blockquote className="serif-ital mt-[5vh] max-w-[38ch] text-[2.6vw] leading-[1.3]">
            <span className="text-ink-3">«{NBSP}</span>
            <MarquageEncre texte={ecran.piece.texte} />
            <span className="text-ink-3">{NBSP}»</span>
          </blockquote>
          <p className="num mt-[5vh] text-[14px] font-medium text-signal">{ecran.piece.statut}</p>
        </div>
      );

    /* --------------------------------------- 10 · la question décisive */
    case "decisive":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            la question décisive · question {String(ecran.rang).padStart(2, "0")}
          </p>
          <p className="serif-roman mt-[3vh] max-w-[30ch] text-[2.6vw] leading-[1.2]">
            «{NBSP}{ecran.question}{NBSP}»
          </p>
          <div className="mt-[7vh] flex max-w-[62vw] items-baseline gap-[6vw] border-t border-rule pt-[3vh]">
            <span className="num text-[1.6vw]">
              {ecran.moteurs} <span className="text-[12px] text-ink-3">moteurs ont répondu</span>
            </span>
            <span className="num text-[1.6vw]">
              {ecran.marques} <span className="text-[12px] text-ink-3">marques citées</span>
            </span>
            <span className="num text-[1.6vw] font-medium text-signal">
              vous{NBSP}: aucune réponse
            </span>
          </div>
        </div>
      );

    /* -------------------------------------------- 11, 13, 15 · causes */
    case "cause":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            cause {ecran.numero} / 3
          </p>
          <h2 className="serif-roman mt-[3vh] max-w-[22ch] text-[4vw] leading-[1.08]">
            {frTitre(ecran.titre)}
          </h2>
          <p className="mt-[4vh] max-w-[52ch] text-[1.4vw] leading-relaxed text-ink-2">
            {fr(ecran.phrase)}
          </p>
        </div>
      );

    /* --------------------------------------- 12 · preuve : la matière */
    case "preuve-matiere":
      return (
        <div className="flex h-full flex-col justify-center">
          <div className="flex max-w-[64vw] items-end gap-[8vw]">
            <div>
              <div className="num text-[8vw] leading-[0.85] tracking-[-0.05em]">{ecran.lectures}</div>
              <p className="num mt-3 border-t border-rule pt-2 text-[13px]">
                lectures faites par les moteurs pendant la mesure
              </p>
            </div>
            <div>
              <div className="num text-[8vw] leading-[0.85] tracking-[-0.05em] text-signal">
                {ecran.votreSite}
              </div>
              <p className="num mt-3 border-t border-rule pt-2 text-[13px] text-signal">
                sur votre site
              </p>
            </div>
          </div>
          {ecran.questionsPerdues.length ? (
            <div className="mt-[7vh] max-w-[60vw]">
              <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
                et aucune page chez vous ne répond à
              </p>
              {ecran.questionsPerdues.map((q) => (
                <p key={q} className="serif-roman mt-[1.6vh] border-b border-rule pb-[1.4vh] text-[1.5vw] leading-snug">
                  «{NBSP}{q}{NBSP}»
                </p>
              ))}
            </div>
          ) : null}
        </div>
      );

    /* ------------------------------------- 14 · preuve : les adresses */
    case "preuve-adresses":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="serif-roman max-w-[26ch] text-[2.6vw] leading-[1.15]">
            {fr("Leurs adresses sur votre marché, comptées en lectures.")}
          </p>
          <div className="mt-[5vh] max-w-[54vw]">
            {ecran.adresses.map((a) => (
              <div key={a.hote} className="flex items-baseline gap-4 border-b border-rule py-[1.5vh]">
                <span className="num text-[1.5vw]">{a.hote}</span>
                <span className="conduite" aria-hidden />
                <span className="num shrink-0 text-[1.2vw] tabular-nums">
                  {a.lectures} <span className="text-[11px] text-ink-3">lectures</span>
                </span>
              </div>
            ))}
          </div>
          <p className="num mt-[4vh] text-[14px] font-medium text-signal">
            vous ne figurez sur aucune
          </p>
        </div>
      );

    /* ------------------------------------- 16 · preuve : l'identité */
    case "preuve-identite":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            {ecran.moteur}, quand on lui donne votre nom · hors score
          </p>
          <blockquote className="serif-roman mt-[4vh] max-w-[52ch] text-[1.8vw] leading-[1.4]">
            «{NBSP}{ecran.extrait}{NBSP}»
          </blockquote>
          <p className="num mt-[5vh] border-t border-rule pt-3 text-[13px] text-ink-2">
            rien sur votre site ne dit aux machines qui vous êtes
            {ecran.llmstxt ? "" : " · fichier llms.txt : absent"}
          </p>
        </div>
      );

    /* ------------------------------------------ 17 · le calendrier */
    case "plan-calendrier":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="serif-roman max-w-[26ch] text-[2.8vw] leading-[1.15]">
            {fr("Douze semaines, trois chantiers, une remesure.")}
          </p>
          <div className="mt-[6vh] max-w-[58vw]">
            {[
              ["semaines 1-2", "dire aux machines qui vous êtes"],
              ["semaines 2-6", "écrire les pages qui répondent à vos questions perdues"],
              ["semaines 5-12", "être inscrit là où les IA lisent"],
              ["semaine 12", `remesure : vos ${ecran.questions} questions, rejouées à l'identique`],
            ].map(([quand, quoi]) => (
              <div key={quand} className="flex items-baseline gap-6 border-b border-rule py-[1.8vh]">
                <span className="num w-[11vw] shrink-0 text-[1.2vw]">{quand}</span>
                <span className="text-[1.4vw] leading-snug">{fr(quoi)}</span>
              </div>
            ))}
          </div>
        </div>
      );

    /* ------------------------------------------ 18 · les fondations */
    case "plan-fondations":
      return (
        <EcranListe
          kicker="semaines 1-2 · chez vous"
          titre="Dire aux machines qui vous êtes."
          note="une semaine de développeur, pas une refonte"
          items={ecran.actions}
        />
      );

    /* ------------------------------------------- 19 · les contenus */
    case "plan-contenus":
      return (
        <EcranListe
          kicker="semaines 2-6 · vos questions perdues"
          titre="Les pages qui manquent, nommées."
          note="chaque page répond à une question réellement posée aux IA"
          items={ecran.contenus}
        />
      );

    /* ------------------------------------------ 20 · les citations */
    case "plan-citations":
      return (
        <EcranListe
          kicker="semaines 5-12 · là où les IA lisent"
          titre="Être inscrit à leurs adresses."
          note="cibles relevées dans les sources de votre propre mesure"
          items={ecran.cibles}
        />
      );

    /* ------------------------------------------- 21 · la remesure */
    case "remesure":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="serif-roman max-w-[26ch] text-[2.8vw] leading-[1.15]">
            <TitreChiffre
              texte={fr(`Le ${ecran.dateRemesure}, on repose exactement les mêmes questions.`)}
            />
          </p>
          <div className="mt-[5vh] max-w-[58vw]">
            {ecran.questionsExemple.map((q) => (
              <p key={q} className="serif-ital mt-[1.4vh] text-[1.4vw] leading-snug text-ink-2">
                «{NBSP}{q}{NBSP}» …
              </p>
            ))}
          </div>
          <p className="num mt-[6vh] border-t border-rule pt-3 text-[1.4vw]">
            la ligne comparée{NBSP}: votre nom dans {ecran.vosReponses} réponses sur {ecran.lues}
            {NBSP}<span className="text-ink-3">→</span>{NBSP}
            <span className="text-signal">?</span>
          </p>
          <p className="num mt-3 text-[11px] text-ink-3">
            mêmes questions, mêmes moteurs, chiffres publiés · c'est ce qui rend l'écart mesurable
          </p>
        </div>
      );

    /* ---------------------------------------------- 22 · l'offre */
    default:
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            une seule offre · sans abonnement
          </p>
          <h2 className="serif-roman mt-[2vh] text-[5vw] leading-[1.02]">Sprint GEO</h2>
          <div className="num mt-[3vh] text-[3.4vw] tracking-[-0.03em]">
            2{NBSP}900{NBSP}€ <span className="text-[1.2vw] text-ink-3">HT · une fois</span>
          </div>
          <div className="mt-[4vh] flex max-w-[54vw] items-baseline gap-[4vw] border-t border-rule pt-[2.5vh]">
            {["5 contenus", "8 citations", "remesure incluse"].map((x) => (
              <span key={x} className="num text-[1.3vw]">{x}</span>
            ))}
          </div>
          <p className="serif-roman mt-[6vh] max-w-[40ch] text-[1.6vw] leading-[1.35]">
            {fr("Si votre score est bon, on vous le dit et on ne vous vend rien.")}
          </p>
          <p className="num mt-[3vh] text-[13px] text-ink-2">
            cadence{NBSP}: 3 sprints par mois, pas plus
            {ecran.places !== null ? (
              <span className="text-signal">
                {NBSP}· places restantes ce mois-ci{NBSP}: {ecran.places}
              </span>
            ) : null}
          </p>
        </div>
      );
  }
}

/** Une liste de chantier : kicker, titre serif, lignes numérotées, note. */
function EcranListe({
  kicker,
  titre,
  note,
  items,
}: {
  kicker: string;
  titre: string;
  note: string;
  items: string[];
}) {
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">{kicker}</p>
      <h2 className="serif-roman mt-[2vh] max-w-[24ch] text-[3vw] leading-[1.1]">{frTitre(titre)}</h2>
      <div className="mt-[5vh] max-w-[58vw]">
        {items.map((item, i) => (
          <div key={item} className="flex items-baseline gap-5 border-b border-rule py-[1.6vh]">
            <span className="num shrink-0 text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[1.4vw] leading-snug">{fr(item)}</span>
          </div>
        ))}
      </div>
      <p className="num mt-[3vh] text-[11px] text-ink-3">{note}</p>
    </div>
  );
}

/**
 * Le marquage des concurrents dans un verbatim, version visio : le nom du
 * concurrent se surligne EN ENCRE (règle du déroulé : concurrents en encre,
 * l'absence seule est en minium). Le marqueur `*...*` vient de l'assemblage.
 */
function MarquageEncre({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*[^*]+\*)/g);
  return (
    <>
      {morceaux.map((bout, i) =>
        bout.startsWith("*") && bout.endsWith("*") && bout.length > 2 ? (
          <span key={i} className="border-b-2 border-ink font-semibold not-italic">
            {bout.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{bout}</span>
        ),
      )}
    </>
  );
}
