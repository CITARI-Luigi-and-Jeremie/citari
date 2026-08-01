import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales | Citari", robots: { index: false } };

/**
 * Obligatoire en France (art. 6 III LCEN). Les [À COMPLÉTER] doivent être remplis
 * avant la mise en ligne — c’est une obligation légale, pas une option.
 */
export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-prose space-y-8 px-4 py-16">
      <a href="/" className="label transition-colors duration-150 ease-sharp hover:text-ink">← Citari</a>
      <h1 className="font-editorial text-3xl text-ink">Mentions légales</h1>

      <section className="space-y-2">
        <h2 className="font-editorial text-xl text-ink">Éditeur du site</h2>
        <p className="text-ink-dim">
          <strong>[À COMPLÉTER : dénomination sociale]</strong>
          <br />Forme juridique : [À COMPLÉTER]
          <br />Capital social : [À COMPLÉTER]
          <br />Siège social : [À COMPLÉTER : adresse complète]
          <br />SIREN / SIRET : [À COMPLÉTER]
          <br />RCS : [À COMPLÉTER]
          <br />N° TVA intracommunautaire : [À COMPLÉTER]
          <br />Directeur de la publication : Luigi Revelli Caracciolo
          <br />Contact : <a className="text-signal underline" href="mailto:[À COMPLÉTER]">[À COMPLÉTER : email]</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-editorial text-xl text-ink">Hébergement</h2>
        <p className="text-ink-dim">
          [À COMPLÉTER : nom de l’hébergeur, adresse et téléphone — par exemple Vercel Inc., 440 N Barranca Ave
          #4133, Covina, CA 91723, États-Unis]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-editorial text-xl text-ink">Propriété intellectuelle</h2>
        <p className="text-ink-dim">
          L’ensemble des contenus de ce site (textes, méthodologie de scoring, rapports générés) est protégé par le
          droit d’auteur. Toute reproduction ou réutilisation, totale ou partielle, sans autorisation écrite
          préalable est interdite. Les marques citées dans les rapports (ChatGPT, Claude, Gemini, Perplexity, ainsi
          que les marques analysées) appartiennent à leurs détenteurs respectifs et sont mentionnées à des fins
          d’information et de comparaison.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-editorial text-xl text-ink">Limitation de responsabilité</h2>
        <p className="text-ink-dim">
          Les scores de visibilité et analyses fournis résultent de mesures effectuées via les API officielles des
          moteurs d’IA générative à un instant donné. Les réponses de ces moteurs étant variables par nature, ces
          résultats constituent une indication et non une garantie de position. Ils ne sauraient engager la
          responsabilité de l’éditeur quant aux décisions commerciales prises sur leur fondement.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-editorial text-xl text-ink">Médiation de la consommation</h2>
        <p className="text-ink-dim">
          Conformément à l’article L.612-1 du Code de la consommation, tout client consommateur peut recourir
          gratuitement à un médiateur de la consommation : [À COMPLÉTER : nom et coordonnées du médiateur — à
          souscrire auprès d’un organisme agréé].
        </p>
      </section>

      <p className="pt-4 text-sm text-ink-faint">
        Voir également notre <a className="text-signal underline" href="/confidentialite">politique de confidentialité</a>.
      </p>
    </main>
  );
}
