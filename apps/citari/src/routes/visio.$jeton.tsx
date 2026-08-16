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
 * LE THÉÂTRE SOMBRE (16/08/2026) : la scène est l'encre, le texte est le
 * papier — la grammaire sombre déjà validée du site (séquence de résultat,
 * sections basses de la landing), pas une charte nouvelle. Le chrome est
 * identique sur chaque écran : les cinq actes en haut, la marque en bas, la
 * progression en filet. Sur l'encre, la convention s'inverse d'un cran : les
 * CONCURRENTS se soulignent en papier, et le minium — éclairci pour rester
 * lisible — ne dit toujours qu'une chose, le manque. Zéro carte, zéro ombre,
 * zéro icône : la constance du gabarit fait « pro », pas les effets.
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
            mesure du {ecran.date}
          </p>
          <div>
            <h1 className="text-[9vw] font-extrabold leading-[0.9] tracking-[-0.04em]">
              {ecran.marque}
            </h1>
            <p className="serif-roman mt-[4vh] max-w-[30ch] text-[2.2vw] leading-[1.25] text-ink-2">
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
                <Compteur valeur={ecran.recoAdversaire} />
              </div>
              <p className="num mt-3 border-t border-rule pt-2 text-[13px]">
                réponses où {ecran.adversaire} est recommandé
              </p>
            </div>
            <div>
              <div className="num text-[9vw] leading-[0.85] tracking-[-0.05em] text-signal">
                <Compteur valeur={ecran.recoVous} />
              </div>
              <p className="num mt-3 border-t border-rule pt-2 text-[13px] text-signal">
                où vous l'êtes
              </p>
            </div>
          </div>
          <p className="num mt-[6vh] text-[11px] text-ink-3">
            recommandations explicites, relevées phrase par phrase · voici pourquoi
          </p>
        </div>
      );

    /* ----------------------------------- 05 · pourquoi le rival gagne */
    case "rival-pourquoi":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            pourquoi lui · dans les mots des moteurs
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
            extraits mot pour mot des réponses conservées · c'est la liste de ce qu'il publie, et
            que vous ne publiez pas
          </p>
        </div>
      );

    /* ------------------------------------------ 06-10 · les pièces */
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
            <MarquagePapier texte={ecran.piece.texte} />
            <span className="text-ink-3">{NBSP}»</span>
          </blockquote>
          <p className="num mt-[5vh] text-[14px] font-medium text-signal">{ecran.piece.statut}</p>
        </div>
      );

    /* --------------------------------------- 11 · la question décisive */
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

    /* ------------------------------------------------ les causes */
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

    /* -------------------------------------------- preuve : la matière */
    case "preuve-matiere":
      return (
        <div className="flex h-full flex-col justify-center">
          <div className="flex max-w-[64vw] items-end gap-[8vw]">
            <div>
              <div className="num text-[8vw] leading-[0.85] tracking-[-0.05em]">
                <Compteur valeur={ecran.lectures} />
              </div>
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
            <div className="mt-[6vh] max-w-[62vw]">
              <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
                et aucune page chez vous ne répond à
              </p>
              {ecran.questionsPerdues.map((q) => (
                <div key={q.texte} className="border-b border-rule py-[1.4vh]">
                  <p className="serif-roman text-[1.5vw] leading-snug">
                    «{NBSP}{q.texte}{NBSP}»
                  </p>
                  {q.lus.length ? (
                    <p className="num mt-1 text-[11px] text-ink-3">
                      lu à la place{NBSP}: {q.lus.join(" · ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );

    /* ------------------------------------------ preuve : les adresses */
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

    /* ------------------------------------------- preuve : l'identité */
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

    /* --------------------------------- l'identité, moteur par moteur */
    case "identite":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-3">
            réponses miroir, hors score · le métier que chaque moteur prête à {ecran.marque}
          </p>
          <div className="mt-[4vh] max-w-[68vw]">
            {ecran.lignes.map((l) => {
              const inconnu = l.metier.toLowerCase().includes("non précisé");
              return (
                <div key={l.moteur} className="flex items-baseline gap-[2.5vw] border-b border-rule py-[1.7vh]">
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
            extraits mot pour mot des réponses conservées
            {ecran.llmstxt ? "" : (
              <span className="text-signal">
                {NBSP}· fichier llms.txt{NBSP}: absent, rien ne fixe votre identité
              </span>
            )}
          </p>
        </div>
      );

    /* ------------------------------------------ le calendrier */
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

    /* ------------------------------------------ les fondations */
    case "plan-fondations":
      return (
        <EcranListe
          kicker="semaines 1-2 · chez vous"
          titre="Dire aux machines qui vous êtes."
          note="une semaine de développeur, pas une refonte"
          items={ecran.actions}
        />
      );

    /* ------------------------------------------- les contenus */
    case "plan-contenus":
      return (
        <EcranListe
          kicker="semaines 2-6 · vos questions perdues"
          titre="Les pages qui manquent, nommées."
          note="chaque page répond à une question réellement posée aux IA"
          items={ecran.contenus}
        />
      );

    /* ------------------------------------------ les citations */
    case "plan-citations":
      return (
        <EcranListe
          kicker="semaines 5-12 · là où les IA lisent"
          titre="Être inscrit à leurs adresses."
          note="cibles relevées dans les sources de votre propre mesure"
          items={ecran.cibles}
        />
      );

    /* ------------------------------------------- la remesure */
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

    /* ---------------------------------------------- l'offre */
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

/**
 * Le marquage des concurrents dans un verbatim, version scène sombre : le nom
 * du concurrent se souligne EN PAPIER (sur l'encre, la présence est claire ;
 * le minium reste réservé au manque). Le marqueur `*...*` vient de
 * l'assemblage.
 */
function MarquagePapier({ texte }: { texte: string }) {
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
