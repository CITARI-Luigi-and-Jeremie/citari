import { createFileRoute } from "@tanstack/react-router";
import { Chrome, H2, Liste } from "@/components/chrome";
import { fr } from "@/lib/typo";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — GEO Sprint" },
      {
        name: "description",
        content:
          "Éditeur, directeur de la publication, hébergeur et conditions d’utilisation du site GEO Sprint, conformément à l’article 6 III de la LCEN.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Mentions légales — GEO Sprint" },
      { property: "og:description", content: "Informations légales de l’éditeur du site." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Chrome>
      <div className="max-w-[72ch] pt-14">
        <h1 className="text-[46px] leading-none sm:text-[62px]">Mentions légales</h1>
        <p className="mt-6 border-t border-ink pt-4 text-[15px] text-ink-2">
          {fr(
            "Informations publiées en application de l’article 6 III de la loi nº 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).",
          )}
        </p>

        <H2 id="editeur">Éditeur du site</H2>
        <Liste
          items={[
            ["Dénomination", "GEO Sprint — [À COMPLÉTER : forme juridique et raison sociale]"],
            ["Adresse du siège", "[À COMPLÉTER]"],
            ["SIRET", "[À COMPLÉTER]"],
            ["RCS", "[À COMPLÉTER : ville et numéro d’immatriculation]"],
            ["Capital social", "[À COMPLÉTER]"],
            ["TVA intracommunautaire", "[À COMPLÉTER]"],
            ["Adresse électronique", "[À COMPLÉTER]"],
            ["Téléphone", "[À COMPLÉTER]"],
          ]}
        />

        <H2 id="publication">Directeur de la publication</H2>
        <Liste items={[["Responsable", "[À COMPLÉTER : nom du fondateur]"]]} />

        <H2 id="hebergeur">Hébergeur</H2>
        <Liste
          items={[
            ["Raison sociale", "[À COMPLÉTER]"],
            ["Adresse", "[À COMPLÉTER]"],
            ["Téléphone", "[À COMPLÉTER]"],
          ]}
        />

        <H2 id="propriete">Propriété intellectuelle</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "L’ensemble des contenus du site — textes, méthode de mesure, mise en page, rapports produits — est protégé par le droit d’auteur. Toute reproduction, même partielle, est soumise à autorisation préalable de l’éditeur.",
          )}
        </p>

        <H2 id="exemples">Exemples et marques citées</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Les réponses d’IA présentées sur ce site à titre d’illustration sont signalées comme des exemples, et les noms d’entreprises qui y figurent sont fictifs. Toute ressemblance avec une entreprise existante serait fortuite. Les noms ChatGPT, Claude, Gemini et Perplexity sont des marques de leurs éditeurs respectifs, cités à titre purement descriptif.",
          )}
        </p>

        <H2 id="responsabilite">Limitation de responsabilité</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Les mesures publiées reposent sur les API officielles des éditeurs de modèles. Elles ne reproduisent pas exactement l’affichage d’un utilisateur connecté à l’interface grand public et peuvent varier dans le temps. Elles constituent une indication, non une garantie de résultat commercial.",
          )}
        </p>
      </div>
    </Chrome>
  );
}
