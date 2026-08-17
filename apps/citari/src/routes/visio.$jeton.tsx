import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { chargerVisio } from "@/lib/scan.functions";
import { construireDocument, type LigneSourceReponse } from "@/lib/rapport-complet";
import { TitreChiffre } from "@/components/rapport-complet";
import { GrilleFond } from "@/components/jeremie/rapport/GrilleFond";
import { acteDe, construireVisio, type EcranVisio } from "@/lib/visio";
import type { LigneMention, LigneQuestion } from "@/lib/rapport-apercu";
import { dateFr, fr, NBSP } from "@/lib/typo";
import { cn } from "@/lib/utils";

/**
 * LA VISIO — le support de présentation du scan complet, plein écran.
 *
 * LE GABARIT EN TROIS BANDES (17/08/2026). Chaque écran est une grille
 * `auto / 1fr / auto` : le MESSAGE en haut (toujours au même y), LA DONNÉE au
 * milieu (seule bande élastique : c'est là que le vide se ramasse), LE SENS
 * en bas (toujours au même y, précédé d'un filet court). Pendant vingt
 * minutes de partage d'écran, l'oeil apprend cette géographie en deux écrans
 * et cesse de la rescanner.
 *
 * Les trois blocs ne se distinguent ni par une carte, ni par une icône, ni
 * par une couleur nouvelle, mais par les trois familles du projet, chacune
 * dans son métier : Newsreader ÉNONCE (le message), IBM Plex Mono COMPTE (la
 * donnée), Archivo EXPLIQUE (le sens).
 *
 * Sur l'encre, le minium est rationné à UN objet par écran, et il ne dit
 * qu'une chose : le manque. Le contenu est assemblé dans `lib/visio.ts` ;
 * cette page ne fait qu'afficher.
 */

