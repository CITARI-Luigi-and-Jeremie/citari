import type { Metadata } from "next";
import { ArticleLayout, articleJsonLd, Faq, H2, H3, P, Table, UL } from "@/lib/content";

const TITLE = "Alternatives aux agences SEO : que choisir en 2026 ?";
const DESCRIPTION =
  "Comparatif des options face à une agence SEO classique : agence GEO, freelance, SEO interne, outils en autonomie. Prix, délais, résultats attendus et cas d'usage.";
const UPDATED = "2026-07-30";

export const metadata: Metadata = {
  title: `${TITLE} | GEO Sprint`,
  description: DESCRIPTION,
  alternates: { canonical: "/alternatives-agence-seo" },
};

const FAQ = [
  {
    q: "Une agence GEO remplace-t-elle une agence SEO ?",
    a: "Pas exactement : les deux répondent à des questions différentes. Une agence SEO travaille votre position dans les résultats Google sur la durée ; une agence GEO travaille votre présence dans les réponses de ChatGPT, Claude, Gemini et Perplexity. Si votre SEO fonctionne déjà correctement, le GEO est le complément à plus fort effet marginal. Si vous partez de zéro sur les deux, commencez par mesurer : le scan est gratuit et vous dira lequel des deux est le plus urgent.",
  },
  {
    q: "Combien coûte une agence SEO en France ?",
    a: "Les prestations d'accompagnement mensuel se situent le plus souvent entre 800 € et 4 000 € par mois selon la taille du site et l'ambition, avec un engagement fréquent de 6 à 12 mois. Un audit ponctuel se facture généralement entre 1 500 € et 5 000 €. Vérifiez toujours ce qui est réellement produit chaque mois : le principal écart entre agences porte sur le volume de livrables, pas sur le discours.",
  },
  {
    q: "Un freelance suffit-il ?",
    a: "Souvent oui pour un besoin ciblé et un budget contraint, à condition que le périmètre soit précis. Les limites classiques sont la disponibilité, l'absence de relais en cas d'indisponibilité, et la difficulté à couvrir simultanément la technique, la rédaction et les relations presse. Pour un chantier ponctuel bien défini, c'est souvent le meilleur rapport qualité-prix.",
  },
  {
    q: "Peut-on faire du GEO soi-même ?",
    a: "Oui pour une partie. Débloquer les crawlers IA dans le robots.txt, publier un llms.txt et s'inscrire sur trois annuaires sectoriels sont des actions réalisables en interne en quelques heures — notre guide les détaille gratuitement. Ce qui prend du temps, c'est la production de contenus factuels de qualité et le travail de citations externes.",
  },
];

