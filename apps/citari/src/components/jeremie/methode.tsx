import type { ReactNode } from "react";

import { Reveal } from "@/components/jeremie/Reveal";

/**
 * Briques de la notice technique.
 *
 * Portées du projet Lovable de Jérémie le 07/08/2026. Tous les chiffres
 * affichés ici décrivent le protocole RÉEL du scan complet (ex-diagnostic) — 24
 * questions, 6 moteurs, 144 réponses, formule 50/20/20/10 — et doivent rester
 * alignés sur `src/lib/score.ts` et `src/lib/typo.ts`. Cette page est
 * l'engagement le plus vérifiable du site : elle invite le lecteur à refaire
 * le calcul.
 */

const mono = "font-mono text-[12px] tracking-[0.08em]";

/* ─────────────────────────── chiffres clés ─────────────────────────── */

const CHIFFRES = [
  { valeur: "24", libelle: "questions d'acheteurs" },
  { valeur: "6", libelle: "moteurs interrogés" },
  { valeur: "144", libelle: "réponses analysées" },
  { valeur: "/100", libelle: "score, formule publiée" },
];

export function ChiffresCles() {
  return (
    <dl className="mt-10 grid grid-cols-2 border-t border-ink sm:grid-cols-4">
      {CHIFFRES.map((c) => (
        <div
          key={c.libelle}
          className="border-b border-rule px-0 py-4 sm:border-r sm:border-rule sm:px-4 sm:first:pl-0 sm:last:border-r-0"
        >
          <dt className="font-mono text-[26px] leading-none tabular-nums text-ink sm:text-[30px]">
            {c.valeur}
          </dt>
          <dd className="mt-2 font-mono text-[11px] uppercase leading-[1.4] tracking-[0.08em] text-ink-2">
            {c.libelle}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ─────────────────────────────── cartes ─────────────────────────────── */

export function MethodeCard({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="rounded-[2px] border border-rule-strong bg-paper-2 p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase leading-[1.4] tracking-[0.08em] text-ink-2">
        {eyebrow}
      </p>
      <div className="mt-3 font-sans text-[15.5px] leading-[1.6] text-ink sm:text-[16px]">
        {children}
      </div>
    </div>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="my-7 grid gap-4 sm:grid-cols-2">{children}</div>;
}

/* ──────────────────────── répartition du score ──────────────────────── */

const PARTS = [
  { label: "Taux de mention", pct: 50, opacity: 1 },
  { label: "Position moyenne", pct: 20, opacity: 0.7 },
  { label: "Recommandation explicite", pct: 20, opacity: 0.45 },
  { label: "Sentiment", pct: 10, opacity: 0.22 },
];

/** Une barre, quatre segments, aplats d'encre. Aucune couleur hors palette. */
export function RepartitionBar() {
  return (
    <div className="my-7">
      <div
        className="flex h-9 w-full overflow-hidden rounded-[2px] border border-ink"
        role="img"
        aria-label="Répartition du score : taux de mention 50 %, position 20 %, recommandation 20 %, sentiment 10 %"
      >
        {PARTS.map((p) => (
          <div
            key={p.label}
            style={{
              width: `${p.pct}%`,
              backgroundColor: `color-mix(in srgb, var(--ink) ${Math.round(p.opacity * 100)}%, var(--paper))`,
            }}
          />
        ))}
      </div>
      <dl className="mt-4 border-t border-rule-strong">
        {PARTS.map((p) => (
          <div key={p.label} className="flex items-baseline gap-3 border-b border-rule py-2.5">
            <span
              aria-hidden="true"
              className="mt-[3px] size-2.5 shrink-0 rounded-[1px] border border-ink"
              style={{
                backgroundColor: `color-mix(in srgb, var(--ink) ${Math.round(p.opacity * 100)}%, var(--paper))`,
              }}
            />
            <dt className="min-w-0 flex-1 font-sans text-[15px] text-ink">{p.label}</dt>
            <dd className="font-mono text-[13px] tabular-nums text-ink">{p.pct} %</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ──────────────────────── les quatre temps ──────────────────────── */

type Temps = { num: string; titre: string; image: string; alt: string; corps: ReactNode };

const TEMPS: Temps[] = [
  {
    num: "1",
    titre: "Génération de l'échantillon",
    image: "/img/etape-scan.png",
    alt: "Une loupe posée sur des lignes de texte, illustration abstraite du scan.",
    corps: (
      <>
        Des questions d'intention d'achat, écrites à partir de votre secteur et de votre zone,
        réparties comme le sont les questions réelles : comparaisons, problèmes à résoudre,
        recherches locales, questions de confiance. Le scan complet en compte{" "}
        <span className="font-mono text-[15px] tabular-nums">24</span>. Le scan gratuit utilise un
        échantillon réduit du même protocole.
      </>
    ),
  },
  {
    num: "2",
    titre: "Interrogation",
    image: "/img/etape-citations.png",
    alt: "Un guillemet au-dessus de quatre filets, dont un surligné.",
    corps: (
      <>
        Chaque question est posée aux <span className="font-mono text-[15px] tabular-nums">6</span>{" "}
        moteurs, par les API officielles des éditeurs.{" "}
        <span className="font-mono text-[15px] tabular-nums">
          24 questions × 6 moteurs = 144 réponses
        </span>{" "}
        réelles. Jamais de capture d'écran, jamais de scraping : une capture ne se rejoue pas à
        l'identique.
      </>
    ),
  },
  {
    num: "3",
    titre: "Analyse",
    image: "/img/etape-diagnostic.png",
    alt: "Un cadran de mesure avec une aiguille, illustration de l'analyse.",
    corps: (
      <>
        Pour chaque réponse : quelles marques sont nommées, dans quel ordre, laquelle est
        explicitement recommandée, sur quel ton, et la phrase exacte où cela se joue.
      </>
    ),
  },
  {
    num: "4",
    titre: "Scellement",
    image: "/img/etape-scellement.png",
    alt: "Un tampon posé sur un registre fermé, illustration du scellement des questions.",
    corps: (
      <>
        Les questions sont enregistrées telles quelles, le premier jour. Nous ne pouvons pas les
        choisir après coup.
      </>
    ),
  },
];

export function MethodeTimeline() {
  return (
    <ol className="mt-8 border-l border-rule-strong sm:mt-10">
      {TEMPS.map((t, i) => (
        <li
          key={t.num}
          className={`relative pl-6 sm:pl-9 ${i === TEMPS.length - 1 ? "pb-0" : "pb-12 sm:pb-16"}`}
        >
          <span
            aria-hidden="true"
            className="absolute -left-[5px] top-[7px] size-[9px] rounded-full bg-ink"
          />
          <Reveal>
            <div className="flex items-baseline gap-3">
              <span className={`${mono} tabular-nums uppercase text-ink-2`}>temps {t.num} / 4</span>
            </div>
            <h3 className="mt-2 font-sans text-[21px] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink sm:text-[25px]">
              {t.titre}
            </h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-start sm:gap-7">
              <p className="font-sans text-[16px] leading-[1.65] text-ink sm:text-[17px]">
                {t.corps}
              </p>
              <img
                src={t.image}
                alt={t.alt}
                loading="lazy"
                width={1024}
                height={640}
                className="aspect-[16/10] w-full rounded-[2px] border border-rule-strong object-cover"
              />
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/* ──────────────────────── barème et calcul ──────────────────────── */

export function DataRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="border-t border-rule-strong">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-6 border-b border-rule py-2.5">
          <dt className="font-sans text-[15px] text-ink">{k}</dt>
          <dd className="font-mono text-[13px] tabular-nums text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const LIGNES_CALCUL: [string, string, string, string][] = [
  ["Taux de mention", "43 ÷ 144 = 29,9 %", "× 0,50", "14,93"],
  ["Position", "(6×1 + 9×0,8 + 11×0,6 + 12×0,4 + 5×0,2) ÷ 144 = 17,8 %", "× 0,20", "3,56"],
  ["Recommandation", "9 ÷ 144 = 6,3 %", "× 0,20", "1,25"],
  ["Sentiment", "(22×1 + 18×0,5 + 3×0) ÷ 43 = 72,1 %", "× 0,10", "7,21"],
];

/** Le calcul déroulé, pour que le lecteur puisse le refaire à la main. */
export function CalculTable() {
  return (
    <div className="my-9 rounded-[2px] border border-rule-strong bg-paper-2 px-4 py-5 sm:px-6 sm:py-7">
      <p className={`${mono} mb-4 uppercase text-ink-2`}>Relevé de calcul</p>

      <table className="hidden w-full border-collapse font-mono text-[12.5px] text-ink sm:table">
        <thead>
          <tr className="border-b border-ink text-left uppercase tracking-[0.08em] text-ink-2">
            <th className="py-2 pr-4 font-normal">Composante</th>
            <th className="py-2 pr-4 font-normal">Détail</th>
            <th className="py-2 pr-4 font-normal">Coeff.</th>
            <th className="py-2 text-right font-normal">Points</th>
          </tr>
        </thead>
        <tbody>
          {LIGNES_CALCUL.map((r) => (
            <tr key={r[0]} className="border-b border-rule align-baseline">
              <td className="whitespace-nowrap py-2.5 pr-4">{r[0]}</td>
              <td className="py-2.5 pr-4 tabular-nums">{r[1]}</td>
              <td className="py-2.5 pr-4 tabular-nums">{r[2]}</td>
              <td className="py-2.5 text-right tabular-nums">{r[3]} pts</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink">
            <td className="pr-4 pt-3 uppercase tracking-[0.08em]">Score</td>
            <td />
            <td />
            <td className="pt-3 text-right text-[16px] tabular-nums">27 / 100</td>
          </tr>
        </tfoot>
      </table>

      <div className="font-mono text-[12px] text-ink sm:hidden">
        {LIGNES_CALCUL.map((r) => (
          <div key={r[0]} className="border-t border-rule py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="uppercase tracking-[0.06em] text-ink-2">{r[0]}</span>
              <span className="tabular-nums">{r[3]} pts</span>
            </div>
            <p className="mt-1.5 leading-[1.5] tabular-nums text-ink-2">
              {r[1]} <span className="text-ink">{r[2]}</span>
            </p>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between border-t-2 border-ink pt-3">
          <span className="uppercase tracking-[0.08em]">Score</span>
          <span className="text-[16px] tabular-nums">27 / 100</span>
        </div>
      </div>
    </div>
  );
}
