import { Apparition } from "@/components/apparition";
import { Label } from "@/components/kit";
import { NBSP, fr, frTitre } from "@/lib/typo";

/* ---------------- 1. La mesure ---------------- */

const FORMULE: [string, string][] = [
  ["taux de mention", "50 %"],
  ["position moyenne", "20 %"],
  ["recommandation explicite", "20 %"],
  ["sentiment", "10 %"],
];

const ETAPES: [string, string][] = [
  [
    "Vingt-quatre questions écrites pour votre marché",
    "Générées à partir de votre secteur et de votre ville : dix comparatives, six sur un problème à résoudre, cinq locales, trois sur la confiance. Ce sont des questions d’acheteur, pas des mots-clés.",
  ],
  [
    "Quatre moteurs interrogés en direct",
    "ChatGPT, Claude, Gemini et Perplexity répondent à chacune des vingt-quatre questions, par les API officielles des éditeurs. Quatre-vingt-seize réponses réelles, collectées pendant votre scan. Jamais de capture d’écran, jamais de scraping.",
  ],
  [
    "Chaque réponse est décortiquée",
    "Quelles marques sont nommées, dans quel ordre, laquelle est explicitement recommandée, sur quel ton. Et la phrase exacte, mot pour mot, où cela se joue.",
  ],
  [
    "Un score, et tout ce qu’il y a derrière",
    "Sur cent points : présence dans la réponse 50, rang 20, recommandation explicite 20, tonalité 10. La formule est publiée parce que vous devez pouvoir la recalculer, et la contester.",
  ],
  [
    "Les questions sont scellées",
    "Elles sont enregistrées telles quelles, le premier jour. À J+90 nous rejouons exactement les mêmes, sur les mêmes moteurs, avec la même formule. Nous ne pouvons pas choisir nos questions après coup : c’est ce qui rend le avant/après incontestable.",
  ],
];

export function Mesure() {
  return (
    <Apparition as="section" className="mt-40 border-t border-rule pt-10 sm:mt-52">
      <Label className="pb-6">la mesure</Label>
      <h2 className="max-w-[15ch] text-balance text-[38px] leading-[1.02] sm:text-[62px]">
        {frTitre("Nous ne prononçons jamais votre nom.")}
      </h2>
      <p className="mt-10 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
        {fr(
          "C’est la seule façon d’obtenir une mesure honnête. Si nous demandions à ChatGPT ce qu’il pense de votre entreprise, il en dirait du bien — nous lui aurions soufflé la réponse. Nous posons donc les questions que vos acheteurs posent réellement, sans jamais citer votre marque, et nous regardons si elle apparaît d’elle-même.",
        )}
      </p>

      <ol className="mt-20 border-t border-rule">
        {ETAPES.map(([titre, texte], i) => (
          <li
            key={titre}
            className="grid gap-4 border-b border-rule py-10 md:grid-cols-[minmax(0,26ch)_1fr] md:gap-16"
          >
            <div className="flex items-baseline gap-4">
              <span className="num text-[11px] tracking-[0.14em] text-bordeaux">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="max-w-[22ch] font-display text-[24px] font-light leading-[1.15]">
                {frTitre(titre)}
              </h3>
            </div>
            <div>
              <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{fr(texte)}</p>
              {i === 3 ? (
                <dl className="mt-8 max-w-[46ch] border-t border-rule">
                  {FORMULE.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-6 border-b border-rule py-3.5"
                    >
                      <dt className="text-[14px] text-ink-2">{k}</dt>
                      <dd className="font-display text-[26px] font-light leading-none">
                        {v.replace(" ", NBSP)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Apparition>
  );
}


