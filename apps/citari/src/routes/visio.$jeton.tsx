import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { chargerVisio } from "@/lib/scan.functions";
import { construireDocument, type LigneSourceReponse } from "@/lib/rapport-complet";
import { TitreChiffre } from "@/components/rapport-complet";
import { GrilleFond } from "@/components/jeremie/rapport/GrilleFond";
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
 * LE THÉÂTRE SOMBRE : la scène est l'encre, le texte est le papier — la
 * grammaire sombre déjà validée du site. Le chrome est identique sur chaque
 * écran : les six actes en haut, la marque en bas, la progression en filet.
 * Sur l'encre, le minium — éclairci pour rester lisible — ne dit qu'une
 * chose, le manque. Zéro carte, zéro ombre, zéro icône.
 *
 * LE CONTENU (refonte du 16/08/2026, architecture validée) : chaque écran
 * porte une donnée propre à CE prospect et un enseignement en français
 * courant. Les textes sont assemblés dans `lib/visio.ts` ; cette page ne
 * fait qu'afficher.
 */

const CSS_SCENE = `
.visio-scene{
  background: var(--ink);
  color: var(--paper);
  --v-fil: color-mix(in srgb, var(--paper) 16%, transparent);
  --v-mut: color-mix(in srgb, var(--paper) 68%, var(--ink));
  --v-mut2: color-mix(in srgb, var(--paper) 52%, var(--ink));
  --v-minium: color-mix(in srgb, var(--signal) 55%, var(--paper));
}
/* Les utilitaires du document, retournés pour la scène sombre : le même
   balisage sert les deux mondes, seule la lumière change. */
.visio-scene .text-ink{color:var(--paper)}
.visio-scene .text-ink-2{color:var(--v-mut)}
.visio-scene .text-ink-3{color:var(--v-mut2)}
.visio-scene .text-signal{color:var(--v-minium)}
.visio-scene .bg-ink{background-color:var(--paper)}
.visio-scene .bg-signal{background-color:var(--v-minium)}
.visio-scene .border-rule{border-color:var(--v-fil)}
.visio-scene .border-ink{border-color:var(--paper)}
.visio-scene .conduite{border-bottom-color:color-mix(in srgb, var(--paper) 30%, transparent)}
`;

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
  const { scan, questions, reponses, mentions, apercu, analyse } = Route.useLoaderData();
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
      reponses: reponses as unknown as LigneSourceReponse[],
      analyse: analyse ?? null,
      places: places ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan, questions, reponses, mentions, apercu, analyse, places]);

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
    <div className="visio-scene fixed inset-0 flex flex-col overflow-hidden">
      <style>{CSS_SCENE}</style>
      <GrilleFond />

      {/* Le fil de progression : la seule chose qui bouge entre deux écrans. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-20 h-[2px] bg-signal transition-[width] duration-300 ease-out"
        style={{ width: `${((index + 1) / ecrans.length) * 100}%` }}
      />

      {/* ------------------------------------------------ chrome haut */}
      <header className="relative z-10 flex items-baseline justify-between gap-6 border-b border-rule px-[4vw] py-3">
        <span className="num shrink-0 text-[11px] font-semibold uppercase tracking-[0.3em]">
          citari
        </span>
        <span className="hidden min-w-0 items-baseline gap-4 overflow-hidden whitespace-nowrap md:flex">
          {actes.map((a, i) => (
            <span
              key={a.nom}
              className={cn(
                "num text-[10px] uppercase tracking-[0.22em] transition-colors duration-300",
                i + 1 === acte.numero ? "text-paper" : "text-ink-3",
              )}
            >
              {a.nom}
            </span>
          ))}
        </span>
        <span className="num shrink-0 text-[11px] tabular-nums">
          {String(index + 1).padStart(2, "0")}
          <span className="text-ink-3"> / {String(ecrans.length).padStart(2, "0")}</span>
        </span>
      </header>

      {/* ---------------------------------------------------- l'écran */}
      <main key={index} className="anim-panel relative z-10 min-h-0 flex-1 px-[7vw] py-[5vh]">
        <Ecran ecran={ecran} />

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
      <footer className="relative z-10 flex items-baseline justify-between border-t border-rule px-[4vw] py-3">
        <span className="num text-[10px] uppercase tracking-[0.22em] text-ink-3">
          document de mesure · rien de simulé
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

