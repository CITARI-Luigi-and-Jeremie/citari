import type { Metadata } from "next";
import { ArticleLayout, articleJsonLd, Faq, H2, H3, P, Sources, Table, UL } from "@/lib/content";

const TITLE = "GEO vs SEO : quelles différences, et faut-il choisir ?";
const DESCRIPTION =
  "Comparatif factuel entre le SEO (référencement Google) et le GEO (visibilité dans ChatGPT, Claude, Gemini, Perplexity) : objectifs, leviers, mesure, délais et budget.";
const UPDATED = "2026-07-30";

export const metadata: Metadata = {
  title: `${TITLE} | GEO Sprint`,
  description: DESCRIPTION,
  alternates: { canonical: "/geo-vs-seo" },
};

const FAQ = [
  {
    q: "Faut-il arrêter le SEO pour faire du GEO ?",
    a: "Non. Les deux se renforcent : les moteurs génératifs s'appuient sur des pages web indexées et sur des sources tierces bien référencées. Un bon SEO facilite le GEO. L'inverse est vrai aussi, puisque les contenus factuels et structurés produits pour le GEO performent bien en recherche classique.",
  },
  {
    q: "Mon agence SEO fait-elle déjà du GEO ?",
    a: "Rarement de façon complète. Trois points sortent du périmètre SEO habituel : l'autorisation explicite des crawlers IA dans le robots.txt, la mesure de la visibilité dans les réponses génératives elles-mêmes, et le travail sur les sources tierces que les moteurs citent. Demandez à votre prestataire s'il mesure vos mentions dans ChatGPT ou Perplexity : la réponse est éclairante.",
  },
  {
    q: "Le GEO coûte-t-il plus cher que le SEO ?",
    a: "Non, il coûte différemment. Le SEO est un abonnement mensuel qui court sur des années. Le GEO se prête bien à une mission courte et intense : la majeure partie de la valeur vient de correctifs techniques ponctuels et d'un socle de contenus factuels, tous deux durables. Notre Sprint GEO est un paiement unique de 2 900 €.",
  },
  {
    q: "Comment savoir si je suis déjà visible dans les IA ?",
    a: "Il faut poser un échantillon stable de questions d'achat aux différents moteurs, via leurs API, et compter les mentions — la vôtre et celles de vos concurrents. Taper une question dans ChatGPT ne suffit pas : la réponse varie d'une session à l'autre et votre historique la personnalise. Notre scan gratuit fait cette mesure sur 20 à 30 requêtes et 4 moteurs.",
  },
];

