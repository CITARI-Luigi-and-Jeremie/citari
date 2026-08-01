import type { Metadata } from "next";
import { ArticleLayout, articleJsonLd, Faq, H2, H3, P, Sources, Table, UL } from "@/lib/content";

const TITLE = "Qu’est-ce que le GEO (Generative Engine Optimization) ?";
const DESCRIPTION =
  "Le GEO consiste à faire apparaître une marque dans les réponses de ChatGPT, Claude, Gemini et Perplexity. Définition, fonctionnement, leviers concrets et méthode de mesure.";
const UPDATED = "2026-07-30";

export const metadata: Metadata = {
  title: `${TITLE} | Citari`,
  description: DESCRIPTION,
  alternates: { canonical: "/guide-geo" },
};

const FAQ = [
  {
    q: "Le GEO remplace-t-il le SEO ?",
    a: "Non. Le SEO reste indispensable : les moteurs génératifs s’appuient largement sur des pages web indexées et sur des sources tierces bien référencées. Le GEO ajoute une couche : être compris, cité et recommandé par les modèles, ce qui suppose des contenus factuels, structurés et repris ailleurs.",
  },
  {
    q: "Combien de temps avant de voir un effet ?",
    a: "Comptez 4 à 12 semaines. Les moteurs mettent à jour leurs index et leurs sources à des rythmes différents : Perplexity et les modes recherche réagissent en quelques jours à quelques semaines, tandis que les connaissances internes des modèles évoluent au rythme des entraînements. C’est pourquoi toute mesure sérieuse compare deux scans espacés d’au moins 90 jours.",
  },
  {
    q: "Peut-on garantir une position dans ChatGPT ?",
    a: "Non, et méfiez-vous de quiconque le promet. Les réponses génératives varient d’une formulation à l’autre et d’une session à l’autre. Ce qui se pilote, ce sont les causes : lisibilité technique du site, existence de contenus qui répondent aux questions d’achat, et présence sur les sources que les moteurs citent. Ce qui se mesure, c’est une tendance sur un échantillon stable de requêtes.",
  },
  {
    q: "Faut-il bloquer ou autoriser les crawlers IA ?",
    a: "Si vous voulez être cité, il faut les autoriser : GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, entre autres. Beaucoup de sites les ont bloqués par précaution en 2023-2024 et se sont rendus invisibles sans le savoir. Le blocage se justifie surtout pour des contenus payants ou propriétaires.",
  },
  {
    q: "Le GEO concerne-t-il aussi les PME locales ?",
    a: "Oui, souvent davantage que les grands comptes. Sur les requêtes locales et de niche, les moteurs disposent de peu de sources fiables : quelques pages factuelles bien structurées et deux ou trois citations externes solides suffisent souvent à entrer dans les réponses, là où la concurrence SEO classique serait hors de portée.",
  },
];

