import { useState } from "react";

import { Apparition } from "@/components/apparition";
import { Label } from "@/components/kit";
import { euros, fr, frTitre, groupe } from "@/lib/typo";

/* ---------------- Ce qui se décide dans une réponse d’IA ---------------- */

function Champ({
  libelle,
  valeur,
  onChange,
  suffixe,
  step = 100,
  note,
}: {
  libelle: string;
  valeur: number;
  onChange: (n: number) => void;
  suffixe?: string;
  step?: number;
  note?: string;
}) {
  return (
    <div className="border-b border-rule py-5 first:pt-0">
      <label className="block">
        <span className="block max-w-[30ch] text-[15px] leading-[1.5] text-ink-2">{fr(libelle)}</span>
        <span className="mt-2 flex items-baseline gap-1.5">
          <input
            type="number"
            min={0}
            step={step}
            inputMode="numeric"
            value={Number.isFinite(valeur) ? valeur : 0}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
            className="num w-full bg-transparent font-display text-[34px] font-light leading-none text-bordeaux outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {suffixe ? (
            <span className="font-display text-[24px] font-light leading-none text-bordeaux">
              {suffixe}
            </span>
          ) : null}
        </span>
      </label>
      {note ? <p className="mt-2 text-[13px] leading-[1.5] text-ink-3">{fr(note)}</p> : null}
    </div>
  );
}

function Ligne({ texte, valeur }: { texte: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-rule py-4">
      <span className="max-w-[38ch] text-[17px] leading-[1.5] text-ink-2">{fr(texte)}</span>
      <span className="num shrink-0 text-[19px] text-ink">{valeur}</span>
    </div>
  );
}

export function CoutAbsence() {
  const [panier, setPanier] = useState(3000);
  const [clients, setClients] = useState(8);
  const [part, setPart] = useState(46);

  const viaIa = (clients * part) / 100;
  const ca = panier * viaIa;
  const nombre = panier >= 2900 ? 1 : Math.ceil(2900 / Math.max(panier, 1));

  return (
    <Apparition as="section" className="mt-20 border-t border-rule pt-10 sm:mt-24">
      <Label className="pb-6">ce qui se décide dans une réponse d’IA</Label>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20">
        <div className="border-t border-rule pt-6">
          <Champ
            libelle="Panier moyen d’un nouveau client"
            valeur={panier}
            onChange={setPanier}
            suffixe="€"
          />
          <Champ
            libelle="Nouveaux clients par mois"
            valeur={clients}
            onChange={setClients}
            step={1}
          />
          <Champ
            libelle="Part de vos prospects qui se renseignent via une IA avant de choisir"
            valeur={part}
            onChange={setPart}
            suffixe="%"
            step={1}
            note="moyenne observée, Alchemer 2026"
          />
        </div>

        <div>
          <div className="border-t border-rule">
            <Ligne texte="Vos nouveaux clients chaque mois" valeur={groupe(clients)} />
            <Ligne
              texte="Ceux qui passent par une IA avant de choisir"
              valeur={viaIa.toFixed(1).replace(".", ",")}
            />
            <Ligne
              texte="Le chiffre d’affaires que cela représente"
              valeur={`${euros(ca)} / mois`}
            />
          </div>

          <p className="mt-12 max-w-[20ch] font-display text-[42px] font-light leading-[1.06] sm:text-[64px]">
            <span className="text-bordeaux">{euros(ca)}</span>{" "}
            {frTitre("d’affaires par mois se décident aujourd’hui dans une réponse d’IA.")}
          </p>

          <p className="mt-12 max-w-[52ch] border border-rule px-6 py-5 text-[17px] leading-[1.6] text-ink">
            {fr(
              `Le Sprint GEO coûte 2${"\u00A0"}900${"\u00A0"}€. À votre panier moyen, ${
                nombre === 1
                  ? "un seul client récupéré le rembourse."
                  : `${groupe(nombre)} clients récupérés le remboursent.`
              }`,
            )}
          </p>

          <p className="mt-5 max-w-[58ch] text-[14px] leading-[1.6] text-ink-3">
            {fr(
              "Ces chiffres sont les vôtres, pas les nôtres. Ils dimensionnent un enjeu, ils ne mesurent rien. C’est le scan qui mesure.",
            )}
          </p>
        </div>
      </div>
    </Apparition>
  );
}