export default function AlternativesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd({ title: TITLE, description: DESCRIPTION, slug: "/alternatives-agence-seo", updated: UPDATED })),
        }}
      />
      <ArticleLayout
        title={TITLE}
        updated="30 juillet 2026"
        answer="Face à une agence SEO classique, quatre alternatives existent : une agence GEO (visibilité dans les réponses IA), un freelance, un recrutement en interne, ou l'autonomie outillée. Le bon choix dépend de trois facteurs : d'où vient votre trafic aujourd'hui, votre budget mensuel disponible, et le temps que vous pouvez y consacrer en interne."
      >
        <H2>Les 5 options, comparées</H2>
        <Table
          head={["Option", "Budget indicatif", "Délai d'effet", "Adapté si…"]}
          rows={[
            [
              <strong key="a">Agence SEO classique</strong>,
              "800 à 4 000 €/mois, engagement 6-12 mois",
              "3 à 12 mois",
              "Votre trafic dépend fortement de Google et vous visez des positions concurrentielles durables.",
            ],
            [
              <strong key="g">Agence GEO</strong>,
              "Mission courte (2 900 € chez nous) ou forfait mensuel ailleurs",
              "4 à 12 semaines",
              "Vos prospects arrivent en citant ce qu'une IA leur a dit, ou vos concurrents sortent dans ChatGPT et pas vous.",
            ],
            [
              <strong key="f">Freelance</strong>,
              "400 à 1 500 €/mois, ou 300-600 €/jour",
              "Variable",
              "Le besoin est ciblé, le périmètre clair, et vous pouvez piloter la prestation vous-même.",
            ],
            [
              <strong key="i">Recrutement interne</strong>,
              "45 à 70 k€/an chargé",
              "6 mois et plus",
              "Le canal organique est stratégique et représente un volume d'affaires qui justifie un poste.",
            ],
            [
              <strong key="o">Autonomie outillée</strong>,
              "50 à 300 €/mois d'outils + votre temps",
              "Selon votre implication",
              "Vous avez les compétences en interne et le temps de produire régulièrement.",
            ],
          ]}
        />
        <P>
          Ces fourchettes sont indicatives et varient fortement selon la taille du site, le secteur et le niveau de
          concurrence. Demandez systématiquement le détail des livrables mensuels : c'est le seul élément
          réellement comparable d'une offre à l'autre.
        </P>

        <H2>La question à se poser avant de choisir</H2>
        <P>
          Ce n'est pas « quelle agence ? » mais <strong>« d'où viennent mes prospects aujourd'hui, et d'où viendront-ils
          dans dix-huit mois ? »</strong>. Le paysage a bougé vite : 46 % des utilisateurs d'IA démarrent désormais
          leur recherche d'achat sur ChatGPT, Gemini ou Perplexity, contre 25 % en 2024, et une étude G2 de 2026
          estime qu'un acheteur B2B de logiciel sur deux commence par un chatbot.
        </P>
        <P>
          Concrètement, si vos commerciaux entendent de plus en plus souvent « j'ai demandé à ChatGPT et il m'a
          parlé de [concurrent] », le problème n'est plus votre position Google.
        </P>

        <H2>Pourquoi nous fonctionnons en sprint plutôt qu'en abonnement</H2>
        <P>
          L'abonnement mensuel est le modèle dominant en SEO, pour une bonne raison : le référencement demande un
          effort continu. Le GEO se comporte différemment. Une part importante de la valeur vient de correctifs
          techniques ponctuels — débloquer les crawlers, poser un llms.txt, baliser les pages — qui se font une
          fois et restent acquis. Le reste, ce sont des contenus factuels et des citations externes qui, une fois
          en place, continuent de produire leur effet.
        </P>
        <P>
          D'où notre format : <strong>30 jours, 2 900 €, paiement unique</strong>, sans abonnement ni engagement de
          durée. Et parce que nous refusons de vendre une promesse invérifiable, un{" "}
          <strong>re-scan est inclus à J+90</strong> : mêmes questions, mêmes moteurs, même méthode de calcul. Vous
          voyez la progression réelle.
        </P>

        <H2>Ce que nous ne faisons pas</H2>
        <UL
          items={[
            <><strong>Nous ne garantissons pas un score.</strong> Les moteurs intègrent les changements en 4 à 12 semaines et leurs réponses varient. Nous garantissons les actions livrées, documentées une par une.</>,
            <><strong>Nous ne remplaçons pas votre SEO.</strong> Si votre site n'est pas indexé correctement, commencez par là — nous vous le dirons franchement au call.</>,
            <><strong>Nous ne prenons pas plus de 3 sprints par mois.</strong> L'exécution est assurée par le fondateur ; au-delà, la qualité baisse.</>,
            <><strong>Nous ne vendons pas de scan payant.</strong> La mesure est gratuite et sans inscription. Vous repartez avec vos résultats même si nous ne travaillons jamais ensemble.</>,
          ]}
        />

        <H2>Comment décider en 90 secondes</H2>
        <P>
          Lancez le scan gratuit. S'il révèle un score élevé et une bonne part de voix, vous n'avez pas besoin de
          nous : investissez ailleurs, et nous vous le dirons. S'il montre que vos concurrents sont recommandés là
          où vous êtes absent, vous saurez exactement sur quelles questions et sur quels moteurs — et vous pourrez
          agir, avec nous ou sans nous.
        </P>

        <H3>Les 3 actions à faire vous-même, dès aujourd'hui</H3>
        <UL
          items={[
            <>Ouvrez <code>votresite.fr/robots.txt</code> et vérifiez que GPTBot, ClaudeBot et PerplexityBot n'y sont pas bloqués.</>,
            <>Publiez un fichier <code>llms.txt</code> à la racine décrivant votre activité, votre offre et vos pages clés.</>,
            <>Inscrivez-vous sur les deux ou trois comparateurs de votre secteur que les IA citent déjà — le scan vous dit lesquels.</>,
          ]}
        />
        <P>
          Tout est détaillé dans notre <a className="text-accent underline" href="/guide-geo">guide GEO</a>, en accès
          libre. Si vous préférez déléguer, c'est précisément notre métier.
        </P>

        <Faq items={FAQ} />
      </ArticleLayout>
    </>
  );
}
