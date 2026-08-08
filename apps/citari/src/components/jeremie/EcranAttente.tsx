import { useEffect, useMemo, useRef, useState } from "react";

import type { EtatScan } from "@/lib/orchestrateur.server";
import {
  ETAPES_ANALYSE,
  LIBELLES_PHASE,
  POINTS_METHODE,
  cleCellule,
  formaterDuree,
  formaterLatence,
  libelleQuestion,
} from "@/lib/scan-attente";

/**
 * L'écran d'attente : trois actes.
 *
 * Porté du projet Lovable de Jérémie (`components/scan-loading/LoadingScreen`)
 * le 08/08/2026, rebranché sur NOTRE `etatScan`.
 *
 *   Acte 1 — les questions tombent une à une, telles qu'elles s'écrivent en base.
 *   Acte 2 — une carte perforée se remplit, une case par paire question × moteur.
 *   Acte 3 — la grille se fige pendant l'analyse.
 *
 * Rien n'est simulé. Chaque case noircie correspond à une ligne réellement
 * écrite dans `responses` ; le chronomètre part de `started_at` ; la barre
 * suit `progression`. C'est la contrepartie de ce que la page vend : si on
 * animait un faux compteur ici, la mesure derrière ne vaudrait pas plus.
 */

type Props = { etat: EtatScan; instable: boolean };

/** Chronomètre du temps réellement écoulé depuis le début de la mesure. */
function useChrono(demarreA: string | null) {
  const depart = useMemo(() => {
    const valeur = demarreA ? new Date(demarreA).getTime() : NaN;
    return Number.isNaN(valeur) ? Date.now() : valeur;
  }, [demarreA]);
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return Math.max(0, maintenant - depart);
}

