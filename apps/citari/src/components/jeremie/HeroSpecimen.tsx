/**
 * Vitrine « exemple de rapport du diagnostic » de la page d'accueil.
 *
 * Version du 14/08/2026 : extrait de document coupé en cours de lecture,
 * avec la liste de ce que le diagnostic vérifie. Contenu explicitement
 * illustratif (voir src/lib/contenu.ts) : ne jamais y substituer les chiffres
 * d'un vrai scan sans accord écrit du client concerné.
 */
import { SPECIMEN } from "@/lib/contenu";

function TicIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="flex-none"
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function HeroSpecimen() {
  return (
    <div className="w-full">
      <div className="relative overflow-hidden border border-ink-2 bg-paper-2">
        <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3 sm:px-6">
          <p className="mono text-[11px] uppercase tracking-[0.13em] text-ink-2">
            {SPECIMEN.libelle}
          </p>
          <p className="mono text-[11px] uppercase tracking-[0.13em] text-ink-2">
            {SPECIMEN.reference}
          </p>
        </div>

        <div className="flex flex-col gap-5 px-5 pb-12 pt-6 sm:px-6">
          <p className="mono text-[12px] text-ink-2">
            {SPECIMEN.moteurs} moteurs · {SPECIMEN.reponses} réponses
          </p>

          <p className="flex items-baseline gap-1">
            <span className="text-[76px] font-extrabold leading-[0.78] tracking-[-0.06em]">
              {SPECIMEN.score}
            </span>
            <span className="mono text-[22px] text-ink-2">/100</span>
          </p>

          <ul className="flex flex-col gap-3">
            {SPECIMEN.mentions.map((m) => (
              <li key={m.nom} className="flex items-center gap-3">
                <span className="w-[110px] flex-none text-[13px]">{m.nom}</span>
                <span className="h-[9px] flex-1 bg-paper-2">
                  <span
                    className="block h-full"
                    style={{
                      width: `${m.part}%`,
                      backgroundColor: m.vous ? "var(--signal)" : "var(--ink)",
                    }}
                  />
                </span>
                <span className="mono w-[26px] flex-none text-right text-[12px] text-ink-2">
                  {m.valeur}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-rule pt-5">
            <p className="mono text-[11px] uppercase tracking-[0.13em] text-ink-2">
              {SPECIMEN.pointsLabel}
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {SPECIMEN.points.map((p) => (
                <li key={p.label} className="flex items-start gap-2.5">
                  <span className="pt-0.5 text-signal">
                    <TicIcon />
                  </span>
                  <span className="flex-1 text-[14px] leading-[1.4]">{p.label}</span>
                  <span className="mono hidden flex-none text-[12px] text-ink-2 sm:block">
                    {p.valeur}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="mono mt-3 text-[11px] text-ink-2">{SPECIMEN.mentionLegale}</p>
    </div>
  );
}
