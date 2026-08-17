import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { chargerVisio } from "@/lib/scan.functions";
import { construireDocument, type LigneSourceReponse } from "@/lib/rapport-complet";
import { TitreChiffre } from "@/components/rapport-complet";
import { GrilleFond } from "@/components/jeremie/rapport/GrilleFond";
import { acteDe, construireVisio, type EcranVisio, type Possession } from "@/lib/visio";
import type { LigneMention, LigneQuestion } from "@/lib/rapport-apercu";
import { dateFr, fr, NBSP } from "@/lib/typo";
import { cn } from "@/lib/utils";

/**
 * LA VISIO — le dossier posé sur la table, plein écran.
 *
 * La scène est l'ENCRE (grille sombre, chrome constant, six actes). Les
 * PIÈCES sont en PAPIER : des panneaux clairs qui reproduisent mot pour mot
 * ce qu'une machine a écrit, chacun avec sa chaîne de possession (numéro,
 * moteur, version figée, question, date) et ses coupes annoncées en mots.
 * L'encre porte ce que NOUS avons compté. Le papier est un événement : quand
 * il apparaît, une machine a écrit ça.
 *
 * Le SENS de chaque écran n'est JAMAIS affiché : c'est le texte oral du
 * consultant (`ecran.sens`, consigné dans lib/visio.ts). L'écran montre la
 * pièce ; le consultant parle.
 */

