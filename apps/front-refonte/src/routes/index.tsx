import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanForm } from "@/components/ScanForm";
import { Exhibit } from "@/components/Exhibit";
import { SELF_SCORE, SELF_SCORE_DATE } from "@/lib/site";

const TITLE = "Citari — scan de visibilité dans les réponses des IA";
const DESCRIPTION =
  "Six moteurs interrogés en direct avec les vraies questions de vos acheteurs. Votre score sur 100 et les phrases exactes, en 90 secondes.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <h1 className="max-w-[24ch] text-[34px] sm:text-[52px]">
            L'IA recommande déjà quelqu'un à vos clients. Vérifiez que c'est vous.
          </h1>
          <p className="measure mt-6 text-ink-2">
            Le scan interroge ChatGPT, Claude, Gemini, Perplexity, Grok et Le Chat avec les
            vraies questions de vos acheteurs. Votre score et les phrases exactes, en 90
            secondes.
          </p>
          <ScanForm />
        </div>
      </section>

      <Exhibit />

      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="text-[26px] sm:text-[34px]">Comment c'est mesuré</h2>
          <ol className="mt-10 space-y-10">
            <li className="grid gap-2 sm:grid-cols-[4rem_1fr]">
              <span className="mono text-[13px] text-ink-2">01</span>
              <p className="measure">
                Les questions de vos acheteurs. Générées pour votre secteur et votre ville.
                Votre nom n'apparaît jamais dans la question : on regarde si votre marque
                sort d'elle-même.
              </p>
            </li>
            <li className="grid gap-2 sm:grid-cols-[4rem_1fr]">
              <span className="mono text-[13px] text-ink-2">02</span>
              <p className="measure">
                Six moteurs interrogés en direct. Par leurs API officielles, au moment du
                scan. Aucune réponse simulée, aucun scraping.
              </p>
            </li>
            <li className="grid gap-2 sm:grid-cols-[4rem_1fr]">
              <span className="mono text-[13px] text-ink-2">03</span>
              <p className="measure">
                Un score sur 100, formule publiée. Présence 50 %, rang 20 %, recommandation
                explicite 20 %, tonalité 10 %. Vous pouvez le recalculer.
              </p>
            </li>
          </ol>
          <p className="mt-10">
            <Link to="/methode" className="underline underline-offset-4">
              Lire la méthode complète →
            </Link>
          </p>
        </div>
      </section>


      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="text-[26px] sm:text-[34px]">
            Le Sprint GEO — <span className="mono">2 900 € HT</span>, une fois.
          </h2>
          <p className="measure mt-6 text-ink-2">
            30 jours. Trois chantiers : votre site rendu lisible par les IA, cinq contenus
            qui répondent aux questions où vous êtes absent, huit sources tierces qui parlent
            de vous. Re-scan à J+90, mêmes questions, pour mesurer ce qui a bougé. Pas
            d'abonnement. Pas d'engagement. Une agence GEO classique facture 2 500 à 8 000 €
            par mois, avec contrat. Nous, c'est un sprint, un prix, un résultat mesuré.
          </p>
          <p className="mono mt-6 text-[13px] text-ink-2">
            3 sprints par mois · Un seul client par secteur et par zone
          </p>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="text-[26px] sm:text-[34px]">Pourquoi nous croire</h2>
          <ul className="mt-10 divide-y divide-[var(--rule)] border-y border-rule">
            <li className="measure py-5">
              La formule du score est publiée. Vous pouvez la recalculer, et la contester.
            </li>
            <li className="measure py-5">
              Les questions sont scellées : le re-scan à J+90 rejoue exactement les mêmes.
              Impossible de choisir ses questions après coup.
            </li>
            <li className="measure py-5">
              Aucune garantie de classement — personne ne peut en donner, il n'y a pas de
              classement dans ChatGPT. Nous garantissons les actions livrées.
            </li>
            <li className="measure py-5">
              Nous appliquons la méthode sur nous-mêmes, en public.
              {SELF_SCORE !== null ? (
                <span className="mono mt-4 block border border-rule-strong bg-paper-2 p-4 text-[13px]">
                  Score Citari : {SELF_SCORE}/100 — mesuré le {SELF_SCORE_DATE}
                </span>
              ) : null}
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="text-[26px] sm:text-[34px]">FAQ</h2>
          <dl className="mt-10 space-y-10">
            <div>
              <dt className="measure font-medium">
                Le diagnostic, c'est un rendez-vous commercial ?
              </dt>
              <dd className="measure mt-3 text-ink-2">
                C'est une restitution. Vous repartez avec votre diagnostic complet quoi qu'il
                arrive. Si votre score est bon, on vous le dira, et on ne vous proposera rien.
              </dd>
            </div>
            <div>
              <dt className="measure font-medium">Pourquoi le scan est gratuit ?</dt>
              <dd className="measure mt-3 text-ink-2">
                Il nous coûte environ cinquante centimes d'API et c'est notre meilleure
                démonstration. On préfère vous montrer la méthode que vous la raconter.
              </dd>
            </div>
            <div>
              <dt className="measure font-medium">
                Combien de temps pour voir des résultats ?
              </dt>
              <dd className="measure mt-3 text-ink-2">
                Les moteurs intègrent les changements en 4 à 12 semaines. Personne ne contrôle
                ce délai — c'est pour ça qu'on garantit les actions livrées, jamais un score.
                Ceux qui vous garantissent la première place dans ChatGPT vous mentent : il
                n'y a pas de classement dans ChatGPT.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
