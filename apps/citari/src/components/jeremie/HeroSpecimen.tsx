import { SPECIMEN } from "@/lib/contenu";

/**
 * Le spécimen de rapport du héros.
 *
 * Porté du projet Lovable de Jérémie le 08/08/2026. Il montre à quoi ressemble
 * un résultat, dans le même langage visuel que la page de rapport, avant que le
 * visiteur ait lancé quoi que ce soit.
 *
 * Toutes ses valeurs viennent de `SPECIMEN` et sont fictives : c'est écrit dans
 * l'en-tête de la carte et répété sous elle. Ne jamais y substituer les
 * chiffres d'un vrai scan sans accord écrit du client concerné.
 */

export function HeroSpecimen() {
  const max = Math.max(...SPECIMEN.mentions.map((m) => m.valeur));

  return (
    <div className="w-full">
      <div className="border border-rule-strong bg-paper-2">
        <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3 sm:px-6">
          <p className="mono text-[11px] uppercase tracking-[0.13em] text-ink-2">
            {SPECIMEN.libelle}
          </p>
          <p className="mono text-[11px] uppercase tracking-[0.13em] text-ink-2">
            {SPECIMEN.reference}
          </p>
        </div>

        <div className="flex flex-col gap-5 px-5 py-6 sm:px-6">
          <div>
            <p className="text-[17px] font-semibold leading-tight">
              Cabinet d'expertise comptable, Lyon
            </p>
            <p className="mono mt-1.5 text-[12px] text-ink-2">
              {SPECIMEN.questions} questions · {SPECIMEN.moteurs} moteurs ·{" "}
              {SPECIMEN.reponses} réponses
            </p>
          </div>

          <p className="flex items-baseline gap-1">
            <span className="text-[76px] font-extrabold leading-[0.78] tracking-[-0.06em] text-signal">
              {SPECIMEN.score}
            </span>
            <span className="mono text-[22px] text-ink-2">/100</span>
          </p>

          <div className="border-t border-rule pt-5">
            <ul className="flex flex-col gap-3">
              {SPECIMEN.mentions.map((m) => (
                <li key={m.nom} className="flex items-center gap-3">
                  <span
                    className="mono w-[110px] flex-none text-[12px]"
                    style={m.vous ? { color: "var(--signal)" } : undefined}
                  >
                    {m.vous ? "Ce cabinet" : m.nom}
                  </span>
                  <span className="h-[9px] flex-1 bg-paper">
                    <span
                      className="block h-full"
                      style={{
                        width: `${(m.valeur / max) * 100}%`,
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
          </div>

          <div className="border-t border-rule pt-5">
            <p className="text-[15px] leading-[1.5] text-ink-2">
              Cité{" "}
              <strong className="font-bold text-ink">
                {SPECIMEN.mentions[2]!.valeur} fois sur {SPECIMEN.reponses}
              </strong>
              . Son concurrent direct,{" "}
              <strong className="font-bold text-ink">
                {SPECIMEN.mentions[0]!.valeur} fois
              </strong>
              . Trois causes identifiées, toutes réparables.
            </p>
            <p
              className="mt-3 border-l-2 pl-3 text-[15px] leading-[1.5] text-ink-2"
              style={{ borderColor: "var(--signal)" }}
            >
              {SPECIMEN.citation.avant}
              <span className="font-bold text-signal">{SPECIMEN.citation.marque}</span>
              {SPECIMEN.citation.apres}
            </p>
            <p className="mono mt-2 text-[11px] text-ink-2">{SPECIMEN.citation.source}</p>
          </div>
        </div>
      </div>
      <p className="mono mt-3 text-[11px] text-ink-2">{SPECIMEN.mentionLegale}</p>
    </div>
  );
}
