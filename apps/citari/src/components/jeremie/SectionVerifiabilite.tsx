import { Link } from "@tanstack/react-router";

import { Reveal } from "@/components/jeremie/Reveal";
import { Quadrillage } from "@/components/jeremie/Quadrillage";

/**
 * Le pont vers la méthode publiée.
 *
 * Ajouté le 15/08/2026. La page /methode publie la formule, le barème, un
 * calcul complet refaisable à la main, les limites assumées et ce que nous
 * ne garantissons PAS — c'est la pièce qui rend crédible tout le reste du
 * site. Elle n'était liée que depuis le pied de page, et Luigi l'a
 * lui-même « retrouvée tout en bas » : personne ne la lisait.
 *
 * Sa place est ici, juste après le prix. C'est le moment exact où le
 * lecteur se demande si tout ça est sérieux, et la seule réponse qui vaut
 * est « vérifiez vous-même ».
 *
 * Les quatre points annoncés ci-dessous existent réellement dans la page
 * (sections `formule`, `exemple`, `garanties`, `verifier`) : ne rien
 * promettre ici qui ne s'y trouve pas.
 */

const PIECES = [
  { label: "La formule", detail: "présence 50 %, rang 20 %, recommandation 20 %, tonalité 10 %" },
  { label: "Un calcul complet", detail: "refait à la main, ligne par ligne" },
  { label: "Le rejeu à J+90", detail: "mêmes questions, mêmes moteurs" },
  { label: "Ce que nous ne garantissons pas", detail: "écrit noir sur blanc" },
];

export function SectionVerifiabilite() {
  return (
    <section className="surface-hollow relative overflow-hidden">
      <Quadrillage variante="clair" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <p className="mono text-[12px] uppercase tracking-[0.12em] text-signal">
                Vérifiabilité
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 max-w-[18ch] text-[30px] sm:text-[42px]">
                Notre méthode est publiée en entier.
              </h2>
            </Reveal>
            <Reveal
              as="p"
              delay={140}
              className="measure mt-5 text-[16px] leading-relaxed text-ink-2 sm:text-[17px]"
            >
              Pas un résumé commercial : le protocole, la formule et un calcul complet que vous
              pouvez refaire à la main pour nous prendre en défaut.{" "}
              <strong className="font-semibold text-ink">
                Une mesure qu'on ne peut pas vérifier ne vaut rien.
              </strong>
            </Reveal>
            <Reveal delay={200} className="mt-8">
              <Link
                to="/methode"
                className="cta cta-sweep group inline-flex items-center gap-3 rounded-[4px] px-6 py-3.5"
              >
                <span>Lire la méthode</span>
                <span
                  aria-hidden
                  className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <ul className="border-t border-rule-strong">
              {PIECES.map((p) => (
                <li
                  key={p.label}
                  className="flex items-baseline gap-4 border-b border-rule py-4 sm:gap-6"
                >
                  <span aria-hidden className="mono shrink-0 text-[12px] text-signal">
                    ✓
                  </span>
                  <span className="flex-1">
                    <span className="block text-[16px] font-semibold leading-snug text-ink">
                      {p.label}
                    </span>
                    <span className="mono mt-1 block text-[12.5px] leading-snug text-ink-2">
                      {p.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
