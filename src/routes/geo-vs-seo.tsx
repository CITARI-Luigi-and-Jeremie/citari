import { createFileRoute } from "@tanstack/react-router";
import { Article, Chrome, FaqBloc, H2, jsonLdArticle } from "@/components/chrome";
import { fr } from "@/lib/typo";

const FAQ = [
  {
    q: "Faut-il arrêter le SEO pour faire du GEO ?",
    r: "Non. Une part importante de ce que citent les moteurs génératifs vient de pages indexées par les moteurs classiques. Arrêter le SEO revient à couper la matière première du GEO.",
  },
  {
    q: "Le GEO coûte-t-il plus cher que le SEO ?",
    r: "Le travail est plus court et plus ciblé : une mission de 30 jours contre un abonnement mensuel de longue durée. En revanche il se mesure autrement, et il faut accepter une fenêtre d’effet de 4 à 12 semaines.",
  },
  {
    q: "Peut-on suivre le GEO dans Google Analytics ?",
    r: "Très mal. Une citation dans une réponse d’IA ne génère pas toujours de clic, donc pas toujours de session. C’est précisément pourquoi la mesure se fait en interrogeant les moteurs, pas en lisant les statistiques du site.",
  },
];

const LIGNES: [string, string, string][] = [
  ["Objet", "Un rang dans une liste de liens", "Une place dans une réponse rédigée"],
  ["Nombre de gagnants", "Dix résultats sur la première page", "Deux ou trois marques citées"],
  ["Deuxième page", "Existe, peu fréquentée", "N’existe pas"],
  ["Signal dominant", "Liens entrants et autorité de domaine", "Citations sur des sources tierces consultées en direct"],
  ["Format gagnant", "Page longue et optimisée sur un mot-clé", "Réponse directe, factuelle, vérifiable"],
  ["Rôle de la marque", "Utile", "Déterminant : le modèle cite des noms qu’il connaît"],
  ["Mesure", "Positions, trafic organique, impressions", "Taux de mention, position dans la réponse, part de voix"],
  ["Attribution", "Sessions et conversions traçables", "Souvent aucun clic : l’influence se produit avant la visite"],
  ["Délai d’effet", "3 à 9 mois", "4 à 12 semaines"],
  ["Risque principal", "Perdre des positions sur une mise à jour d’algorithme", "Être absent sans le savoir, faute de mesure"],
];

export const Route = createFileRoute("/geo-vs-seo")({
  head: () => ({
    meta: [
      { title: "GEO vs SEO : le comparatif point par point" },
      {
        name: "description",
        content:
          "Le SEO vise un rang parmi dix liens, le GEO une place parmi deux ou trois marques citées. Comparatif complet : signaux, formats, mesure, délais, attribution.",
      },
      { property: "og:title", content: "GEO vs SEO : le comparatif point par point" },
      {
        property: "og:description",
        content: "Dix différences concrètes entre référencement classique et visibilité dans les IA.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: jsonLdArticle(
          "GEO vs SEO : le comparatif point par point",
          "Comparatif entre Generative Engine Optimization et référencement naturel.",
          "/geo-vs-seo",
          FAQ,
        ),
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Chrome>
      <Article
        titre="GEO ou SEO : quelle différence ?"
        chapeau={fr(
          "Le SEO vise un rang parmi dix liens ; le GEO vise une place parmi les deux ou trois marques qu’une IA cite dans sa réponse. Les deux se nourrissent des mêmes pages, mais ils ne récompensent ni les mêmes signaux, ni les mêmes formats, et ils ne se mesurent pas du tout de la même façon.",
        )}
        sommaire={[
          ["tableau", "Le comparatif"],
          ["complement", "Pourquoi ils se complètent"],
          ["choisir", "Par lequel commencer"],
          ["faq", "Questions fréquentes"],
        ]}
      >
        <H2 id="tableau">Le comparatif, point par point</H2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-y border-ink">
                <th className="label-xs py-2 text-left">critère</th>
                <th className="label-xs py-2 text-left">SEO</th>
                <th className="label-xs py-2 text-left">GEO</th>
              </tr>
            </thead>
            <tbody>
              {LIGNES.map(([critere, seo, geo]) => (
                <tr key={critere} className="border-b border-rule align-top">
                  <td className="py-3 pr-6 font-medium">{critere}</td>
                  <td className="py-3 pr-6 leading-snug text-ink-2">{seo}</td>
                  <td className="py-3 leading-snug text-ink-2">{geo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="complement">Pourquoi ils se complètent</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Les moteurs génératifs ne partent pas de rien : quand ils cherchent en direct, ils interrogent un index de pages web. Un site invisible pour les moteurs classiques est donc rarement cité par les IA. À l’inverse, un excellent SEO ne suffit pas : le moteur peut citer un comparateur qui parle de vos concurrents sans jamais ouvrir votre site.",
          )}
        </p>

        <H2 id="choisir">Par lequel commencer</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Commencez par mesurer. Tant que vous ignorez si l’IA vous cite, vous ne savez pas quel problème vous avez. Si votre score est bas alors que votre SEO est correct, le sujet est la citabilité : contenus au format réponse directe et présence sur les sources tierces. Si votre site n’est ni indexé ni lisible, le chantier technique passe d’abord.",
          )}
        </p>

        <H2 id="faq">Questions fréquentes</H2>
        <FaqBloc items={FAQ} />
      </Article>
    </Chrome>
  );
}
