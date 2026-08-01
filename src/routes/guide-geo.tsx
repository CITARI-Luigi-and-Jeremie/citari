import { createFileRoute } from "@tanstack/react-router";
import { Article, Chrome, FaqBloc, H2, Liste, jsonLdArticle } from "@/components/chrome";
import { fr } from "@/lib/typo";

const FAQ = [
  {
    q: "Le GEO remplace-t-il le SEO ?",
    r: "Non. Le SEO reste nécessaire : les moteurs génératifs s’appuient largement sur des pages indexées. Le GEO ajoute une couche de travail sur la citabilité, les sources tierces et le format des réponses.",
  },
  {
    q: "En combien de temps voit-on un effet ?",
    r: "Entre 4 et 12 semaines. Les modèles et leurs index de recherche n’intègrent pas les changements immédiatement : c’est pourquoi une mesure sérieuse se fait à J+90 sur un échantillon de questions figé.",
  },
  {
    q: "Faut-il bloquer ou autoriser les robots d’IA ?",
    r: "Pour être cité, il faut être lisible. Autorisez explicitement GPTBot, ClaudeBot, PerplexityBot et Google-Extended dans robots.txt, sauf raison contractuelle contraire.",
  },
];

export const Route = createFileRoute("/guide-geo")({
  head: () => ({
    meta: [
      { title: "Le GEO expliqué simplement — guide complet" },
      {
        name: "description",
        content:
          "Le GEO consiste à faire citer une marque par les IA génératives. Comment les moteurs choisissent, les trois chantiers, la méthode de mesure et les erreurs fréquentes.",
      },
      { property: "og:title", content: "Le GEO expliqué simplement — guide complet" },
      {
        property: "og:description",
        content: "Comment les IA choisissent les marques qu’elles citent, et comment y entrer.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: jsonLdArticle(
          "Le GEO expliqué simplement",
          "Guide du Generative Engine Optimization pour dirigeants de PME et ETI.",
          "/guide-geo",
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
        titre="Qu’est-ce que le GEO ?"
        chapeau={
          <>
            {fr(
              "Le GEO (Generative Engine Optimization) est le travail qui consiste à faire citer une marque par les IA génératives (ChatGPT, Claude, Gemini, Perplexity) quand un acheteur leur pose une question d’achat. Il repose sur trois leviers : des contenus qui répondent littéralement aux questions, des citations sur des sources tierces que les moteurs consultent, et une accessibilité technique aux robots de ces moteurs.",
            )}
          </>
        }
        sommaire={[
          ["definition", "Une définition utile"],
          ["choix", "Comment les moteurs choisissent"],
          ["chantiers", "Les trois chantiers"],
          ["mesure", "La méthode de mesure"],
          ["erreurs", "Les erreurs fréquentes"],
          ["faq", "Questions fréquentes"],
        ]}
      >
        <H2 id="definition">Une définition utile</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Une recherche classique renvoie dix liens : le dixième existe encore. Une réponse d’IA cite deux ou trois marques et s’arrête. Il n’y a pas de deuxième page. Le GEO ne cherche donc pas un rang, il cherche une place dans une liste très courte, rédigée par une machine qui a lu et résumé le web à la place de votre prospect.",
          )}
        </p>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Cette différence change la nature du travail. Un bon positionnement SEO ne garantit pas d’être cité : un moteur génératif préfère souvent une page tierce qui compare explicitement des prestataires à la page d’accueil du prestataire lui-même.",
          )}
        </p>

        <H2 id="choix">Comment les moteurs choisissent</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Trois mécanismes se combinent, dans des proportions qui varient d’un moteur à l’autre :",
          )}
        </p>
        <Liste
          items={[
            [
              "La mémoire du modèle",
              "Ce que le modèle a retenu de son entraînement. Lente à bouger, favorable aux marques déjà anciennes et souvent mentionnées.",
            ],
            [
              "La recherche en direct",
              "Le moteur va chercher des pages au moment de la question. Perplexity fonctionne presque entièrement ainsi, et il affiche ses sources : c’est l’angle d’attaque le plus exploitable.",
            ],
            [
              "La forme de la réponse trouvée",
              "Une page qui répond en deux phrases, avec des faits vérifiables et une structure claire, est bien plus facile à citer qu’une plaquette commerciale.",
            ],
          ]}
        />

        <H2 id="chantiers">Les trois chantiers</H2>
        <Liste
          items={[
            [
              "Contenu",
              "Écrire les pages qui répondent aux questions réellement posées, au format réponse directe : les deux premières phrases répondent littéralement au titre. Prix, délais, périmètre, méthode : un moteur cite ce qu’il peut vérifier.",
            ],
            [
              "Citations",
              "Être présent sur les annuaires, comparateurs et médias sectoriels que le moteur consulte. C’est la partie la plus rentable et la plus ingrate : elle se fait à la main, source par source.",
            ],
            [
              "Technique",
              "Autoriser explicitement les robots d’IA, baliser en schema.org, publier un fichier llms.txt, garantir des pages accessibles sans JavaScript. Sans cela, le reste ne sert à rien.",
            ],
          ]}
        />

        <H2 id="mesure">La méthode de mesure</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Sans mesure, le GEO est une opinion. Nous interrogeons six moteurs (ChatGPT, Claude, Gemini, Perplexity, Grok, Le Chat) sur un échantillon de 24 questions d’intention d’achat : 40 % de comparatives, 25 % de questions problème, 20 % de locales, 15 % de confiance. L’échantillon est généré une fois, puis figé.",
          )}
        </p>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Le Score de Visibilité IA pondère quatre indicateurs : taux de mention (50 %), position moyenne dans la réponse (20 %), recommandation explicite (20 %) et sentiment (10 %). La part de voix rapporte vos mentions au total des mentions relevées, concurrents compris. Toutes les mesures passent par les API officielles des éditeurs, jamais par du scraping des interfaces grand public : c’est une limite, elle est écrite dans chaque rapport.",
          )}
        </p>

        <H2 id="erreurs">Les erreurs fréquentes</H2>
        <Liste
          items={[
            ["Bloquer les robots d’IA", "Beaucoup de sites l’ont fait par prudence en 2024, puis ont oublié. On ne peut pas être cité par un moteur auquel on interdit la lecture."],
            ["Mesurer à la main", "Poser trois questions à ChatGPT un mardi matin ne prouve rien : les réponses varient. Il faut un échantillon figé et une répétition dans le temps."],
            ["Écrire pour impressionner", "Les superlatifs ne sont pas citables. Les faits le sont."],
            ["Attendre un effet en deux semaines", "La fenêtre réaliste est de 4 à 12 semaines. Un prestataire qui promet mieux vend autre chose que du GEO."],
          ]}
        />

        <H2 id="faq">Questions fréquentes</H2>
        <FaqBloc items={FAQ} />
      </Article>
    </Chrome>
  );
}