export default function GuideGeoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd({ title: TITLE, description: DESCRIPTION, slug: "/guide-geo", updated: UPDATED })),
        }}
      />
      <ArticleLayout
        title={TITLE}
        updated="30 juillet 2026"
        answer="Le GEO (Generative Engine Optimization) est l’ensemble des actions qui font apparaître une marque dans les réponses des IA génératives — ChatGPT, Claude, Gemini, Perplexity. Concrètement : rendre son site lisible par les robots des IA, publier les contenus factuels qu’elles citent, et exister sur les sources externes sur lesquelles elles s’appuient."
      >
        <H2>Pourquoi le sujet devient urgent</H2>
        <P>
          Le point de départ est un déplacement d’audience. ChatGPT dépassait 900 millions d’utilisateurs actifs
          hebdomadaires début 2026, et l’usage a glissé de la conversation vers la décision d’achat : 46 % des
          utilisateurs d’IA démarrent désormais leur recherche produit directement sur une plateforme d’IA, contre
          25 % en 2024. En B2B, une étude G2 de 2026 estime qu’un acheteur de logiciel sur deux commence sa
          recherche par un chatbot.
        </P>
        <P>
          La conséquence est brutale pour une marque : quand un prospect demande « quel prestataire choisir pour X »,
          il obtient une réponse courte citant deux ou trois acteurs. Si vous n’y êtes pas, vous n’êtes pas dans la
          short-list — et contrairement à Google, il n’y a pas de deuxième page où figurer.
        </P>
        <P>
          Nuance utile, qui évite les discours catastrophistes : la confiance reste partielle. 86 % des acheteurs
          qui utilisent l’IA vérifient sa recommandation via une autre source avant d’acheter. Le rôle de l’IA est
          donc surtout de <strong>constituer la short-list</strong>, pas de conclure la vente. C’est précisément
          pour cela qu’en être absent coûte cher : vous n’êtes jamais vérifié, car jamais proposé.
        </P>

        <H2>Comment un moteur génératif choisit les marques qu’il cite</H2>
        <P>Trois mécanismes se combinent, et chacun se travaille différemment.</P>
        <H3>1. La connaissance interne du modèle</H3>
        <P>
          Ce que le modèle a mémorisé pendant son entraînement. Elle favorise les marques dont il a « beaucoup lu »
          parler : presse, forums, comparateurs, encyclopédies. Elle évolue lentement, au rythme des nouveaux
          modèles, et se travaille par la notoriété écrite — donc par les citations externes.
        </P>
        <H3>2. La recherche en direct</H3>
        <P>
          Perplexity, les modes recherche de ChatGPT, Claude et Gemini vont chercher des pages au moment de la
          question, puis citent leurs sources. C’est le canal le plus rapide à influencer : une page qui répond
          précisément à une question d’achat peut être citée en quelques semaines. Encore faut-il que les robots
          puissent y accéder.
        </P>
        <H3>3. L’accessibilité technique de votre site</H3>
        <P>
          Si votre <code>robots.txt</code> bloque GPTBot ou PerplexityBot, aucun des deux mécanismes précédents ne
          jouera en votre faveur. Si vos pages sont mal structurées ou noyées dans du marketing vague, le modèle
          n’en extraira aucun fait citable.
        </P>

        <H2>Les 3 chantiers du GEO</H2>
        <Table
          head={["Chantier", "Ce qu’on fait", "Automatisable", "Délai d’effet"]}
          rows={[
            [
              <strong key="t">Technique</strong>,
              "Autoriser les crawlers IA, publier un llms.txt, baliser en schema.org, restructurer les pages clés en format « réponse directe »",
              "~90 %",
              "2 à 6 semaines",
            ],
            [
              <strong key="c">Contenu</strong>,
              "Pages comparatives, pages « alternatives à », FAQ métier balisée, guides d’achat factuels ciblés sur les questions où vous êtes absent",
              "~70 %",
              "4 à 10 semaines",
            ],
            [
              <strong key="e">Citations externes</strong>,
              "Annuaires et comparateurs sectoriels, presse spécialisée, forums, fiches (Google Business, Wikipedia si éligible)",
              "~20 %",
              "6 à 16 semaines",
            ],
          ]}
        />
        <P>
          L’ordre compte : le chantier technique conditionne les deux autres. Publier d’excellents contenus alors
          que les robots IA sont bloqués revient à écrire pour une salle vide.
        </P>

        <H2>Ce qui fonctionne, concrètement</H2>
        <UL
          items={[
            <>
              <strong>Répondre avant de raconter.</strong> Une page dont les deux premières phrases répondent
              littéralement à la question posée est bien plus facile à citer qu’une page qui « pose le contexte »
              pendant trois paragraphes.
            </>,
            <>
              <strong>Des faits, pas des adjectifs.</strong> Prix, délais, chiffres, critères, tableaux
              comparatifs : un modèle cite ce qu’il peut vérifier et reformuler. « Leader innovant du secteur » ne
              se cite pas.
            </>,
            <>
              <strong>Assumer la comparaison.</strong> Les pages « X vs Y » et « alternatives à X » répondent à des
              intentions d’achat très concrètes. Traiter les concurrents loyalement, avec des faits exacts, rend la
              page citable — et crédible.
            </>,
            <>
              <strong>Exister ailleurs que chez soi.</strong> Les moteurs recoupent. Une marque citée uniquement par
              son propre site est fragile ; une marque présente sur trois comparateurs sectoriels et deux articles
              de presse devient une réponse « sûre » pour le modèle.
            </>,
            <>
              <strong>Structurer pour la machine.</strong> Un H1 unique, une hiérarchie Hn propre, du balisage
              schema.org adapté (Organization, Service, FAQPage, LocalBusiness) et un fichier{" "}
              <code>llms.txt</code> qui résume votre activité, votre offre et vos pages clés.
            </>,
          ]}
        />

        <H2>Comment mesurer sa visibilité IA</H2>
        <P>
          Une mesure crédible repose sur trois principes. D’abord un <strong>échantillon stable</strong> : 20 à 30
          questions d’intention d’achat de votre secteur, figées, qu’on reposera à l’identique dans trois mois.
          Ensuite une <strong>mesure multi-moteurs</strong>, car les écarts entre ChatGPT, Claude, Gemini et
          Perplexity sont importants. Enfin un <strong>indicateur composite</strong> plutôt qu’un simple « cité ou
          non ».
        </P>
        <P>Le score de visibilité IA que nous utilisons combine quatre composantes :</P>
        <Table
          head={["Composante", "Poids", "Ce qu’elle mesure"]}
          rows={[
            ["Taux de mention", "50 %", "Sur combien de questions la marque apparaît-elle ?"],
            ["Position moyenne", "20 %", "Est-elle citée en premier ou en dernier ?"],
            ["Recommandation explicite", "20 %", "Est-elle conseillée, ou simplement mentionnée ?"],
            ["Sentiment", "10 %", "Le contexte de la mention est-il positif, neutre ou négatif ?"],
          ]}
        />
        <P>
          S’y ajoute la <strong>part de voix</strong> : le rapport entre vos mentions et le total des mentions
          (vous + vos concurrents). C’est souvent l’indicateur le plus parlant en interne — être à 16 % quand deux
          concurrents se partagent 84 % se comprend immédiatement.
        </P>
        <P>
          Une limite doit être posée honnêtement : ces mesures passent par les API officielles des moteurs. Les
          réponses des interfaces grand public peuvent légèrement différer. La mesure reste néanmoins parfaitement
          comparable dans le temps, ce qui est exactement ce qu’on attend d’un indicateur de progression.
        </P>

        <H2>Les erreurs les plus fréquentes</H2>
        <UL
          items={[
            <><strong>Bloquer les crawlers IA « par précaution »</strong> puis s’étonner d’être invisible.</>,
            <><strong>Bourrer les pages de mots-clés</strong> comme en 2010 : les modèles génératifs extraient du sens, pas des occurrences.</>,
            <><strong>Publier du contenu générique produit en masse</strong> : sans faits propres, il n’apporte rien que le modèle ne sache déjà.</>,
            <><strong>Mesurer en tapant soi-même une question dans ChatGPT</strong> : un échantillon de un, non reproductible, sur une session personnalisée.</>,
            <><strong>Ignorer les sources tierces</strong> et ne travailler que son propre site, alors que le chantier citations est celui qui installe durablement la marque.</>,
          ]}
        />

        <Faq items={FAQ} />

        <Sources
          items={[
            { label: "Reuters — ChatGPT franchit les 900 millions d’utilisateurs hebdomadaires (2026)", url: "https://www.reuters.com/" },
            { label: "Alchemer — 2026 Retail Report: Retail AI Adoption Outpaces Consumer Trust", url: "https://www.alchemer.com/resources/benchmark-report/2026-retail-report-ai/" },
            { label: "G2 Research — Half of B2B Software Buyers Now Start Their Research With AI Chatbots (2026)", url: "https://www.prnewswire.com/news-releases/new-g2-research-half-of-b2b-software-buyers-now-start-their-research-with-ai-chatbots-302742807.html" },
            { label: "MarTech — The AI shopping stats 2026", url: "https://martech.org/the-ai-shopping-stats-2026-what-you-need-to-know/" },
          ]}
        />
      </ArticleLayout>
    </>
  );
}