function Ecran({ ecran }: { ecran: EcranVisio }) {
  switch (ecran.type) {
    /* -------------------------------------------------- 01 · la garde */
    case "garde":
      return (
        <div className="flex h-full flex-col justify-between">
          <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-3">
            mesure du {ecran.date} · conservée mot pour mot
          </p>
          <div>
            <h1 className="text-[9vw] font-extrabold leading-[0.9] tracking-[-0.04em]">
              {ecran.marque}
            </h1>
            <p className="serif-roman mt-[4vh] max-w-[32ch] text-[2.2vw] leading-[1.25] text-ink-2">
              <TitreChiffre
                texte={fr(
                  `${ecran.questions} questions d'acheteur, posées aux ${ecran.moteurs} moteurs, web ouvert. ${ecran.reponsesLues} réponses lues.`,
                )}
              />
            </p>
          </div>
          <p className="serif-ital max-w-[44ch] text-[1.4vw] leading-snug">
            {fr(
              "La règle du jeu : si votre score est bon, on vous le dit et on ne vous vend rien.",
            )}
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
              <div className="num mt-[5vh] max-w-[34vw] border-t border-rule pt-3 text-[12px] text-ink-2">
                <p>
                  de mémoire (aperçu du {dateFr(ecran.apercu.date)}, 2 moteurs) :{" "}
                  {ecran.apercu.score}
                </p>
                <p className="mt-1">
                  en lisant le web ({ecran.moteurs} moteurs, {ecran.questions} questions) :{" "}
                  {ecran.score}
                </p>
                {ecran.apercu.score > ecran.score ? (
                  <p className="mt-3 text-ink-3">
                    deux protocoles, un enseignement : ce que les moteurs répondront demain
                    ressemble au {ecran.score}, pas au {ecran.apercu.score}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <div className="num text-[18vw] leading-[0.8] tracking-[-0.06em]">
              <Compteur valeur={ecran.score} />
            </div>
            <div className="mt-2 flex items-baseline justify-end gap-3">
              <span className="num text-[12px] text-ink-3">sur 100</span>
              <span className="text-[1.6vw] font-bold text-signal">{ecran.verdictMot}</span>
            </div>
          </div>
        </div>
      );

    /* ------------------------------------------------ 03 · l'annonce */
    case "annonce":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            ce qu'on va vous prouver
          </p>
          <div className="mt-[3vh] max-w-[58vw]">
            {ecran.constats.map((c, i) => (
              <div key={c} className="flex items-baseline gap-6 border-b border-rule py-[2.6vh]">
                <span className="num shrink-0 text-[13px] text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="serif-roman text-[2vw] leading-[1.25]">
                  <TitreChiffre texte={fr(c)} />
                </p>
              </div>
            ))}
          </div>
          <p className="num mt-[4vh] text-[11px] text-ink-3">
            des faits mesurés, pas des arguments · le déroulé les prend un par un
          </p>
        </div>
      );

    /* --------------------------------------- 04 · la carte des réponses */
    case "matrice":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            la carte des {ecran.reponsesLues} réponses · une case = une réponse
          </p>
          <div className="mt-[4vh]">
            {ecran.moteurs.map((m, mi) => (
              <div key={m} className="flex items-center gap-[1.5vw] py-[0.8vh]">
                <span className="num w-[8vw] shrink-0 text-[11px] text-ink-3">{m}</span>
                <div className="flex flex-1 gap-[0.4vw]">
                  {ecran.lignes.map((l) => (
                    <span
                      key={l.rang}
                      className={cn(
                        "h-[4.4vh] flex-1",
                        l.etats[mi] === "cite" && "bg-ink",
                        l.etats[mi] === "absent" && "border border-rule",
                        l.etats[mi] === "erreur" && "border border-rule opacity-30",
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-baseline gap-[1.5vw]">
              <span className="w-[8vw] shrink-0" />
              <span className="num flex-1 text-[10px] text-ink-3">
                questions 01 → {String(ecran.lignes.length).padStart(2, "0")}
              </span>
            </div>
          </div>
          <p className="num mt-[4vh] text-[11px] text-ink-3">
            case pleine : votre marque présente · vide : absente · estompée : réponse en erreur,
            sortie des comptes
          </p>
        </div>
      );

    /* -------------------------------------- 05 · les moments d'achat */
    case "moments": {
      const pire = [...ecran.lignes].sort(
        (a, b) => a.citees - b.citees || b.mesurees - a.mesurees,
      )[0];
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            les {ecran.lignes.reduce((s, l) => s + l.mesurees, 0)} questions posées pendant votre
            mesure, par moment d'achat
          </p>
          <div className="mt-[3vh] max-w-[62vw]">
            {ecran.lignes.map((l) => (
              <div key={l.titre} className="border-b border-rule py-[1.9vh]">
                <div className="flex items-baseline justify-between gap-6">
                  <span className="serif-roman text-[1.9vw] leading-snug">{fr(l.titre)}</span>
                  <span className="num shrink-0 text-[1.6vw] tabular-nums">
                    <span className={cn(l.citees === 0 && "text-signal")}>{l.citees}</span>
                    <span className="text-ink-3"> / {l.mesurees}</span>
                  </span>
                </div>
                {l.exemple ? (
                  <p className="serif-ital mt-1 truncate text-[1vw] text-ink-3">
                    «{NBSP}{l.exemple}{NBSP}»
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <p className="num mt-[3.5vh] max-w-[62vw] text-[11px] text-ink-2">
            {pire && pire.citees === 0
              ? fr(`« ${pire.titre} » se joue aujourd'hui sans vous, sur ${pire.mesurees} questions.`)
              : "réponses où votre marque apparaît / questions mesurées"}
            {ecran.canal
              ? ` · pour répondre, les moteurs ont fait ${ecran.canal.lectures} lectures, dont ${ecran.canal.annuaires.join(" et ")} : des adresses que vous connaissez déjà`
              : null}
          </p>
        </div>
      );
    }

    /* --------------------------------------- 06 · la question décisive */
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

    /* --------------------------------------- 07 · les recommandations */
    case "reco":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="serif-roman max-w-[28ch] text-[2.8vw] leading-[1.15]">
            {fr("Être cité n'est pas être recommandé. Pourquoi eux ?")}
          </p>
          <div className="mt-[7vh] flex max-w-[70vw] items-end gap-[7vw]">
            {ecran.lignes.map((l) => (
              <div key={l.nom}>
                <div className="num text-[8vw] leading-[0.85] tracking-[-0.05em]">
                  <Compteur valeur={l.reco} />
                </div>
                <p className="num mt-3 border-t border-rule pt-2 text-[13px]">
                  réponses où {l.nom} est recommandé
                </p>
              </div>
            ))}
            <div>
              <div className="num text-[8vw] leading-[0.85] tracking-[-0.05em] text-signal">
                <Compteur valeur={ecran.vous} />
              </div>
              <p className="num mt-3 border-t border-rule pt-2 text-[13px] text-signal">
                où vous l'êtes
              </p>
            </div>
          </div>
          <p className="num mt-[6vh] text-[11px] text-ink-3">
            recommandations explicites, relevées phrase par phrase · les trois écrans suivants
            répondent au pourquoi
          </p>
        </div>
      );

    /* --------------------------------- 08 · l'identité, moteur par moteur */
    case "identite":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            parce qu'elles ne vous comprennent pas · le métier que chaque moteur prête à{" "}
            {ecran.marque}, hors score
          </p>
          <div className="mt-[4vh] max-w-[68vw]">
            {ecran.lignes.map((l) => {
              const inconnu = l.metier.toLowerCase().includes("non précisé");
              return (
                <div
                  key={l.moteur}
                  className="flex items-baseline gap-[2.5vw] border-b border-rule py-[1.7vh]"
                >
                  <span className="num w-[9vw] shrink-0 text-[12px] text-ink-3">{l.moteur}</span>
                  <span
                    className={cn(
                      "serif-roman w-[24vw] shrink-0 text-[1.7vw] leading-snug",
                      inconnu && "text-signal",
                    )}
                  >
                    {fr(l.metier)}
                  </span>
                  {l.citation ? (
                    <span className="serif-ital min-w-0 flex-1 truncate text-[1vw] text-ink-3">
                      «{NBSP}{l.citation}{NBSP}»
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="num mt-[4vh] text-[11px] text-ink-3">
            une machine ne recommande pas ce qu'elle ne comprend pas
            {ecran.llmstxt ? "" : (
              <span className="text-signal">
                {NBSP}· fichier llms.txt{NBSP}: absent lors de la mesure
              </span>
            )}
          </p>
        </div>
      );

    /* --------------------------- 08 bis · secours : l'extrait miroir */
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
            une machine ne recommande pas ce qu'elle ne comprend pas
            {ecran.llmstxt ? "" : " · fichier llms.txt : absent lors de la mesure"}
          </p>
        </div>
      );

    /* ------------------------------------ 09 · le classement des sources */
    case "sources":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="serif-roman max-w-[30ch] text-[2.4vw] leading-[1.15]">
            {fr("Alors elles lisent ailleurs. Voici où, compté en lectures.")}
          </p>
          <div className="mt-[4vh] max-w-[58vw]">
            {ecran.lignes.map((l) => (
              <div
                key={l.hote}
                className="flex items-baseline gap-4 border-b border-rule py-[1.3vh]"
              >
                <span className={cn("num text-[1.5vw]", l.genre === "vous" && "text-signal")}>
                  {l.hote}
                </span>
                <span className="num shrink-0 text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  {l.genre === "vous" ? "votre site" : l.genre === "concurrent" ? "site concurrent" : "adresse tierce"}
                </span>
                <span className="conduite" aria-hidden />
                <span
                  className={cn(
                    "num shrink-0 text-[1.3vw] tabular-nums",
                    l.genre === "vous" && "text-signal",
                  )}
                >
                  {l.lectures} <span className="text-[11px] text-ink-3">lectures</span>
                </span>
              </div>
            ))}
          </div>
          <p className="num mt-[3.5vh] max-w-[60vw] text-[11px] text-ink-2">
            {ecran.robotsOuverts === true
              ? fr(
                  `votre porte est ouverte (robots.txt) : les moteurs sont entrés, ${ecran.lecturesVotreSite} lectures chez vous sur ${ecran.totalLectures}, et sont repartis sans rien à citer`,
                )
              : ecran.robotsOuverts === false
                ? fr(
                    `une partie des robots n'a pas accès à votre site · ${ecran.lecturesVotreSite} lectures chez vous sur ${ecran.totalLectures}`,
                  )
                : fr(`${ecran.lecturesVotreSite} lectures chez vous sur ${ecran.totalLectures}`)}
          </p>
        </div>
      );

    /* ----------------------------------- 10 · ce qu'elles y trouvent */
    case "rival-pourquoi":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            ce qu'elles y trouvent · dans les mots des moteurs
          </p>
          <h2 className="serif-roman mt-[2vh] max-w-[24ch] text-[3vw] leading-[1.1]">
            {frTitre(`Ce que les machines répètent sur ${ecran.rival}.`)}
          </h2>
          <div className="mt-[5vh] max-w-[64vw]">
            {ecran.arguments.map((a, i) => (
              <div key={a.resume} className="flex items-baseline gap-5 border-b border-rule py-[1.8vh]">
                <span className="num shrink-0 text-[12px] text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="w-[16vw] shrink-0 text-[1.5vw] font-semibold leading-snug">
                  {fr(a.resume)}
                </span>
                <span className="serif-ital min-w-0 flex-1 truncate text-[1.2vw] text-ink-2">
                  «{NBSP}{a.citation}{NBSP}»
                </span>
                <span className="num shrink-0 text-[11px] text-ink-3">{a.moteur}</span>
              </div>
            ))}
          </div>
          <p className="num mt-[4vh] text-[11px] text-ink-3">
            extraits mot pour mot des réponses conservées · ce n'est pas son pitch qui gagne,
            c'est qu'il est écrit là où les machines lisent
          </p>
        </div>
      );

    /* -------------------------------------------------- 11 · le pivot */
    case "pivot":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            la seule bonne nouvelle du dossier, et elle est décisive
          </p>
          <h2 className="serif-roman mt-[3vh] max-w-[26ch] text-[3.4vw] leading-[1.1]">
            {ecran.memeTaux
              ? frTitre(
                  `Cité ${ecran.facteur} fois moins que ${ecran.rival.nom}. Recommandé au même taux.`,
                )
              : frTitre("Quand les moteurs vous citent, jamais une phrase négative.")}
          </h2>
          <div className="num mt-[5vh] flex max-w-[60vw] items-baseline gap-[5vw] border-t border-rule pt-[2.5vh] text-[1.4vw]">
            <span>
              vous{NBSP}: recommandé {ecran.recoVous} fois sur {ecran.vosReponses} réponses
            </span>
            <span className="text-ink-2">
              {ecran.rival.nom}{NBSP}: {ecran.rival.reco} sur {ecran.rival.reponses}
            </span>
          </div>
          {ecran.memeTaux && ecran.aucunNegatif ? (
            <p className="num mt-3 text-[13px] text-ink-2">
              et pas une phrase négative relevée sur votre marque
            </p>
          ) : null}
          <p className="serif-ital mt-[5vh] max-w-[46ch] text-[1.5vw] leading-snug text-ink-2">
            {fr(
              "Votre image n'est pas le problème, votre présence l'est. Une réputation se répare en années ; de la matière lisible se fabrique en 90 jours.",
            )}
          </p>
        </div>
      );

    /* ------------------------------------------------ 12 · le terrain */
    case "terrain":
      return (
        <div className="flex h-full flex-col justify-center">
          <div className="flex items-baseline gap-[3vw]">
            <div className="num text-[8vw] leading-[0.85] tracking-[-0.05em]">
              <Compteur valeur={ecran.sansRival} />
            </div>
            <p className="serif-roman max-w-[28ch] text-[1.9vw] leading-[1.2]">
              {fr(
                `réponses sur ${ecran.lues} se jouent sans ${ecran.rival.nom}. C'est là que se gagnent vos 90 jours.`,
              )}
            </p>
          </div>
          {ecran.gagnables.length ? (
            <div className="mt-[4vh] max-w-[62vw]">
              <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
                les questions les mieux gagnables, selon notre classement
              </p>
              {ecran.gagnables.map((g, i) => (
                <div key={g.texte} className="border-b border-rule py-[1.3vh]">
                  <p className="serif-roman text-[1.35vw] leading-snug">
                    <span className="num mr-3 text-[12px] text-ink-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    «{NBSP}{g.texte}{NBSP}»
                  </p>
                  <p className="num mt-1 pl-[2.4vw] text-[11px] text-ink-3">{fr(g.tenants)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );

    /* ------------------------------------------ 13 · les fondations */
    case "plan-fondations":
      return (
        <EcranListe
          kicker="chantier 1 · chez vous"
          titre="Dire aux machines qui vous êtes."
          note="découle de l'écran identité : on écrit ce que les moteurs n'ont pas su dire · une semaine de développeur, pas une refonte"
          items={ecran.actions}
        />
      );

    /* --------------------------------------------- 14 · les pages */
    case "plan-pages":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            chantier 2 · vos questions perdues
          </p>
          <h2 className="serif-roman mt-[2vh] max-w-[24ch] text-[3vw] leading-[1.1]">
            {frTitre("Les pages qui manquent, nommées.")}
          </h2>
          <div className="mt-[4vh] max-w-[62vw]">
            {ecran.pages.map((p, i) => (
              <div key={p.titre} className="border-b border-rule py-[1.4vh]">
                <p className="text-[1.35vw] leading-snug">
                  <span className="num mr-3 text-[12px] text-ink-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {fr(`Une page qui répond à : « ${p.titre} »`)}
                </p>
                {p.lus.length ? (
                  <p className="num mt-1 pl-[2.4vw] text-[11px] text-ink-3">
                    lu à la place{NBSP}: {p.lus.join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <p className="num mt-[3vh] text-[11px] text-ink-3">
            chaque page répond à une question réellement posée pendant votre mesure
          </p>
        </div>
      );

    /* ------------------------------------------ 15 · les adresses */
    case "plan-citations":
      return (
        <EcranListe
          kicker="chantier 3 · là où les moteurs lisent"
          titre="Être inscrit à leurs adresses."
          note="relevées dans les sources de votre propre mesure · hors les trois qu'on vous offre à l'écran suivant"
          items={ecran.cibles}
        />
      );

    /* ------------------------------------------ 16 · cette semaine */
    case "semaine":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            avant tout devis · à faire vous-même
          </p>
          <h2 className="serif-roman mt-[2vh] max-w-[26ch] text-[3vw] leading-[1.1]">
            {frTitre(`${ecran.gestes.length === 3 ? "Trois" : "Deux"} gestes dès cette semaine.`)}
          </h2>
          <div className="mt-[4vh] max-w-[62vw]">
            {ecran.gestes.map((g, i) => (
              <div key={g.titre} className="border-b border-rule py-[1.7vh]">
                <p className="text-[1.5vw] font-semibold leading-snug">
                  <span className="num mr-3 text-[12px] font-normal text-ink-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {fr(g.titre)}
                </p>
                <p className="num mt-1 pl-[2.4vw] text-[11px] text-ink-3">{fr(g.detail)}</p>
              </div>
            ))}
          </div>
          <p className="num mt-[3vh] text-[11px] text-ink-3">
            réels, tirés de votre mesure · ils sont à vous, avec ou sans nous
          </p>
        </div>
      );

    /* ------------------------------------------- 17 · l'honnêteté */
    case "honnetete":
      return (
        <div className="flex h-full flex-col justify-center">
          <h2 className="serif-roman max-w-[28ch] text-[3.2vw] leading-[1.12]">
            {frTitre(
              "Ces gestes rendent votre matière lisible. Ils ne garantissent ni place ni score.",
            )}
          </h2>
          <p className="num mt-[5vh] max-w-[54vw] border-t border-rule pt-[2.5vh] text-[1.4vw] leading-relaxed">
            {ecran.rival.nom} tient {ecran.rival.reponses} réponses sur {ecran.lues}. Seule la
            remesure du {ecran.dateRemesure} dira ce qui a bougé.
          </p>
          <p className="num mt-[3vh] text-[11px] text-ink-3">
            on garantit des actions livrées, jamais un rang · c'est la règle de la maison
          </p>
        </div>
      );

    /* ------------------------------------- 18 · le sprint, ligne à ligne */
    case "sprint-lignes":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            le sprint exécute le plan · ligne par ligne
          </p>
          <div className="mt-[3vh] max-w-[70vw]">
            {ecran.lignes.map((l) => (
              <div
                key={l.constat}
                className="flex items-baseline gap-[3vw] border-b border-rule py-[2vh]"
              >
                <span className="serif-ital w-[26vw] shrink-0 text-[1.3vw] leading-snug text-ink-2">
                  {fr(l.constat)}
                </span>
                <span className="num shrink-0 text-[12px] text-ink-3">→</span>
                <span className="min-w-0 flex-1 text-[1.35vw] font-medium leading-snug">
                  {fr(l.livrable)}
                </span>
              </div>
            ))}
          </div>
          <p className="num mt-[3vh] text-[11px] text-ink-3">
            à gauche, vos mesures · à droite, les livrables · on garantit les livrables et la
            remesure, jamais un rang
          </p>
        </div>
      );

    /* ---------------------------------------------- 19 · l'offre */
    case "offre":
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
          <p className="num mt-[5vh] text-[13px] text-ink-2">
            cadence{NBSP}: 3 sprints par mois, pas plus
            {ecran.places !== null ? (
              <span className="text-signal">
                {NBSP}· places restantes ce mois-ci{NBSP}: {ecran.places}
              </span>
            ) : null}
          </p>
        </div>
      );

    /* ------------------------------------------- 20 · la remesure */
    default:
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            le seul engagement du dossier
          </p>
          <p className="serif-roman mt-[2vh] max-w-[26ch] text-[2.8vw] leading-[1.15]">
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
 * Le grand chiffre qui SE COMPTE à l'arrivée de l'écran. Rendu serveur avec
 * sa valeur finale (l'hydratation ne diffère jamais), puis l'effet rejoue la
 * montée en 800 ms. `prefers-reduced-motion` coupe tout.
 */
function Compteur({ valeur }: { valeur: number }) {
  const [v, setV] = useState(valeur);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 800);
      setV(Math.round(valeur * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setV(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [valeur]);
  return <>{v}</>;
}