const CSS_SCENE = `
.visio-scene{
  background: var(--ink);
  color: var(--paper);
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
.visio-scene .border-rule{border-color:var(--v-fil)}
.visio-scene .conduite{border-bottom-color:color-mix(in srgb, var(--paper) 30%, transparent)}

/* La légende : kicker mono + message serif, sur l'encre. */
.v-kick{font-family:var(--font-mono,"IBM Plex Mono",monospace);
  font-size:max(11px, calc(var(--u) * 0.6));text-transform:uppercase;
  letter-spacing:0.2em;color:var(--v-mut2);max-width:80ch}
.v-msg{font-family:var(--font-serif,Newsreader,serif);
  font-size:calc(var(--u) * 2.05);line-height:1.14;max-width:48ch;
  margin-top:calc(var(--u) * 0.75)}

/* La ligne de provenance de l'exhibit : la signature d'un vrai livrable. */
.v-source{font-family:var(--font-mono,"IBM Plex Mono",monospace);
  font-size:max(10px, calc(var(--u) * 0.54));letter-spacing:0.08em;
  color:var(--v-mut2);margin-top:calc(var(--u) * 1.1);
  padding-top:calc(var(--u) * 0.5);border-top:1px solid var(--v-fil)}

/* Ce qui est cliquable pendant la visio se voit, sans devenir un bouton. */
.v-cliquable{cursor:pointer;transition:opacity 140ms ease}
.v-cliquable:hover{opacity:1}
.v-eteint{opacity:0.38;transition:opacity 200ms ease}

/* LE PAPIER : la pièce à conviction. Texte encre réelle, jamais les
   utilitaires retournés de la scène. */
.v-papier{background:var(--paper);color:var(--ink);
  border:1px solid color-mix(in srgb, var(--ink) 18%, var(--paper));
  padding:calc(var(--u) * 1.4) calc(var(--u) * 1.6)}
.v-possession{font-family:var(--font-mono,"IBM Plex Mono",monospace);
  font-size:max(10px, calc(var(--u) * 0.55));text-transform:uppercase;
  letter-spacing:0.14em;color:#726d64;
  border-bottom:1px solid color-mix(in srgb, var(--ink) 15%, transparent);
  padding-bottom:calc(var(--u) * 0.5);margin-bottom:calc(var(--u) * 0.9)}
.v-corps{font-size:calc(var(--u) * 0.98);line-height:1.55;color:var(--ink)}
.v-corps p + p{margin-top:calc(var(--u) * 0.7)}
.v-coupe{font-family:var(--font-mono,"IBM Plex Mono",monospace);
  font-size:max(10px, calc(var(--u) * 0.55));color:#726d64;
  border-top:1px solid color-mix(in srgb, var(--ink) 15%, transparent);
  padding-top:calc(var(--u) * 0.5);margin-top:calc(var(--u) * 0.9)}
/* La pastille : un nom de concurrent surligné à l'encre, dans le texte. */
.v-pastille{background:var(--ink);color:var(--paper);
  padding:0 0.35em;white-space:nowrap}
/* Le minium sur papier : le manque, pleine puissance. */
.v-papier .v-manque{color:var(--signal)}
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
      <main key={index} className="anim-panel relative z-10 min-h-0 flex-1 px-[7vw] py-[4.5vh]">
        <div className="grid h-full grid-rows-[auto_1fr] gap-[3.5vh]">
          <div>
            <p className="v-kick">{ecran.kicker}</p>
            <h2 className="v-msg">
              <TitreChiffre texte={fr(ecran.message)} />
            </h2>
          </div>
          <div className="min-h-0 self-center">
            <Piece ecran={ecran} />
          </div>
        </div>

        {/* Zones de clic discrètes, pour présenter au trackpad. */}
        <button
          type="button"
          aria-label="Écran précédent"
          onClick={() => aller(index - 1)}
          className="absolute inset-y-0 left-0 w-[5%] cursor-w-resize opacity-0"
        />
        <button
          type="button"
          aria-label="Écran suivant"
          onClick={() => aller(index + 1)}
          className="absolute inset-y-0 right-0 w-[5%] cursor-e-resize opacity-0"
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
/*  Les composants du dossier.                                          */
/* ==================================================================== */

/** L'en-tête de possession d'une pièce papier. */
function EntetePiece({ p }: { p: Possession }) {
  return (
    <div className="v-possession">
      {p.numero > 0 ? `pièce ${String(p.numero).padStart(2, "0")}` : ""}
      {p.libelle ? `${p.numero > 0 ? " · " : ""}${p.libelle}` : ""}
      {p.moteur ? ` · ${p.moteur}${p.modele ? ` ${p.modele}` : ""}` : ""}
      {p.rangQ ? ` · question ${String(p.rangQ).padStart(2, "0")}/${p.totalQ}` : ""}
      {` · ${p.date}`}
    </div>
  );
}

/** Un panneau papier : la pièce à conviction. */
function Panneau({
  possession,
  pied,
  className,
  children,
}: {
  possession?: Possession;
  pied?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("v-papier", className)}>
      {possession ? <EntetePiece p={possession} /> : null}
      {children}
      {pied ? <div className="v-coupe">{pied}</div> : null}
    </div>
  );
}

/** Le corps d'une réponse, paragraphes conservés, concurrents en pastilles. */
function CorpsMarque({ texte, variantes }: { texte: string; variantes: string[] }) {
  const tries = [...variantes].filter((v) => v.length >= 3).sort((a, b) => b.length - a.length);
  const motif = tries.length
    ? new RegExp(`(${tries.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")
    : null;
  return (
    <div className="v-corps">
      {texte.split(/\n+/).map((par, i) => (
        <p key={i}>
          {motif
            ? par.split(motif).map((bout, j) =>
                j % 2 === 1 ? (
                  <span key={j} className="v-pastille">
                    {bout}
                  </span>
                ) : (
                  <span key={j}>{bout}</span>
                ),
              )
            : par}
        </p>
      ))}
    </div>
  );
}

/** La coupe annoncée, en mots comptés. */
function Coupe({ total, extrait }: { total: number; extrait: number }) {
  if (extrait >= total) return <>réponse intégrale · {total} mots</>;
  return (
    <>
      réponse intégrale {total} mots · extrait {extrait} mots
    </>
  );
}

/** Le décompte en traits-unités : un trait = une réponse (ou une lecture). */
function Traits({ n, manque }: { n: number; manque?: boolean }) {
  const groupes: number[] = [];
  let reste = n;
  while (reste > 0) {
    groupes.push(Math.min(10, reste));
    reste -= 10;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-[0.55vw]" aria-label={`${n}`}>
      {groupes.map((g, i) => (
        <span key={i} className="inline-flex gap-[2.5px]">
          {Array.from({ length: g }, (_, j) => (
            <span
              key={j}
              className="inline-block h-[1.6vh] w-[3px]"
              style={{ background: manque ? "var(--v-minium)" : "var(--paper)" }}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

/* ==================================================================== */
/*  La pièce de chaque écran.                                           */
/* ==================================================================== */

function Piece({ ecran }: { ecran: EcranVisio }) {
  switch (ecran.type) {
    /* --------------------------------------------- 01 · le verdict */
    case "verdict":
      return (
        <div className="flex items-center gap-[6vw]">
          <div className="shrink-0">
            <div
              className="num leading-[0.8] tracking-[-0.06em]"
              style={{ fontSize: "calc(var(--u) * 15)" }}
            >
              <Compteur valeur={ecran.score} />
            </div>
            <div className="num mt-2 text-[12px] text-ink-3">sur 100</div>
          </div>
          <div className="min-w-0 max-w-[46vw] flex-1">
            <Ligne libelle={`vos réponses, sur ${ecran.lues}`} valeur={ecran.vosReponses} manque />
            {ecran.rivaux.map((r) => (
              <Ligne key={r.nom} libelle={r.nom} valeur={r.reponses} />
            ))}
            {ecran.unionRivaux > 0 ? (
              <Ligne
                libelle={`eux ${ecran.rivaux.length} réunis`}
                valeur={`${ecran.unionRivaux} / ${ecran.lues}`}
                note="réponses distinctes où au moins l'un d'eux apparaît · jamais une somme"
              />
            ) : null}
            {ecran.apercu ? (
              <p className="num mt-3 text-[11px] text-ink-3">
                de mémoire (aperçu du {dateFr(ecran.apercu.date)}, 2 moteurs) : {ecran.apercu.score}
                {NBSP}· en lisant le web : {ecran.score}
              </p>
            ) : null}
          </div>
        </div>
      );

    /* ------------------------------------------- 02 · la pièce A */
    case "piece-reponse":
      return (
        <div className="mx-auto max-w-[62vw]">
          <p className="serif-roman mb-[1.2vh] text-ink-2" style={{ fontSize: "calc(var(--u) * 1.15)" }}>
            «{NBSP}{ecran.question}{NBSP}»
          </p>
          <Panneau
            possession={ecran.possession}
            pied={
              <span>
                <Coupe total={ecran.motsTotal} extrait={ecran.motsExtrait} />
                {!ecran.clientCite ? (
                  <span className="v-manque">
                    {NBSP}·{NBSP}{ecran.marque} : 0 occurrence dans cette réponse
                  </span>
                ) : null}
              </span>
            }
          >
            <div style={{ columnCount: ecran.texte.length > 700 ? 2 : 1, columnGap: "calc(var(--u) * 2)" }}>
              <CorpsMarque texte={ecran.texte} variantes={ecran.variantes} />
            </div>
          </Panneau>
        </div>
      );

    /* ------------------------------------------------ 03 · le mur */
    case "mur":
      return <Mur ecran={ecran} />;

    /* ------------------------------------------ 04 · l'inventaire */
    case "inventaire":
      return (
        <div className="mx-auto max-w-[56vw]">
          {ecran.tranches.map((t) => (
            <div
              key={t.etiquette}
              className="v-papier mb-[1vh] flex items-baseline justify-between gap-6"
              style={{ padding: "calc(var(--u) * 0.9) calc(var(--u) * 1.4)" }}
            >
              <span className="num tabular-nums" style={{ fontSize: "calc(var(--u) * 2.2)", color: "var(--ink)" }}>
                <Compteur valeur={t.compte} />
              </span>
              <span style={{ fontSize: "calc(var(--u) * 0.95)", color: "#5c5a52" }}>{t.etiquette}</span>
            </div>
          ))}
        </div>
      );

    /* -------------------------------------------- 05 · les moments */
    case "moments":
      return (
        <div className="mx-auto max-w-[64vw]">
          {ecran.lignes.map((l) => (
            <div key={l.titre} className="border-b border-rule py-[1.6vh]">
              <div className="flex items-baseline justify-between gap-6">
                <span className="serif-roman" style={{ fontSize: "calc(var(--u) * 1.7)" }}>
                  {fr(l.titre)}
                </span>
                <span className="num shrink-0 tabular-nums" style={{ fontSize: "calc(var(--u) * 1.7)" }}>
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

    /* --------------------------------------- 06 · le vocabulaire */
    case "vocabulaire":
      return (
        <div className="flex items-center gap-[4vw]">
          <div className="min-w-0 flex-1">
            {ecran.termes.map((t) => (
              <div key={t.terme} className="border-b border-rule py-[1.4vh]">
                <div className="serif-roman" style={{ fontSize: "calc(var(--u) * 2.6)" }}>
                  {t.terme}
                </div>
                <div className="num mt-1 text-[12px] text-ink-3">
                  dans {t.reponses} réponses sur {ecran.lues} · {t.questions} question
                  {t.questions > 1 ? "s" : ""} posée{t.questions > 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
          {ecran.extraits.length ? (
            <div className="w-[30vw] shrink-0">
              {ecran.extraits.map((e) => (
                <Panneau key={e.terme} className="mb-[1.2vh]" pied={<span>{e.moteur} · phrase réelle de la mesure</span>}>
                  <p className="serif-ital" style={{ fontSize: "calc(var(--u) * 0.95)", color: "var(--ink)" }}>
                    «{NBSP}{e.phrase}{NBSP}»
                  </p>
                </Panneau>
              ))}
            </div>
          ) : null}
        </div>
      );

    /* ------------------------------------------------ 07 · le risque */
    case "risque":
      return (
        <div className="mx-auto max-w-[64vw]">
          <Panneau possession={ecran.possession}>
            {ecran.questions.map((q) => (
              <div
                key={q.rang}
                className="flex items-baseline gap-4 border-b py-[0.9vh] last:border-b-0"
                style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
              >
                <span className="num shrink-0 text-[10px]" style={{ color: "#726d64" }}>
                  Q{String(q.rang).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1" style={{ fontSize: "calc(var(--u) * 0.92)" }}>
                  {q.texte}
                </span>
                <span className="num shrink-0 text-[10px]" style={{ color: "#726d64" }}>
                  {q.marques.length ? q.marques.join(" · ") : "personne"}
                </span>
                {q.vousAbsent ? (
                  <span className="num v-manque shrink-0 text-[10px] uppercase tracking-[0.12em]">
                    vous : absent
                  </span>
                ) : null}
              </div>
            ))}
          </Panneau>
        </div>
      );

    /* ------------------------------------------------ 08 · le tally */
    case "tally":
      return (
        <div className="mx-auto max-w-[70vw]">
          {ecran.lignes.map((l) => (
            <div key={l.nom} className="flex items-center gap-[2vw] border-b border-rule py-[1.6vh]">
              <span
                className={cn("w-[14vw] shrink-0 truncate", l.cible && "font-semibold text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.4)" }}
              >
                {l.nom}
              </span>
              <span className="min-w-0 flex-1">
                <Traits n={l.reponses} manque={l.cible} />
              </span>
              <span
                className={cn("num w-[6ch] shrink-0 text-right tabular-nums", l.cible && "text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.4)" }}
              >
                {l.reponses}
              </span>
            </div>
          ))}
          <p className="num mt-3 text-[11px] text-ink-3">
            eux trois réunis : {ecran.union} réponses sur {ecran.lues} · variantes d'écriture regroupées
          </p>
        </div>
      );

    /* -------------------------------------------- 09 · la pièce B */
    case "piece-lecture":
      return (
        <div className="mx-auto flex max-w-[80vw] items-stretch gap-[2vw]">
          <Panneau
            className="w-[38vw] shrink-0"
            possession={ecran.possessionGauche}
            pied={<span>{ecran.totalSources} sources lues au total</span>}
          >
            <p className="mb-2" style={{ fontSize: "calc(var(--u) * 0.85)", color: "#5c5a52" }}>
              «{NBSP}{ecran.question}{NBSP}»
            </p>
            {ecran.sources.map((s) => (
              <div
                key={s.rang}
                className="flex items-baseline gap-3 border-b py-[0.55vh] last:border-b-0"
                style={{ borderColor: "color-mix(in srgb, var(--ink) 10%, transparent)" }}
              >
                <span className="num w-[2ch] shrink-0 text-right text-[11px]" style={{ color: "#726d64" }}>
                  {s.rang}
                </span>
                <span className="num min-w-0 flex-1 truncate text-[12px]">
                  <span className={cn(s.votre && "font-bold")}>{s.hote}</span>
                  <span style={{ color: "#726d64" }}>{s.chemin}</span>
                </span>
                {s.votre ? <span className="v-pastille num shrink-0 text-[10px]">VOTRE PAGE</span> : null}
              </div>
            ))}
          </Panneau>
          <Panneau
            className="min-w-0 flex-1"
            possession={ecran.possessionDroite}
            pied={
              <span>
                <Coupe total={ecran.motsTotal} extrait={ecran.motsExtrait} />
                {!ecran.clientCite ? (
                  <span className="v-manque">
                    {NBSP}·{NBSP}{ecran.marque} : absent de la réponse
                  </span>
                ) : null}
              </span>
            }
          >
            <CorpsMarque texte={ecran.texte} variantes={ecran.variantes} />
          </Panneau>
        </div>
      );

    /* --------------------------------------- 10 · la bibliothèque */
    case "bibliotheque":
      return (
        <div className="mx-auto max-w-[66vw]">
          {ecran.lignes.map((l) => (
            <div key={l.hote} className="flex items-center gap-[1.5vw] border-b border-rule py-[1vh]">
              <span
                className={cn("num w-[13vw] shrink-0 truncate", l.genre === "vous" && "text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.05)" }}
              >
                {l.hote}
              </span>
              <span className="num w-[9ch] shrink-0 text-[9px] uppercase tracking-[0.12em] text-ink-3">
                {l.genre === "vous" ? "votre site" : l.genre === "concurrent" ? "concurrent" : "tierce"}
              </span>
              <span className="min-w-0 flex-1">
                <Traits n={l.lectures} manque={l.genre === "vous"} />
              </span>
              <span
                className={cn("num w-[4ch] shrink-0 text-right tabular-nums", l.genre === "vous" && "text-signal")}
                style={{ fontSize: "calc(var(--u) * 1.05)" }}
              >
                {l.lectures}
              </span>
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">
            {ecran.totalLectures} lectures sur {ecran.totalDomaines} domaines
            {ecran.exAequo ? ` · ${ecran.exAequo}` : ""}
          </p>
        </div>
      );

    /* -------------------------------------------- 11 · la pièce C */
    case "piece-miroir":
      return (
        <div className="mx-auto flex max-w-[80vw] items-stretch gap-[2vw]">
          {[ecran.bon, ecran.mauvais].map((cote, i) =>
            cote ? (
              <Panneau
                key={i}
                className="min-w-0 flex-1"
                possession={cote.possession}
                pied={<span>extrait · question miroir, hors méthodologie</span>}
              >
                <p
                  className="serif-ital mb-3"
                  style={{
                    fontSize: "calc(var(--u) * 1.25)",
                    color: i === 0 ? "var(--ink)" : "var(--signal)",
                    borderBottom: `2px solid ${i === 0 ? "var(--ink)" : "var(--signal)"}`,
                    paddingBottom: "0.4em",
                  }}
                >
                  «{NBSP}{cote.phrase}{NBSP}»
                </p>
                <div className="v-corps" style={{ fontSize: "calc(var(--u) * 0.85)" }}>
                  {cote.texte}
                </div>
              </Panneau>
            ) : null,
          )}
        </div>
      );

    /* --------------------------------------- 12 · l'invention */
    case "piece-invention":
      return (
        <div className="mx-auto max-w-[46vw]">
          <Panneau
            possession={ecran.possession}
            pied={<span>extrait · question miroir, hors méthodologie</span>}
          >
            <p
              className="serif-ital v-manque mb-3"
              style={{
                fontSize: "calc(var(--u) * 1.35)",
                borderBottom: "2px solid var(--signal)",
                paddingBottom: "0.4em",
              }}
            >
              «{NBSP}{ecran.phrase}{NBSP}»
            </p>
            <div className="v-corps" style={{ fontSize: "calc(var(--u) * 0.9)" }}>{ecran.texte}</div>
          </Panneau>
          {ecran.sansSource ? (
            <p className="num mt-3 text-[12px] text-ink-2">
              {ecran.possession.moteur} n'a consulté aucune source de tout le scan : ces chiffres
              sortent de sa mémoire, pas d'une page.
            </p>
          ) : null}
        </div>
      );

    /* ----------------------------------------- 13 · les percées */
    case "percees":
      return (
        <div className="mx-auto flex max-w-[80vw] items-stretch gap-[1.6vw]">
          {ecran.cartes.map((c, i) => (
            <Panneau
              key={i}
              className="min-w-0 flex-1"
              possession={c.possession}
              pied={<span>{c.coupe ? "extrait" : "verbatim intégral"}</span>}
            >
              <div className="flex items-start justify-between gap-3">
                <p style={{ fontSize: "calc(var(--u) * 0.8)", color: "#5c5a52" }}>
                  «{NBSP}{c.question}{NBSP}»
                </p>
                <span className="num shrink-0 tabular-nums" style={{ fontSize: "calc(var(--u) * 2.6)" }}>
                  {c.position}
                  <span className="text-[10px]" style={{ color: "#726d64" }}>
                    {c.position === 1 ? "ʳᵉ" : "ᵉ"}
                  </span>
                </span>
              </div>
              <p className="serif-ital mt-2" style={{ fontSize: "calc(var(--u) * 0.98)" }}>
                «{NBSP}<TexteSouligne texte={c.verbatim} cible={ecran.marque} />{NBSP}»
              </p>
            </Panneau>
          ))}
        </div>
      );

    /* -------------------------------------------- 14 · six juges */
    case "six-juges":
      return <SixJuges ecran={ecran} />;

    /* ----------------------------------- 15 · le bon de commande */
    case "bon-commande":
      return (
        <div className="mx-auto max-w-[60vw]">
          <Panneau possession={ecran.possession}>
            {ecran.pages.map((p, i) => (
              <div
                key={p.titre}
                className="border-b py-[1vh] last:border-b-0"
                style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
              >
                <p style={{ fontSize: "calc(var(--u) * 0.98)" }}>
                  <span className="num mr-3 text-[11px]" style={{ color: "#726d64" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  «{NBSP}{p.titre}{NBSP}»
                </p>
                {p.lus.length ? (
                  <p className="num mt-1 pl-[2.2vw] text-[10px]" style={{ color: "#726d64" }}>
                    lu à votre place{NBSP}: {p.lus.join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </Panneau>
        </div>
      );

    /* -------------------------------------- 16 · les portes du sprint */
    case "portes-sprint":
      return (
        <div className="mx-auto max-w-[60vw]">
          {ecran.lignes.map((l) => (
            <div key={l.hote} className="flex items-center gap-[1.5vw] border-b border-rule py-[1.1vh]">
              <span className="num w-[16vw] shrink-0 truncate" style={{ fontSize: "calc(var(--u) * 1.15)" }}>
                {l.hote}
              </span>
              <span className="min-w-0 flex-1">
                <Traits n={l.lectures} />
              </span>
              <span className="num w-[4ch] shrink-0 text-right text-[12px] tabular-nums">{l.lectures}</span>
            </div>
          ))}
          <p className="num mt-2 text-[11px] text-ink-3">{ecran.note}</p>
        </div>
      );

    /* ------------------------------------------------ 17 · les gestes */
    case "gestes":
      return (
        <div className="mx-auto flex max-w-[78vw] items-stretch gap-[1.6vw]">
          {ecran.panneaux.map((p) => (
            <div key={p.entete} className="min-w-0 flex-1">
              <div className="v-papier h-full">
                <div className="v-possession">{p.entete}</div>
                {p.creux ? (
                  <div className="flex h-[14vh] items-center justify-center">
                    <span className="v-manque num text-[11px] uppercase tracking-[0.14em]">
                      {p.minium}
                    </span>
                  </div>
                ) : (
                  p.lignes.map((l) => (
                    <p key={l} className="py-1" style={{ fontSize: "calc(var(--u) * 0.9)" }}>
                      {fr(l)}
                    </p>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      );

    /* ---------------------------------------------- 18 · la bascule */
    case "bascule":
      return (
        <div>
          <p className="serif-roman" style={{ fontSize: "calc(var(--u) * 3.4)" }}>
            {fr("Lisible n'est pas premier.")}
          </p>
          <p className="num mt-[3vh] text-[14px] text-ink-2">
            {ecran.rival} · {ecran.reponses} réponses sur {ecran.lues}
          </p>
        </div>
      );

    /* ------------------------------------------------ 19 · le sprint */
    case "sprint":
      return (
        <div className="mx-auto max-w-[80vw]">
          {ecran.chantiers.map((c) => (
            <div key={c.titre} className="flex items-baseline gap-[2vw] border-b border-rule py-[1.4vh]">
              <span className="serif-roman w-[9vw] shrink-0" style={{ fontSize: "calc(var(--u) * 1.3)" }}>
                {c.titre}
              </span>
              <span className="num w-[15vw] shrink-0 text-[11px] text-ink-3">seul : {c.seul}</span>
              <ul className="min-w-0 flex-1">
                {c.avecNous.map((a) => (
                  <li key={a} className="flex gap-2" style={{ fontSize: "calc(var(--u) * 0.9)" }}>
                    <span className="text-ink-3">·</span>
                    <span>{fr(a)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-[1.5vh] flex flex-wrap gap-x-[2.5vw] gap-y-1">
            {ecran.preuve.map((p) => (
              <span key={p} className="num text-[11px] text-ink-3">
                · {fr(p)}
              </span>
            ))}
          </div>
        </div>
      );

    /* --------------------------------------- 20 · la pièce à venir */
    case "piece-a-venir":
      return (
        <div className="mx-auto flex max-w-[76vw] items-center gap-[4vw]">
          <div className="min-w-0 flex-1">
            <p className="num text-[1.3vw]">
              la ligne qui sera comparée{NBSP}: votre nom dans {ecran.vosReponses} réponses sur{" "}
              {ecran.lues}
              {NBSP}<span className="text-ink-3">→</span>{NBSP}
              <span className="text-signal">?</span>
            </p>
            <p className="num mt-3 text-[11px] text-ink-3">
              mêmes questions, mêmes moteurs, mêmes versions, même formule · chiffres publiés
            </p>
          </div>
          <div className="w-[32vw] shrink-0">
            <div className="v-papier" style={{ minHeight: "26vh" }}>
              <div className="v-possession">
                pièce à venir · remesure du {ecran.date} · {ecran.questions} questions ·{" "}
                {ecran.moteurs} moteurs
              </div>
              {/* Le corps reste NU : la seule pièce vide autorisée, parce
                  qu'elle est datée et promise, jamais simulée. */}
            </div>
          </div>
        </div>
      );

    /* ------------------------------------------- 21 · la décision */
    default:
      return (
        <div className="flex items-center gap-[5vw]">
          {ecran.rappel ? (
            <div className="w-[24vw] shrink-0 opacity-80">
              <div className="v-papier" style={{ padding: "calc(var(--u) * 0.9)" }}>
                <div className="v-possession" style={{ marginBottom: "calc(var(--u) * 0.4)" }}>
                  pièce 01 · {ecran.rappel.moteur} · question{" "}
                  {String(ecran.rappel.rangQ).padStart(2, "0")}
                </div>
                <p className="v-manque num text-[11px] uppercase tracking-[0.12em]">
                  {ecran.rappel.marque} : 0 occurrence
                </p>
              </div>
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="num tracking-[-0.03em]" style={{ fontSize: "calc(var(--u) * 4.6)" }}>
              2{NBSP}900{NBSP}€ <span className="text-[1.1vw] text-ink-3">HT · une fois</span>
            </div>
            <div className="mt-[2.5vh] flex max-w-[46vw] flex-wrap items-baseline gap-x-[2.5vw] gap-y-2 border-t border-rule pt-[2vh]">
              {[
                "5 contenus livrés",
                "8 citations obtenues",
                "audit et correctifs",
                "preuve chaque vendredi",
                `remesure du ${ecran.dateRemesure} incluse`,
              ].map((x) => (
                <span key={x} className="num" style={{ fontSize: "calc(var(--u) * 1.05)" }}>
                  {x}
                </span>
              ))}
            </div>
            {ecran.places !== null ? (
              <p className="num mt-[2.5vh] text-[12px] text-ink-2">
                places restantes ce mois-ci{NBSP}: {ecran.places}
              </p>
            ) : null}
          </div>
        </div>
      );
  }
}

/**
 * LE MUR, exhibit interactif. La grille se lit d'un coup parce qu'elle ne
 * porte AUCUN libellé : 6 moteurs en lignes, les questions en colonnes, une
 * case par réponse. Le détail vient à la demande — Luigi survole ou clique
 * une colonne pendant qu'il parle, et la question s'écrit en clair sous la
 * grille avec qui a répondu quoi. La densité devient un instrument au lieu
 * d'un mur de texte de 10 pixels.
 */
function Mur({
  ecran,
}: {
  ecran: Extract<EcranVisio, { type: "mur" }>;
}) {
  // Deux états distincts : le survol PRÉVISUALISE (l'oeil suit la souris),
  // le clic ÉPINGLE (la question reste à l'écran pendant qu'on la commente,
  // même si la souris repart). Sans cette séparation, un clic sur la colonne
  // déjà survolée refermait le panneau : le geste le plus naturel annulait
  // l'action voulue.
  const [survol, setSurvol] = useState<number | null>(null);
  const [epingle, setEpingle] = useState<number | null>(null);
  const colonne = epingle ?? survol;
  const choisie = colonne !== null ? ecran.lignes[colonne] : null;

  return (
    <div className="mx-auto w-full max-w-[74vw]">
      {/* La grille : moteurs en lignes, questions en colonnes. */}
      <div className="flex flex-col gap-[0.5vh]" onMouseLeave={() => setSurvol(null)}>
        {ecran.moteurs.map((m, iM) => (
          <div key={m} className="flex items-center gap-[1.2vw]">
            <span
              className="num w-[8vw] shrink-0 text-right uppercase tracking-[0.12em] text-ink-3"
              style={{ fontSize: "max(10px, calc(var(--u) * 0.58))" }}
            >
              {m}
            </span>
            <div className="flex flex-1 gap-[0.3vw]">
              {ecran.lignes.map((l, iQ) => {
                const etat = l.etats[iM];
                const active = colonne === iQ;
                return (
                  <button
                    key={l.rang}
                    type="button"
                    aria-label={`Question ${l.rang}, ${m}`}
                    onMouseEnter={() => setSurvol(iQ)}
                    onFocus={() => setSurvol(iQ)}
                    onClick={() => setEpingle(epingle === iQ ? null : iQ)}
                    className={cn(
                      "v-cliquable h-[4.6vh] flex-1",
                      etat === "cite" && "bg-ink",
                      etat === "absent" && "border border-rule",
                      etat === "erreur" && "border border-rule opacity-25",
                      colonne !== null && !active && "v-eteint",
                    )}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {/* Le rail des numéros : discret, il ne devient lisible qu'au survol. */}
        <div className="flex items-center gap-[1.2vw]">
          <span className="w-[8vw] shrink-0" />
          <div className="flex flex-1 gap-[0.3vw]">
            {ecran.lignes.map((l, iQ) => (
              <span
                key={l.rang}
                className={cn(
                  "num flex-1 text-center tabular-nums transition-colors",
                  colonne === iQ ? "text-paper" : "text-ink-3",
                )}
                style={{ fontSize: "max(9px, calc(var(--u) * 0.5))" }}
              >
                {l.rang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* L'inspection : la question en clair, à la demande. Hauteur réservée,
          pour que la grille ne saute jamais pendant la présentation. */}
      <div className="mt-[2.5vh] flex min-h-[9vh] items-start gap-[1.2vw]">
        <span className="w-[8vw] shrink-0" />
        {choisie ? (
          <div className="min-w-0 flex-1 border-l border-rule pl-[1.2vw]">
            <p className="num text-ink-3" style={{ fontSize: "max(10px, calc(var(--u) * 0.55))" }}>
              question {String(choisie.rang).padStart(2, "0")} sur {ecran.lignes.length}
            </p>
            <p
              className="serif-roman mt-1"
              style={{ fontSize: "calc(var(--u) * 1.35)", maxWidth: "58ch" }}
            >
              «{NBSP}{choisie.texte}{NBSP}»
              {epingle !== null ? (
                <span className="num ml-3 align-middle text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  épinglée
                </span>
              ) : null}
            </p>
            <p className="num mt-2" style={{ fontSize: "max(10px, calc(var(--u) * 0.58))" }}>
              {choisie.etats.filter((e) => e === "cite").length > 0 ? (
                <span>
                  vous y êtes chez{" "}
                  {ecran.moteurs
                    .filter((_, i) => choisie.etats[i] === "cite")
                    .join(", ")}
                </span>
              ) : (
                <span className="text-signal">aucun moteur ne vous cite sur cette question</span>
              )}
            </p>
          </div>
        ) : (
          <p
            className="num flex-1 text-ink-3"
            style={{ fontSize: "max(10px, calc(var(--u) * 0.58))" }}
          >
            survolez une colonne pour lire la question · cliquez pour l'épingler
          </p>
        )}
      </div>

      <p className="v-source">
        case pleine : votre marque présente ({ecran.vosReponses} sur {ecran.reponsesLues}) · case
        vide : absente · case estompée : réponse en erreur, sortie des comptes
      </p>
    </div>
  );
}

/**
 * LES SIX JUGES, exhibit interactif. Six copies d'examen ne se lisent pas
 * en 10 pixels côte à côte : on montre les six VERDICTS en grand, et le
 * texte de la copie s'ouvre au clic, une à la fois. Luigi ouvre celle qu'il
 * veut commenter, quand il la commente.
 */
function SixJuges({
  ecran,
}: {
  ecran: Extract<EcranVisio, { type: "six-juges" }>;
}) {
  // La première copie lisible est ouverte d'entrée : un écran de présentation
  // ne doit jamais attendre un clic pour dire quelque chose.
  const premier = ecran.faces.findIndex((f) => !f.erreur && f.extrait);
  const [ouvert, setOuvert] = useState<number>(premier >= 0 ? premier : 0);
  const face = ecran.faces[ouvert];

  return (
    <div className="mx-auto w-full max-w-[76vw]">
      <p
        className="serif-roman mb-[2vh] text-ink-2"
        style={{ fontSize: "calc(var(--u) * 1.2)", maxWidth: "70ch" }}
      >
        «{NBSP}{ecran.question}{NBSP}» · question {String(ecran.rangQ).padStart(2, "0")}/
        {ecran.totalQ}
      </p>

      {/* Les six verdicts, en grand : l'image que le CEO retient. */}
      <div className="flex items-stretch gap-[1vw]">
        {ecran.faces.map((f, i) => {
          const actif = ouvert === i;
          return (
            <button
              key={f.moteur}
              type="button"
              onClick={() => setOuvert(i)}
              disabled={f.erreur}
              className={cn(
                "v-cliquable flex min-w-0 flex-1 flex-col border-t-2 pt-[1.2vh] text-left",
                actif ? "border-paper" : "border-rule",
                f.erreur && "cursor-default opacity-30",
                !actif && !f.erreur && "v-eteint",
              )}
            >
              <span
                className="num block uppercase tracking-[0.12em] text-ink-3"
                style={{ fontSize: "max(10px, calc(var(--u) * 0.55))" }}
              >
                {f.moteur}
              </span>
              <span
                className={cn(
                  "serif-roman mt-[0.8vh] block leading-[1.05]",
                  f.erreur ? "text-ink-3" : "text-signal",
                )}
                style={{ fontSize: "calc(var(--u) * 1.55)" }}
              >
                {f.erreur ? "hors mesure" : f.statut}
              </span>
              <span
                className="num mt-[1vh] block overflow-hidden text-ink-3"
                style={{
                  fontSize: "max(10px, calc(var(--u) * 0.55))",
                  height: "calc(var(--u) * 2.4)",
                  lineHeight: 1.4,
                }}
              >
                {f.marques.slice(0, 3).join(" · ")}
              </span>
            </button>
          );
        })}
      </div>

      {/* La copie ouverte : une seule à la fois, en papier. */}
      <div className="mt-[2.5vh]">
        {face && !face.erreur && face.extrait ? (
          <Panneau
            possession={{
              numero: 0,
              moteur: face.moteur,
              modele: face.modele,
              rangQ: ecran.rangQ,
              totalQ: ecran.totalQ,
              date: ecran.date,
              libelle: "COPIE",
            }}
            pied={<span>extrait de la réponse conservée</span>}
          >
            <p className="v-corps">{face.extrait}</p>
          </Panneau>
        ) : (
          <p className="num text-ink-3" style={{ fontSize: "max(10px, calc(var(--u) * 0.58))" }}>
            cette réponse est en erreur, elle est sortie de la mesure
          </p>
        )}
        <p className="v-source">
          cliquez un moteur pour ouvrir sa copie · extraits conservés mot pour mot
        </p>
      </div>
    </div>
  );
}

/** Une ligne de bordereau sur l'encre : libellé, points de conduite, valeur. */
function Ligne({
  libelle,
  valeur,
  note,
  manque,
}: {
  libelle: string;
  valeur: React.ReactNode;
  note?: string;
  manque?: boolean;
}) {
  return (
    <div className="border-b border-rule py-[1.2vh]">
      <div className="flex items-baseline gap-4">
        <span
          className={cn("num min-w-0 flex-1 truncate", manque && "text-signal")}
          style={{ fontSize: "calc(var(--u) * 1.35)" }}
        >
          {libelle}
        </span>
        <span className="conduite" aria-hidden />
        <span
          className={cn("num shrink-0 tabular-nums", manque && "text-signal")}
          style={{ fontSize: "calc(var(--u) * 1.35)" }}
        >
          {valeur}
        </span>
      </div>
      {note ? <p className="num mt-1 text-[11px] text-ink-3">{note}</p> : null}
    </div>
  );
}

/** Le nom de la marque souligné dans un verbatim (présence, en encre). */
function TexteSouligne({ texte, cible }: { texte: string; cible: string }) {
  const motif = new RegExp(`(${cible.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return (
    <>
      {texte.split(motif).map((bout, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-semibold not-italic" style={{ borderBottom: "2px solid var(--ink)" }}>
            {bout}
          </span>
        ) : (
          <span key={i}>{bout}</span>
        ),
      )}
    </>
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
