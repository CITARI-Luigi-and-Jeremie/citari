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
  // Dérivés du contenu, jamais écrits en dur : la phrase d'écart et les
  // barres doivent dire le même chiffre, y compris si le spécimen change.
  const vous = SPECIMEN.mentions.find((m) => m.vous);
  const rival = SPECIMEN.mentions
    .filter((m) => !m.vous)
    .reduce<(typeof SPECIMEN.mentions)[number] | null>(
      (haut, m) => (haut && haut.valeur >= m.valeur ? haut : m),
      null,
    );

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

        {/* Compacté le 15/08/2026 : le spécimen faisait 661px contre 433 au
            bloc de gauche, donc il démarrait 114px PLUS HAUT que le titre et
            l'écrasait — l'accessoire dominait le message. Rien n'a été
            retiré : le score et l'écart de citations gagnent au contraire en
            lisibilité, et les deux moitiés du document (la mesure / ce que
            le diagnostic vérifie) sont enfin distinctes. */}
        <div className="flex flex-col gap-4 px-5 pb-6 pt-5 sm:px-6">
          <p className="mono text-[12px] text-ink-2">
            {SPECIMEN.moteurs} moteurs · {SPECIMEN.reponses} réponses
          </p>

          {/* Colonne sur mobile : à côté du score, la phrase d'écart se
              cassait en trois lignes avec « fois » tout seul. */}
          <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <p className="flex items-baseline gap-1">
              <span className="text-[64px] font-extrabold leading-[0.78] tracking-[-0.06em]">
                {SPECIMEN.score}
              </span>
              <span className="mono text-[20px] text-ink-2">/100</span>
            </p>
            {/* L'écart, dit en toutes lettres : c'est le message du bloc, et
                il n'était lisible qu'en comparant trois barres à l'œil. */}
            {vous && rival ? (
              <p className="mono text-left text-[12px] leading-[1.45] text-ink-2 sm:max-w-[48%] sm:text-right">
                cité <span className="font-semibold text-signal">{vous.valeur} fois</span> quand son
                rival l'est <span className="font-semibold text-ink">{rival.valeur} fois</span>
              </p>
            ) : null}
          </div>

          <ul className="flex flex-col gap-2.5">
            {SPECIMEN.mentions.map((m) => (
              <li key={m.nom} className="flex items-center gap-3">
                <span
                  className={`w-[104px] flex-none text-[13px] ${
                    m.vous ? "font-semibold text-signal" : ""
                  }`}
                >
                  {m.nom}
                </span>
                <span className="h-[10px] flex-1 bg-paper-2">
                  <span
                    className="block h-full"
                    style={{
                      width: `${m.part}%`,
                      backgroundColor: m.vous ? "var(--signal)" : "var(--ink)",
                    }}
                  />
                </span>
                <span
                  className={`mono w-[26px] flex-none text-right text-[12px] ${
                    m.vous ? "font-semibold text-signal" : "text-ink-2"
                  }`}
                >
                  {m.valeur}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t-2 border-ink pt-4">
            <p className="mono text-[11px] uppercase tracking-[0.13em] text-ink-2">
              {SPECIMEN.pointsLabel}
            </p>
            <ul className="mt-2.5 flex flex-col gap-2">
              {SPECIMEN.points.map((p) => (
                <li key={p.label} className="flex items-start gap-2.5">
                  <span className="pt-0.5 text-signal">
                    <TicIcon />
                  </span>
                  <span className="flex-1 text-[13.5px] leading-[1.35]">{p.label}</span>
                  <span className="mono hidden flex-none text-[11.5px] text-ink-2 sm:block">
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
