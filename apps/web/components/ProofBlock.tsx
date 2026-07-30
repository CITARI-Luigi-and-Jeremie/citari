"use client";

import { useState } from "react";
import BlankLine from "./BlankLine";
import { fr } from "@/lib/typo";
import { CITIES, EXAMPLES } from "@/lib/examples";

/**
 * Le moment de compréhension — rendu personnel.
 *
 * Le visiteur choisit son métier et sa ville : l'exemple devient le sien, ce
 * qu'aucun texte générique ne peut faire. Explicitement étiqueté « exemple »
 * et « noms fictifs » : nous ne présentons jamais une mise en scène comme une
 * mesure réelle.
 */
export default function ProofBlock() {
  const [i, setI] = useState(0);
  const [city, setCity] = useState(CITIES[0] as string);
  const ex = EXAMPLES[i]!;
  const [rivalA, rivalB] = ex.rivals;

  const answer = ex.answer(city, rivalA, rivalB);
  const parts = answer.split(new RegExp(`(${rivalA}|${rivalB})`, "g"));

  const select =
    "appearance-none border-b border-dashed border-signal bg-transparent pr-4 font-mono text-ink " +
    "transition-colors duration-150 ease-sharp hover:border-solid focus:outline-none focus:border-solid " +
    "cursor-pointer";

  return (
    <figure className="border border-rule bg-paper-raised">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-4 py-3 sm:px-8">
        <span className="label">Exemple — ce que reçoit votre prospect</span>
        <span className="label">Noms de concurrents fictifs</span>
      </figcaption>

      {/* La phrase à compléter : le visiteur se désigne lui-même. */}
      <div className="border-b border-rule px-4 py-4 sm:px-8">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-2 text-lg text-ink-dim">
          <span>Je suis</span>
          <span className="relative">
            <select
              aria-label="Votre métier"
              value={i}
              onChange={(e) => setI(Number(e.target.value))}
              className={select}
            >
              {EXAMPLES.map((e, idx) => (
                <option key={e.trade} value={idx}>{e.trade}</option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-0 top-0 text-signal">▾</span>
          </span>
          <span>à</span>
          <span className="relative">
            <select
              aria-label="Votre ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={select}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-0 top-0 text-signal">▾</span>
          </span>
        </p>
      </div>

      <div className="grid gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:py-12">
        <div>
          <p className="font-mono text-sm text-ink-faint">Votre prospect demande</p>
          <p className="mt-2 font-mono text-lg text-ink">{fr(`« ${ex.question(city)} »`)}</p>

          <p className="mt-8 text-lg leading-relaxed text-ink-dim">
            {parts.map((p, k) =>
              p === rivalA || p === rivalB ? (
                <mark key={k} className="mark-rival">{p}</mark>
              ) : (
                <span key={k}>{fr(p)}</span>
              )
            )}
          </p>
        </div>

        {/* Le geste : la ligne restée vide */}
        <div className="lg:border-l lg:border-rule lg:pl-16">
          <BlankLine
            key={`${i}-${city}`}
            label={`Et votre ${ex.noun}`}
            caption="Il n’y a pas de deuxième page de résultats. Ce prospect ne saura jamais que vous existiez."
          />
        </div>
      </div>
    </figure>
  );
}