export default function GeoVsSeoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd({ title: TITLE, description: DESCRIPTION, slug: "/geo-vs-seo", updated: UPDATED })),
        }}
      />
      <ArticleLayout
        title={TITLE}
        updated="30 juillet 2026"
        answer="Le SEO vise à faire apparaître vos pages dans une liste de résultats Google ; le GEO vise à faire citer votre marque dans une réponse rédigée par une IA. Il ne faut pas choisir : le GEO s'appuie sur les fondations du SEO, mais ajoute trois leviers que le SEO classique ne traite pas — l'accès des crawlers IA, les contenus en format « réponse directe » et les sources tierces que les moteurs citent."
      >
        <H2>La différence de fond : une liste contre une réponse</H2>
        <P>
          En SEO, l'utilisateur voit dix résultats et choisit. Être troisième reste utile. En GEO, l'utilisateur
          reçoit une réponse qui cite deux ou trois marques : il n'y a pas de troisième page, pas de « longue
          traîne de clics ». On est dans la réponse ou on n'existe pas.
        </P>
        <P>
          Cette bascule change la nature du travail. Le SEO optimise une page pour un mot-clé et une position. Le
          GEO travaille la <strong>probabilité qu'un modèle cite votre marque</strong> quand on lui pose une
          question d'achat — ce qui dépend autant de ce que dit votre site que de ce que disent les autres sites
          sur vous.
        </P>

        <H2>Comparatif point par point</H2>
        <Table
          head={["", "SEO", "GEO"]}
          rows={[
            ["Objectif", "Se positionner dans une liste de résultats", "Être cité dans une réponse rédigée"],
            ["Moteurs visés", "Google, Bing", "ChatGPT, Claude, Gemini, Perplexity"],
            ["Unité de mesure", "Position sur un mot-clé, trafic organique", "Taux de mention, position dans la réponse, part de voix"],
            ["Cible technique", "Indexation, vitesse, maillage, Core Web Vitals", "Accès des crawlers IA, llms.txt, schema.org, structure « réponse directe »"],
            ["Contenu qui gagne", "Pages complètes couvrant un champ sémantique", "Réponses factuelles, chiffrées, comparatives, directement citables"],
            ["Rôle des sources tierces", "Backlinks (autorité de domaine)", "Citations et mentions (le moteur y puise ses réponses)"],
            ["Délai d'effet", "3 à 12 mois", "4 à 12 semaines"],
            ["Format d'intervention", "Abonnement mensuel au long cours", "Mission courte, socle durable, mesure à J+90"],
            ["Garantie possible", "Aucune sur la position", "Aucune sur le score — seulement sur les actions livrées"],
          ]}
        />

        <H2>Ce que le SEO apporte déjà au GEO</H2>
        <P>
          Trois acquis SEO se transposent directement, et c'est une bonne nouvelle si vous avez déjà investi :
        </P>
        <UL
          items={[
            <><strong>L'indexabilité.</strong> Un site propre, rapide et bien maillé est plus facilement exploité par les robots des IA.</>,
            <><strong>L'autorité.</strong> Les backlinks de qualité proviennent souvent des mêmes sources que celles que les moteurs génératifs citent — presse, comparateurs, annuaires sérieux.</>,
            <><strong>Les données structurées.</strong> Le balisage schema.org déjà en place pour les rich snippets sert aussi à la compréhension par les modèles.</>,
          ]}
        />

        <H2>Ce que le SEO ne couvre pas</H2>
        <H3>1. L'autorisation explicite des crawlers IA</H3>
        <P>
          Beaucoup de sites ont bloqué GPTBot, ClaudeBot ou PerplexityBot en 2023-2024, par précaution ou via un
          réglage de leur CMS, et ne l'ont jamais réexaminé. Le SEO n'en parle pas : Googlebot, lui, passe
          toujours. Résultat, des sites parfaitement référencés sont totalement absents des réponses IA.
        </P>
        <H3>2. Le format « réponse directe »</H3>
        <P>
          Une page SEO classique déroule une introduction, un contexte, puis la réponse. Un modèle génératif, lui,
          extrait le passage qui répond littéralement à la question. Placer la réponse en tête, en deux phrases,
          avec un titre formulé comme une question, change matériellement la citabilité — sans nuire au SEO.
        </P>
        <H3>3. La mesure elle-même</H3>
        <P>
          Aucun outil SEO classique ne vous dit si ChatGPT recommande votre concurrent plutôt que vous sur « quel
          prestataire choisir pour X ». C'est pourtant l'information qui déclenche la décision en interne : voir la
          réponse réelle, avec le nom du concurrent dedans, vaut tous les rapports de positionnement.
        </P>

        <H2>Faut-il un budget séparé ?</H2>
        <P>
          Dans la pratique, non — mais l'effort n'a pas la même forme. Le SEO est une course de fond qui se paie
          au mois. Le GEO ressemble davantage à une mise à niveau : une part importante du travail consiste en
          correctifs techniques ponctuels et en un socle de contenus factuels qui restent valables longtemps.
          D'où notre format en sprint de 30 jours, à paiement unique, plutôt qu'un abonnement.
        </P>
        <P>
          La bonne séquence pour une PME : mesurer d'abord (le scan est gratuit), corriger le technique, publier
          quatre à six contenus qui répondent aux questions où vous êtes absent, installer trois à cinq citations
          externes, puis re-mesurer à 90 jours avec les mêmes questions. Si le SEO tourne déjà, il continue en
          parallèle : les deux chantiers se nourrissent.
        </P>

        <Faq items={FAQ} />

        <Sources
          items={[
            { label: "Alchemer — 2026 Retail Report: Retail AI Adoption Outpaces Consumer Trust", url: "https://www.alchemer.com/resources/benchmark-report/2026-retail-report-ai/" },
            { label: "G2 Research — Half of B2B Software Buyers Now Start Their Research With AI Chatbots (2026)", url: "https://www.prnewswire.com/news-releases/new-g2-research-half-of-b2b-software-buyers-now-start-their-research-with-ai-chatbots-302742807.html" },
          ]}
        />
      </ArticleLayout>
    </>
  );
}