const CSS_SCENE = `
.visio-scene{
  background: var(--ink);
  color: var(--paper);
  /* Une unité unique : 1vw en 16:9, qui rétrécit sur un écran écrasé pour
     que le déroulé ne déborde jamais (il ne se scrolle pas). */
  --u: min(1vw, 1.78vh);
  --v-fil: color-mix(in srgb, var(--paper) 16%, transparent);
  --v-mut: color-mix(in srgb, var(--paper) 68%, var(--ink));
  --v-mut2: color-mix(in srgb, var(--paper) 52%, var(--ink));
  --v-minium: color-mix(in srgb, var(--signal) 55%, var(--paper));
}
.visio-scene .text-ink{color:var(--paper)}
.visio-scene .text-ink-2{color:var(--v-mut)}
.visio-scene .text-ink-3{color:var(--v-mut2)}
.visio-scene .text-signal{color:var(--v-minium)}
.visio-scene .bg-ink{background-color:var(--paper)}
.visio-scene .bg-signal{background-color:var(--v-minium)}
.visio-scene .border-rule{border-color:var(--v-fil)}
.visio-scene .border-ink{border-color:var(--paper)}
.visio-scene .conduite{border-bottom-color:color-mix(in srgb, var(--paper) 30%, transparent)}

/* Les trois bandes du gabarit. */
.v-ecran{display:grid;height:100%;grid-template-rows:auto 1fr auto;gap:2vh}
.v-kick{font-family:var(--font-mono,"IBM Plex Mono",monospace);
  font-size:max(11px, calc(var(--u) * 0.62));text-transform:uppercase;
  letter-spacing:0.2em;color:var(--v-mut2);max-width:72ch}
.v-msg{font-family:var(--font-serif,Newsreader,serif);
  font-size:calc(var(--u) * 2.55);line-height:1.12;max-width:26ch;
  margin-top:calc(var(--u) * 0.9)}
.v-msg-long{font-size:calc(var(--u) * 2);max-width:32ch}
.v-donnee{align-self:center;min-height:0;width:100%}
.v-sens{font-size:calc(var(--u) * 1.02);line-height:1.5;color:var(--v-mut);
  max-width:56ch;padding-top:calc(var(--u) * 0.8);
  border-top:1px solid var(--v-fil)}
/* Le filet du sens ne fait que la largeur de son bloc : un filet plein cadre
   se lirait comme un pied de page. */
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
      secteur: scan.sector ?? null,
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

      {/* Le fil de progression, en papier : le minium ne sert qu'au manque. */}
      <div aria-hidden className="absolute inset-x-0 top-0 z-20 h-px bg-[var(--v-fil)]">
        <div
          className="h-full bg-[var(--paper)] transition-[width] duration-300 ease-out"
          style={{ width: `${((index + 1) / ecrans.length) * 100}%` }}
        />
      </div>

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
      <main key={index} className="anim-panel relative z-10 min-h-0 flex-1 px-[7vw] py-[4vh]">
        <div className="v-ecran">
          <div>
            <p className="v-kick">{ecran.kicker}</p>
            <h2 className={cn("v-msg", ecran.message.length > 62 && "v-msg-long")}>
              <TitreChiffre texte={fr(ecran.message)} />
            </h2>
          </div>
          <div className="v-donnee">
            <Donnee ecran={ecran} />
          </div>
          <p className="v-sens">{fr(ecran.sens)}</p>
        </div>

        {/* Zones de clic discrètes, pour présenter au trackpad. */}
        <button
          type="button"
          aria-label="Écran précédent"
          onClick={() => aller(index - 1)}
          className="absolute inset-y-0 left-0 w-[6%] cursor-w-resize opacity-0"
        />
        <button
          type="button"
          aria-label="Écran suivant"
          onClick={() => aller(index + 1)}
          className="absolute inset-y-0 right-0 w-[6%] cursor-e-resize opacity-0"
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
/*  LA DONNÉE de chaque écran : la bande du milieu, la seule qui varie.  */
/* ==================================================================== */

/** Une ligne de bordereau : libellé à gauche, valeur à droite, points entre. */
function Ligne({
  libelle,
  valeur,
  note,
  manque,
  serif = true,
}: {
  libelle: string;
  valeur: React.ReactNode;
  note?: string;
  manque?: boolean;
  serif?: boolean;
}) {
  return (
    <div className="border-b border-rule py-[1.35vh]">
      <div className="flex items-baseline gap-4">
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            serif ? "serif-roman" : "num",
            manque ? "text-signal" : "text-ink",
          )}
          style={{ fontSize: "calc(var(--u) * 1.45)" }}
        >
          {libelle}
        </span>
        <span className="conduite" aria-hidden />
        <span
          className={cn("num shrink-0 tabular-nums", manque && "text-signal")}
          style={{ fontSize: "calc(var(--u) * 1.45)" }}
        >
          {valeur}
        </span>
      </div>
      {note ? <p className="num mt-1 text-[11px] text-ink-3">{note}</p> : null}
    </div>
  );
}

/** Un très grand chiffre avec sa légende. */
function Chiffre({
  valeur,
  legende,
  manque,
  taille = 7.5,
}: {
  valeur: number;
  legende: string;
  manque?: boolean;
  taille?: number;
}) {
  return (
    <div>
      <div
        className={cn("num leading-[0.85] tracking-[-0.05em]", manque && "text-signal")}
        style={{ fontSize: `calc(var(--u) * ${taille})` }}
      >
        <Compteur valeur={valeur} />
      </div>
      <p
        className={cn("num mt-3 border-t border-rule pt-2", manque && "text-signal")}
        style={{ fontSize: "calc(var(--u) * 0.72)", maxWidth: "22ch" }}
      >
        {legende}
      </p>
    </div>
  );
}

function Donnee({ ecran }: { ecran: EcranVisio }) {
  switch (ecran.type) {
    /* ------------------------------------------------ 01 · le score */
    case "score":
      return (
        <div className="flex items-center gap-[6vw]">
          <div className="min-w-0 flex-1">
            <div className="max-w-[52vw]">
              <Ligne
                libelle={`vos réponses, sur ${ecran.lues}`}
                valeur={ecran.vosReponses}
                manque
                serif={false}
              />
              {ecran.rivaux.map((r) => (
                <Ligne key={r.nom} libelle={r.nom} valeur={r.reponses} serif={false} />
              ))}
              {ecran.unionRivaux > 0 ? (
                <Ligne
                  libelle={`ces ${ecran.rivaux.length} marques réunies`}
                  valeur={`${ecran.unionRivaux} / ${ecran.lues}`}
                  note="réponses distinctes où au moins l'une d'elles apparaît · jamais une somme"
                  serif={false}
                />
              ) : null}
            </div>
            {ecran.apercu ? (
              <p className="num mt-[2.5vh] text-[11px] text-ink-3">
                de mémoire (aperçu du {dateFr(ecran.apercu.date)}, 2 moteurs) : {ecran.apercu.score}
                {NBSP}· en lisant le web : {ecran.score}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <div
              className="num leading-[0.8] tracking-[-0.06em]"
              style={{ fontSize: "calc(var(--u) * 16)" }}
            >
              <Compteur valeur={ecran.score} />
            </div>
            <div className="num mt-2 text-[12px] text-ink-3">sur 100</div>
          </div>
        </div>
      );

    /* ---------------------------------------------- 02 · le sommaire */
    case "sommaire":
      return (
        <div className="max-w-[62vw]">
          {ecran.points.map((p, i) => (
            <div key={p} className="flex items-baseline gap-6 border-b border-rule py-[2vh]">
              <span className="num shrink-0 text-[13px] text-ink-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="serif-roman" style={{ fontSize: "calc(var(--u) * 1.7)" }}>
                {fr(p)}
              </p>
            </div>
          ))}
        </div>
      );

    /* ------------------------------------------- 03 · les demandes */
    case "demandes":
      return (
        <div className="max-w-[64vw]">
          {ecran.lignes.map((l) => (
            <div key={l.titre} className="border-b border-rule py-[1.5vh]">
              <div className="flex items-baseline justify-between gap-6">
                <span className="serif-roman" style={{ fontSize: "calc(var(--u) * 1.6)" }}>
                  {fr(l.titre)}
                </span>
                <span className="num shrink-0 tabular-nums" style={{ fontSize: "calc(var(--u) * 1.6)" }}>
                  <span className={cn(l.citees === 0 && "text-signal")}>{l.citees}</span>
                  <span className="text-ink-3"> / {l.posees}</span>
                </span>
              </div>
              {l.exemple ? (
                <p className="serif-ital mt-1 text-ink-3" style={{ fontSize: "calc(var(--u) * 0.95)" }}>
                  «{NBSP}{l.exemple}{NBSP}»
                </p>
              ) : null}
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            réponses où votre marque apparaît / questions mesurées
          </p>
        </div>
      );

    /* ----------------------------------------- 04 · le vocabulaire */
    case "vocabulaire":
      return (
        <div className="max-w-[62vw]">
          {ecran.termes.map((t) => (
            <div key={t.terme} className="flex items-center gap-[2vw] border-b border-rule py-[1.3vh]">
              <span
                className="w-[20vw] shrink-0 truncate serif-roman"
                style={{ fontSize: "calc(var(--u) * 1.5)" }}
              >
                «{NBSP}{t.terme}{NBSP}»
              </span>
              <span className="h-[2.2vh] flex-1">
                <span
                  className="block h-full bg-ink"
                  style={{ width: `${Math.max(2, (t.reponses / ecran.lues) * 100)}%` }}
                />
              </span>
              <span className="num w-[22ch] shrink-0 text-right text-[12px] text-ink-3">
                {t.reponses} réponses · {t.questions} question{t.questions > 1 ? "s" : ""}
                {t.camp === "vous" ? (
                  <span className="text-ink"> · votre catégorie</span>
                ) : t.camp === "eux" ? (
                  <span> · l'alternative</span>
                ) : null}
              </span>
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            termes relevés dans vos réponses, comptés à l'unité réponse
          </p>
        </div>
      );

    /* -------------------------------------------- 05 · le risque */
    case "risque":
      return (
        <div className="flex items-start gap-[5vw]">
          <Chiffre
            valeur={ecran.posees}
            legende={`questions de risque et de vérification, sur ${ecran.total}`}
          />
          <div className="min-w-0 flex-1 max-w-[46vw]">
            {ecran.sujets.map((s) => (
              <p
                key={s}
                className="serif-roman border-b border-rule py-[1.1vh]"
                style={{ fontSize: "calc(var(--u) * 1.15)" }}
              >
                «{NBSP}{s}{NBSP}»
              </p>
            ))}
            <p className="num mt-2 text-[11px] text-ink-3">
              votre marque apparaît dans {ecran.citees} de ces réponses
            </p>
          </div>
        </div>
      );

    /* -------------------------------------------- 06 · le podium */
    case "podium": {
      const maxi = Math.max(...ecran.lignes.map((l) => l.reponses), 1);
      return (
        <div className="max-w-[70vw]">
          {ecran.lignes.map((l) => (
            <div key={l.nom} className="flex items-center gap-[2vw] border-b border-rule py-[1.3vh]">
              <span
                className={cn("w-[16vw] shrink-0 truncate", l.cible ? "font-semibold text-signal" : "")}
                style={{ fontSize: "calc(var(--u) * 1.4)" }}
              >
                {l.nom}
              </span>
              <span className="h-[2.4vh] flex-1">
                <span
                  className={cn("block h-full", l.cible ? "bg-signal" : "bg-ink")}
                  style={{ width: `${Math.max(1, (l.reponses / maxi) * 100)}%` }}
                />
              </span>
              <span
                className={cn("num w-[5ch] shrink-0 text-right tabular-nums", l.cible && "text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.4)" }}
              >
                {l.reponses}
              </span>
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            réponses distinctes où la marque apparaît, sur {ecran.lues} · variantes regroupées
            {ecran.positionMoyenne !== null
              ? ` · votre position moyenne quand vous apparaissez : ${ecran.positionMoyenne.toFixed(1)}ᵉ`
              : ""}
          </p>
        </div>
      );
    }

    /* --------------------------------------- 07 · lu, et pas cité */
    case "lu-pas-cite":
      return (
        <div className="flex items-start gap-[5vw]">
          <div className="shrink-0">
            <Chiffre
              valeur={ecran.reponsesQuiLisent}
              legende={`réponses ont lu ${ecran.hote} pour se construire`}
            />
            <div className="mt-[3vh]">
              <Chiffre
                valeur={ecran.sansCitation.length}
                legende="ne vous nomment nulle part"
                manque
                taille={5}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            {ecran.sansCitation.map((s, i) => (
              <div key={`${s.moteur}-${i}`} className="border-b border-rule py-[1.2vh]">
                <p className="serif-roman" style={{ fontSize: "calc(var(--u) * 1.2)" }}>
                  «{NBSP}{s.question}{NBSP}»
                </p>
                <p className="num mt-1 text-[11px] text-ink-3">
                  {s.moteur} · votre page lue en {s.rang}
                  {s.rang === 1 ? "ʳᵉ" : "ᵉ"} position des sources
                  {s.premiere ? <span className="text-signal"> · première source lue</span> : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    /* --------------------------------------------- 08 · les portes */
    case "portes":
      return (
        <div className="max-w-[60vw]">
          {ecran.lignes.map((l) => (
            <div key={l.hote} className="flex items-baseline gap-4 border-b border-rule py-[1.2vh]">
              <span
                className={cn("num", l.genre === "vous" && "text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.4)" }}
              >
                {l.hote}
              </span>
              <span className="num shrink-0 text-[10px] uppercase tracking-[0.14em] text-ink-3">
                {l.genre === "vous"
                  ? "votre site"
                  : l.genre === "concurrent"
                    ? "site concurrent"
                    : "adresse tierce"}
              </span>
              <span className="conduite" aria-hidden />
              <span
                className={cn("num shrink-0 tabular-nums", l.genre === "vous" && "text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.25)" }}
              >
                {l.lectures}
              </span>
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            {ecran.totalLectures} lectures sur {ecran.totalDomaines} domaines · chez vous :{" "}
            {ecran.lecturesVotreSite}
            {ecran.exAequo ? ` · ${ecran.exAequo}` : ""}
          </p>
        </div>
      );

    /* -------------------------------------------- 09 · les moteurs */
    case "moteurs":
      return (
        <div className="max-w-[62vw]">
          {ecran.lignes.map((l) => (
            <Ligne
              key={l.moteur}
              libelle={l.moteur}
              serif={false}
              manque={l.citations === 0}
              valeur={
                <>
                  {l.citations}
                  <span className="text-[11px] text-ink-3">
                    {" "}
                    question{l.citations > 1 ? "s" : ""} · {l.sources} réponse
                    {l.sources > 1 ? "s" : ""} avec sources
                  </span>
                </>
              }
            />
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            questions où ce moteur vous cite au moins une fois
          </p>
        </div>
      );

    /* ----------------------------------------- 10 · les inventions */
    case "inventions":
      return (
        <div className="max-w-[68vw]">
          {ecran.lignes.map((l) => (
            <div key={l.moteur} className="flex items-baseline gap-[2vw] border-b border-rule py-[1vh]">
              <span className="num w-[9vw] shrink-0 text-[12px] text-ink-3">{l.moteur}</span>
              <p
                className={cn("serif-ital min-w-0 flex-1", l.nature !== "confiance" && "text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.1)" }}
              >
                «{NBSP}{l.phrase}{NBSP}»
              </p>
              <span className="num w-[10ch] shrink-0 text-right text-[10px] uppercase tracking-[0.14em] text-ink-3">
                {l.nature}
              </span>
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            phrases recopiées mot pour mot, hors méthodologie du score
            {ecran.secteurDeclare ? ` · secteur déclaré au scan : ${ecran.secteurDeclare}` : ""}
          </p>
        </div>
      );

    /* -------------------------------------------- 11 · les percées */
    case "percees":
      return (
        <div className="max-w-[68vw]">
          {ecran.lignes.map((l, i) => (
            <div key={`${l.moteur}-${i}`} className="border-b border-rule py-[1.4vh]">
              <div className="flex items-baseline gap-4">
                <span className="num shrink-0 text-[12px] text-ink-3">
                  {l.moteur} · {l.position}
                  {l.position === 1 ? "ʳᵉ" : "ᵉ"} position
                </span>
                <span className="serif-roman min-w-0 flex-1 truncate" style={{ fontSize: "calc(var(--u) * 1.1)" }}>
                  «{NBSP}{l.question}{NBSP}»
                </span>
              </div>
              <p className="serif-ital mt-1" style={{ fontSize: "calc(var(--u) * 1.2)" }}>
                «{NBSP}{l.verbatim}{NBSP}»
              </p>
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            moteurs qui vous citent : {ecran.moteursQuiCitent.join(" · ")} · {ecran.questionsPortantes}{" "}
            question{ecran.questionsPortantes > 1 ? "s" : ""} sur {ecran.total}
          </p>
        </div>
      );

    /* ----------------------------------------- 12 · les territoires */
    case "territoires":
      return (
        <div className="max-w-[66vw]">
          {ecran.lignes.map((l, i) => (
            <div key={l.titre} className="flex items-baseline gap-5 border-b border-rule py-[1.8vh]">
              <span className="num shrink-0 text-[13px] text-ink-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="serif-roman" style={{ fontSize: "calc(var(--u) * 1.6)" }}>
                  {fr(l.titre)}
                </p>
                <p className="mt-1 text-ink-2" style={{ fontSize: "calc(var(--u) * 1) " }}>
                  {fr(l.detail)}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    /* ------------------------------------------ 13 · les 5 portes */
    case "portes5":
      return (
        <div className="max-w-[56vw]">
          {ecran.cibles.map((c) => (
            <Ligne
              key={c.hote}
              libelle={c.hote}
              serif={false}
              valeur={
                <>
                  {c.lectures} <span className="text-[11px] text-ink-3">lectures</span>
                </>
              }
            />
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            sur les {ecran.totalLectures} lectures faites pendant votre mesure
          </p>
        </div>
      );

    /* -------------------------------------------- 14 · les contenus */
    case "contenus":
      return (
        <div className="max-w-[66vw]">
          {ecran.pages.map((p, i) => (
            <div key={p.titre} className="border-b border-rule py-[1.3vh]">
              <p style={{ fontSize: "calc(var(--u) * 1.25)" }}>
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
      );

    /* --------------------------------------------- 15 · les gestes */
    case "gratuit":
      return (
        <div className="max-w-[64vw]">
          {ecran.gestes.map((g, i) => (
            <div key={g.titre} className="border-b border-rule py-[1.7vh]">
              <p className="font-semibold" style={{ fontSize: "calc(var(--u) * 1.45)" }}>
                <span className="num mr-3 text-[12px] font-normal text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {fr(g.titre)}
              </p>
              <p className="num mt-1 pl-[2.4vw] text-[11px] text-ink-3">{fr(g.detail)}</p>
            </div>
          ))}
        </div>
      );

    /* -------------------------------------------- 16 · la bascule */
    case "bascule":
      return (
        <div className="flex items-end gap-[6vw]">
          <Chiffre
            valeur={ecran.reponsesRival}
            legende={`réponses tenues par ${ecran.rival}, sur ${ecran.lues}`}
          />
          <div className="pb-2">
            <p className="serif-ital text-ink-2" style={{ fontSize: "calc(var(--u) * 1.3)", maxWidth: "34ch" }}>
              {fr(
                "Une position installée ne se reprend pas avec trois gestes : elle se reprend avec un chantier suivi et mesuré.",
              )}
            </p>
          </div>
        </div>
      );

    /* ---------------------------------------------- 17 · le sprint */
    case "sprint":
      return (
        <div className="max-w-[76vw]">
          {ecran.chantiers.map((c) => (
            <div key={c.titre} className="border-b border-rule py-[1.5vh]">
              <div className="flex items-baseline gap-[2vw]">
                <span className="serif-roman w-[19vw] shrink-0" style={{ fontSize: "calc(var(--u) * 1.15)" }}>
                  {fr(c.titre)}
                </span>
                <span className="num w-[13vw] shrink-0 text-[11px] text-ink-3">
                  seul{NBSP}: {c.seul}
                </span>
                <ul className="min-w-0 flex-1">
                  {c.avecNous.map((a) => (
                    <li key={a} className="flex gap-2" style={{ fontSize: "calc(var(--u) * 0.95)" }}>
                      <span className="text-ink-3">·</span>
                      <span>{fr(a)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <div className="mt-[1.5vh] flex flex-wrap gap-x-[3vw] gap-y-1">
            {ecran.preuve.map((p) => (
              <span key={p} className="num text-[11px] text-ink-3">
                · {fr(p)}
              </span>
            ))}
          </div>
        </div>
      );

    /* ------------------------------------------- 18 · la décision */
    default:
      return (
        <div>
          <div className="num tracking-[-0.03em]" style={{ fontSize: "calc(var(--u) * 5)" }}>
            2{NBSP}900{NBSP}€ <span className="text-[1.1vw] text-ink-3">HT · une fois</span>
          </div>
          <div className="mt-[3vh] flex max-w-[60vw] flex-wrap items-baseline gap-x-[3vw] gap-y-2 border-t border-rule pt-[2vh]">
            {[
              "5 contenus livrés",
              "8 cibles de citation",
              "audit et correctifs",
              "preuve chaque vendredi",
              `remesure du ${ecran.dateRemesure} incluse`,
            ].map((x) => (
              <span key={x} className="num" style={{ fontSize: "calc(var(--u) * 1.15)" }}>
                {x}
              </span>
            ))}
          </div>
          <p className="num mt-[3vh] text-[12px] text-ink-2">
            la ligne qui sera comparée{NBSP}: votre nom dans {ecran.vosReponses} réponses sur{" "}
            {ecran.lues}
            {NBSP}<span className="text-ink-3">→</span>{NBSP}
            <span className="text-signal">?</span>
            {ecran.places !== null ? (
              <span>
                {NBSP}· places restantes ce mois-ci{NBSP}: {ecran.places}
              </span>
            ) : null}
          </p>
        </div>
      );
  }
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
