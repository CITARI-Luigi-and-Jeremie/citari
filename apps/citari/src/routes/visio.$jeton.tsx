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

    /* --------------------------- les actes suivants, écran par écran */
    default:
      return (
        <div className="flex h-full items-center">
          <p className="num text-[13px] uppercase tracking-[0.2em] text-ink-3">
            {frTitre(`écran « ${ecran.type} » · en construction`)}
          </p>
        </div>
      );
  }
}

/** Réservé aux actes suivants : le marquage des concurrents dans un verbatim. */
export { TexteMarque as MarquageVisio };
