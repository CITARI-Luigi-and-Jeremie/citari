import { createFileRoute } from "@tanstack/react-router";
import { Article, Chrome, FaqBloc, H2, jsonLdArticle } from "@/components/chrome";
import { euros, fr } from "@/lib/typo";

const FAQ = [
  {
    q: "Peut-on vraiment faire du GEO soi-même ?",
    r: "Oui, sur la partie contenu et technique, si quelqu’un dans l’entreprise dispose de deux à trois jours par mois et d’une bonne plume. La partie citations est la plus longue : c’est un travail de prise de contact source par source.",
  },
  {
    q: "Pourquoi ne pas prendre une agence SEO généraliste ?",
    r: "Beaucoup savent très bien travailler le contenu et les liens, ce qui aide. Le point à vérifier est la mesure : demandez comment la visibilité dans les IA sera mesurée avant et après, sur quel échantillon, et avec quelle méthode.",
  },
  {
    q: "Un outil de monitoring suffit-il ?",
    r: "Il vous dira que vous êtes absent, ce qui est utile, mais il ne produira ni contenu ni citation. C’est un thermomètre, pas un traitement.",
  },
];

const OPTIONS: { titre: string; cout: string; delai: string; pour: string; contre: string; quand: string }[] = [
  {
    titre: "Le faire soi-même",
    cout: "0 € en dépense, 2 à 3 jours par mois en interne",
    delai: "3 à 6 mois",
    pour: "Personne ne connaît le métier mieux que vous, et la matière première du GEO est votre expertise réelle.",
    contre: "La partie citations demande de la constance et un fichier de sources à construire. C’est ce qui est abandonné en premier.",
    quand: "Vous avez un profil rédactionnel en interne et un dirigeant prêt à y consacrer du temps régulièrement.",
  },
  {
    titre: "Un outil de suivi de visibilité IA",
    cout: "80 à 400 € par mois",
    delai: "immédiat pour la mesure, nul pour l’effet",
    pour: "Mesure continue, tableaux de bord, alertes.",
    contre: "Ne produit aucun contenu ni aucune citation. L’abonnement court tant que vous le gardez.",
    quand: "Vous avez déjà une équipe qui exécute et vous manquez seulement d’instrumentation.",
  },
  {
    titre: "Une agence SEO généraliste",
    cout: "1 500 à 4 000 € par mois, engagement de 6 à 12 mois",
    delai: "6 à 12 mois",
    pour: "Compétences solides en contenu et en netlinking, transposables au GEO.",
    contre: "Mesure souvent absente ou approximative sur les moteurs génératifs. Engagement long.",
    quand: "Vous voulez traiter SEO et GEO ensemble et vous acceptez un abonnement.",
  },
  {
    titre: "Un freelance",
    cout: "600 à 2 000 € par mission",
    delai: "1 à 3 mois",
    pour: "Souple, direct, souvent moins cher.",
    contre: "Disponibilité variable, méthodologie de mesure rarement formalisée, peu de continuité à J+90.",
    quand: "Vous savez précisément quoi demander et vous pilotez vous-même.",
  },
  {
    titre: "Le Sprint GEO",
    // « HT » n'est pas un détail : sans lui, un client de bonne foi peut
    // comprendre 2 900 € tout compris et découvrir 580 € de TVA à la facture.
    // La mention figure sur la page d'offre, elle doit figurer partout.
    cout: `${euros(2900)} HT, paiement unique 50/50`,
    delai: "30 jours de mission, mesure à J+90",
    pour: "Mesure avant/après sur un échantillon figé, livrables énumérés à l’avance, aucun abonnement.",
    contre: "Un fondateur seul : le nombre de missions simultanées est limité, et l’agence n’a pas encore d’historique client à montrer.",
    quand: "Vous voulez savoir où vous en êtes, corriger vite, et vérifier l’effet avec la même règle de mesure.",
  },
];

export const Route = createFileRoute("/alternatives-agence-seo")({
  head: () => ({
    meta: [
      { title: "Cinq façons de travailler sa visibilité dans les IA" },
      {
        name: "description",
        content:
          "Le faire soi-même, un outil de suivi, une agence SEO, un freelance ou un sprint GEO : coûts, délais, limites et cas d’usage de chaque option.",
      },
      { property: "og:title", content: "Cinq façons de travailler sa visibilité dans les IA" },
      {
        property: "og:description",
        content: "Comparatif honnête des options, y compris celle de ne pas nous prendre.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: jsonLdArticle(
          "Cinq façons de travailler sa visibilité dans les IA",
          "Comparatif des alternatives pour améliorer sa visibilité dans ChatGPT, Claude, Gemini et Perplexity.",
          "/alternatives-agence-seo",
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
        titre="Quelles sont les alternatives à une agence GEO ?"
        chapeau={fr(
          "Il existe cinq façons de travailler sa visibilité dans les IA : le faire soi-même, s’abonner à un outil de suivi, confier le sujet à une agence SEO généraliste, passer par un freelance, ou commander un sprint dédié. Chacune a un coût, un délai et une limite réelle ; le tableau ci-dessous les donne sans les arranger, y compris pour notre propre offre.",
        )}
        sommaire={[
          ["options", "Les cinq options"],
          ["choisir", "Comment trancher"],
          ["faq", "Questions fréquentes"],
        ]}
      >
        <H2 id="options">Les cinq options</H2>
        {OPTIONS.map((o, i) => (
          <section key={o.titre} className="mt-10 border-t border-ink pt-4">
            <div className="flex items-baseline gap-3">
              <span className="num text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-sans font-semibold text-[28px] leading-none">{o.titre}</h3>
            </div>
            <dl className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {[
                ["coût", o.cout],
                ["délai", o.delai],
                ["ce qui marche", o.pour],
                ["la limite", o.contre],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-xs">{k}</dt>
                  <dd className="mt-0.5 text-[15px] leading-snug text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 max-w-[62ch] border-l-2 border-rule-strong pl-4 text-[15px] leading-snug">
              À choisir quand : {o.quand}
            </p>
          </section>
        ))}

        <H2 id="choisir">Comment trancher</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Posez-vous deux questions. Premièrement : avez-vous du temps interne ? Si oui, le faire soi-même est une option honnête, et ce guide vous donne la méthode. Deuxièmement : avez-vous besoin d’une preuve chiffrée avant/après ? Si oui, exigez un échantillon de questions figé et une mesure répétée, quel que soit le prestataire retenu, y compris nous.",
          )}
        </p>

        <H2 id="faq">Questions fréquentes</H2>
        <FaqBloc items={FAQ} />
      </Article>
    </Chrome>
  );
}