export function EcranAttente({ etat, instable }: Props) {
  const { questions, cellules, moteurs, verrouilles, collectees, total, progression } = etat;
  const ecoule = useChrono(etat.demarreA);
  const analyse = etat.phase === "analyse";
  const avantQuestions = questions.length === 0 || etat.phase === "init" || etat.phase === "questions";

  const remplies = useMemo(() => {
    const set = new Set<string>();
    for (const c of cellules) set.add(cleCellule(c.queryId, c.moteur));
    return set;
  }, [cellules]);

  const enErreur = useMemo(() => {
    const set = new Set<string>();
    for (const c of cellules) if (c.erreur) set.add(cleCellule(c.queryId, c.moteur));
    return set;
  }, [cellules]);

  const defilant = useMemo(() => cellules.slice(-3).reverse(), [cellules]);

  // Titre d'onglet : le compteur réel, pour l'onglet laissé en arrière-plan.
  useEffect(() => {
    if (avantQuestions || total === 0) return;
    const precedent = document.title;
    document.title = `${collectees}/${total} — Citari`;
    return () => {
      document.title = precedent;
    };
  }, [collectees, total, avantQuestions]);

  // Acte 3 : les libellés d'analyse s'allument successivement.
  const [etapeAnalyse, setEtapeAnalyse] = useState(0);
  useEffect(() => {
    if (!analyse) return;
    setEtapeAnalyse(0);
    const id = window.setTimeout(() => setEtapeAnalyse(1), 1200);
    return () => window.clearTimeout(id);
  }, [analyse]);

  // Au-delà de deux minutes : rotation lente des rappels de méthode.
  const longue = ecoule > 120_000;
  const [pointIndex, setPointIndex] = useState(0);
  useEffect(() => {
    if (!longue) return;
    const id = window.setInterval(
      () => setPointIndex((i) => (i + 1) % POINTS_METHODE.length),
      8000,
    );
    return () => window.clearInterval(id);
  }, [longue]);

  const phase = analyse
    ? LIBELLES_PHASE.analyse
    : avantQuestions
      ? (LIBELLES_PHASE[etat.phase] ?? LIBELLES_PHASE.questions)
      : `INTERROGATION DES MOTEURS — ${moteurs.length} INTERROGÉ${moteurs.length > 1 ? "S" : ""}`;

  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="mono text-[12px] tracking-[0.12em] text-ink-2">
          {phase}
          {avantQuestions ? (
            <span className="anim-blink ml-2 inline-block align-middle">▮</span>
          ) : null}
        </p>

        <h1 className="measure mt-5 text-[26px] sm:text-[34px]">Constitution de votre dossier.</h1>
        <p className="mono mt-4 text-[13px] text-ink-2">
          {etat.brand}
          {etat.domaine ? ` · ${etat.domaine}` : ""}
        </p>

        {avantQuestions ? (
          <CascadeQuestions questions={questions} />
        ) : (
          <>
            <div className="mono mt-12 flex flex-wrap items-baseline justify-between gap-3 text-[12px] tracking-[0.10em] text-ink-2">
              <span>
                RÉPONSES COLLECTÉES {collectees}/{total}
              </span>
              <span>{formaterDuree(ecoule)}</span>
            </div>

            <div className="progress-rail mt-3" aria-hidden>
              <span className="progress-fill" style={{ width: `${progression}%` }} />
            </div>

            <CartePerforee
              questions={questions}
              moteurs={moteurs}
              verrouilles={verrouilles}
              remplies={remplies}
              enErreur={enErreur}
              figee={analyse}
            />

            {verrouilles.length > 0 ? (
              <p className="mono mt-4 text-[12px] tracking-[0.10em] text-ink-2">
                ▢ {verrouilles.length} MOTEURS VERROUILLÉS — DIAGNOSTIC COMPLET
              </p>
            ) : null}

            {analyse ? (
              <div className="mono mt-6 space-y-2 text-[12px] tracking-[0.10em]">
                {ETAPES_ANALYSE.map((libelle, i) => (
                  <p key={libelle} className={i <= etapeAnalyse ? "text-ink" : "text-ink-2 opacity-40"}>
                    {libelle}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mono mt-6 truncate text-[12px] tracking-[0.10em] text-ink-2">
                {defilant.length === 0
                  ? "—"
                  : defilant
                      .map((c) =>
                        c.erreur
                          ? `${c.moteur.toUpperCase()} · INDISPONIBLE`
                          : `${c.moteur.toUpperCase()} · ${formaterLatence(c.latence)}`,
                      )
                      .join("   /   ")}
              </p>
            )}
          </>
        )}

        {longue ? (
          <p key={pointIndex} className="measure anim-step mt-12 text-ink-2">
            {POINTS_METHODE[pointIndex]}
          </p>
        ) : null}

        {instable ? (
          <p className="mono mt-10 text-[12px] tracking-[0.10em] text-ink-2">
            connexion instable — nouvelle tentative
          </p>
        ) : null}
      </div>
    </section>
  );
}

type Question = { id: string; rank: number; text: string; intent: string };

/**
 * ACTE 1 — cascade des vraies questions.
 * Une question déjà affichée ne re-anime jamais : seules les nouvelles tombent.
 */
function CascadeQuestions({ questions }: { questions: Question[] }) {
  const vues = useRef<Set<string>>(new Set());
  const nouvelles: string[] = [];
  for (const q of questions) if (!vues.current.has(q.id)) nouvelles.push(q.id);

  useEffect(() => {
    for (const q of questions) vues.current.add(q.id);
  }, [questions]);

  if (questions.length === 0) {
    return (
      <p className="mono mt-12 text-[13px] text-ink-2">
        Les questions de vos acheteurs s'écrivent…
      </p>
    );
  }

  return (
    <ul className="mt-12 border-t border-rule">
      {questions.map((q) => {
        const index = nouvelles.indexOf(q.id);
        const neuve = index !== -1;
        return (
          <li
            key={q.id}
            className={`flex items-baseline gap-4 border-b border-rule py-3${neuve ? " anim-step" : ""}`}
            style={neuve ? { animationDelay: `${index * 110}ms` } : undefined}
          >
            <span className="mono shrink-0 text-[12px] text-ink-2">{libelleQuestion(q.rank)}</span>
            <span className="measure">{q.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** ACTE 2 / 3 — une ligne par question, une colonne par moteur. */
function CartePerforee({
  questions,
  moteurs,
  verrouilles,
  remplies,
  enErreur,
  figee,
}: {
  questions: Question[];
  moteurs: string[];
  verrouilles: string[];
  remplies: Set<string>;
  enErreur: Set<string>;
  figee: boolean;
}) {
  if (questions.length === 0) return null;

  const colonnes = [
    ...moteurs.map((clef) => ({ clef, verrouille: false })),
    ...verrouilles.map((clef) => ({ clef, verrouille: true })),
  ];
  const gabarit = `3rem repeat(${colonnes.length}, minmax(0,1fr))`;

  return (
    <div className={figee ? "relative mt-6 text-ink-2" : "relative mt-6"}>
      <div
        className="grid items-end gap-y-1 border-b border-rule pb-2"
        style={{ gridTemplateColumns: gabarit }}
      >
        <span />
        {colonnes.map((c) => (
          <span
            key={c.clef}
            className={`col-moteur mono text-[9px] leading-none tracking-[0.10em] text-ink-2 sm:text-[10px]${
              c.verrouille ? " locked-col" : ""
            }`}
          >
            {c.clef.toUpperCase()}
            {c.verrouille ? " ▢" : ""}
          </span>
        ))}
      </div>

      {questions.map((q) => (
        <div
          key={q.id}
          className="grid items-center border-b border-rule py-1.5"
          style={{ gridTemplateColumns: gabarit }}
        >
          <span className="mono text-[11px] text-ink-2">{libelleQuestion(q.rank)}</span>
          {colonnes.map((c) => {
            if (c.verrouille) {
              return (
                <span key={c.clef} className="locked-col flex">
                  <span
                    className="block h-px w-[11px]"
                    style={{ backgroundColor: "var(--rule-strong)" }}
                  />
                </span>
              );
            }
            const clef = cleCellule(q.id, c.clef);
            if (enErreur.has(clef)) {
              // Une réponse en panne est marquée, jamais comptée comme une
              // absence : elle sort du dénominateur du score, et l'écran ne
              // doit pas la faire passer pour une réponse obtenue.
              return (
                <span key={c.clef} className="flex" title="Moteur indisponible sur cette question">
                  <span className="mono text-[11px] leading-none text-ink-2">×</span>
                </span>
              );
            }
            if (remplies.has(clef)) {
              return (
                <span key={c.clef} className="flex">
                  <span
                    className="anim-cell block size-[11px]"
                    style={{ backgroundColor: figee ? "var(--ink-2)" : "var(--ink)" }}
                  />
                </span>
              );
            }
            return (
              <span key={c.clef} className="flex">
                {figee ? (
                  <span className="mono text-[11px] leading-none text-ink-2">–</span>
                ) : (
                  <span
                    className="block size-[11px] border"
                    style={{ borderColor: "var(--rule-strong)" }}
                  />
                )}
              </span>
            );
          })}
        </div>
      ))}

      {figee ? (
        <span className="anim-sweep pointer-events-none absolute inset-x-0 top-0 h-px" />
      ) : null}
    </div>
  );
}
