import { useState } from "react";

import { Apparition } from "@/components/apparition";
import { Label } from "@/components/kit";
import { euros, fr } from "@/lib/typo";

/* ---------------- Ce que coûte l’absence ---------------- */

function ChampInline({
  valeur,
  onChange,
  suffixe,
  aria,
  largeur = "5ch",
}: {
  valeur: number;
  onChange: (n: number) => void;
  suffixe?: string;
  aria: string;
  largeur?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-full border border-bordeaux/35 bg-paper px-3 py-1 align-middle transition-colors duration-300 focus-within:border-bordeaux hover:border-bordeaux">
      <input
        type="number"
        min={0}
        step={100}
        inputMode="numeric"
        aria-label={aria}
        value={Number.isFinite(valeur) ? valeur : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        style={{ width: largeur }}
        className="num bg-transparent text-[17px] text-bordeaux outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffixe ? <span className="text-[15px] text-bordeaux">{suffixe}</span> : null}
    </span>
  );
}

export function CoutAbsence() {
  const [panier, setPanier] = useState(3000);
  const [prospects, setProspects] = useState(20);
  const total = panier * prospects;

  return (
    <Apparition as="section" className="mt-40 border-t border-rule pt-10 sm:mt-52">
      <Label className="pb-6">ce que coûte l’absence</Label>

      <p className="max-w-[46ch] text-[19px] leading-[1.6] text-ink-2 sm:text-[21px]">
        Sur un panier moyen de{" "}
        <ChampInline aria="panier moyen en euros" valeur={panier} onChange={setPanier} suffixe="€" largeur="6ch" />
        , si{" "}
        <ChampInline
          aria="prospects par mois"
          valeur={prospects}
          onChange={setProspects}
          largeur="3.5ch"
        />{" "}
        {fr(
          "prospects par mois interrogent une IA avant de choisir, et qu’elle recommande trois noms dont pas le vôtre…",
        )}
      </p>

      <p className="mt-14 max-w-[20ch] font-display text-[52px] font-light leading-[1.04] sm:text-[86px]">
        {fr("… ce sont")} <span className="text-bordeaux">{euros(total)}</span>{" "}
        {fr("d’opportunités par mois qui partent chez un concurrent.")}
      </p>

      <p className="mt-12 max-w-[58ch] border-t border-rule pt-5 text-[15px] leading-[1.6] text-ink-3">
        {fr(
          "Ce calcul utilise vos chiffres, pas les nôtres. Il ne prouve rien — il dimensionne. Le scan, lui, mesure.",
        )}
      </p>
    </Apparition>
  );
}
