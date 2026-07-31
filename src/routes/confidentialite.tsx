import { createFileRoute } from "@tanstack/react-router";
import { Chrome, H2, Liste } from "@/components/chrome";
import { fr } from "@/lib/typo";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — GEO Sprint" },
      {
        name: "description",
        content:
          "Finalités, bases légales, sous-traitants, durées de conservation et droits des personnes concernant les données traitées par GEO Sprint.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Politique de confidentialité — GEO Sprint" },
      { property: "og:description", content: "Traitement des données personnelles, conforme au RGPD." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Chrome>
      <div className="max-w-[72ch] pt-14">
        <h1 className="text-[46px] leading-none sm:text-[62px]">Politique de confidentialité</h1>
        <p className="mt-6 border-t border-ink pt-4 text-[15px] text-ink-2">
          {fr(
            "Traitement des données personnelles au sens du règlement (UE) 2016/679 (RGPD). Responsable de traitement : [À COMPLÉTER : raison sociale], [À COMPLÉTER : adresse]. Contact : [À COMPLÉTER : adresse électronique].",
          )}
        </p>

        <H2 id="finalites">Finalités et bases légales</H2>
        <Liste
          items={[
            [
              "Réaliser le scan gratuit",
              "Traitement du nom de marque, du site, du secteur, de la ville et des concurrents saisis. Base légale : intérêt légitime à fournir le service demandé.",
            ],
            [
              "Limiter les abus",
              "Conservation d’une empreinte technique irréversible de l’adresse IP afin d’appliquer la limite de trois scans par jour. Base légale : intérêt légitime à sécuriser le service.",
            ],
            [
              "Transmettre le rapport et proposer un call",
              "Traitement de l’email, du prénom et éventuellement du téléphone. Base légale : mesures précontractuelles prises à la demande de la personne.",
            ],
            [
              "Relances commerciales",
              "Jusqu’à trois messages liés au rapport demandé. Base légale : intérêt légitime en prospection B2B ; opposition possible à tout moment, la séquence est interrompue dès la première réponse.",
            ],
            [
              "Exécution d’une mission",
              "Données collectées lors du call et pendant le sprint. Base légale : exécution du contrat.",
            ],
          ]}
        />

        <H2 id="sous-traitants">Sous-traitants et destinataires</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Les questions du scan sont transmises aux éditeurs de modèles interrogés. Elles ne contiennent jamais l’email ni les coordonnées du visiteur.",
          )}
        </p>
        <Liste
          items={[
            ["OpenAI (ChatGPT)", "Interrogation du moteur via API officielle. Transfert hors UE encadré par clauses contractuelles types."],
            ["Anthropic (Claude)", "Interrogation du moteur via API officielle. Transfert hors UE encadré par clauses contractuelles types."],
            ["Google (Gemini)", "Interrogation du moteur via API officielle. Transfert hors UE encadré par clauses contractuelles types."],
            ["Perplexity", "Interrogation du moteur via API officielle. Transfert hors UE encadré par clauses contractuelles types."],
            ["Supabase", "Hébergement de la base de données (scans, rapports, prospects, clients)."],
            ["Resend", "Acheminement des emails de transmission de rapport et de relance."],
            ["[À COMPLÉTER]", "Hébergeur du site."],
          ]}
        />

        <H2 id="durees">Durées de conservation</H2>
        <Liste
          items={[
            ["Scans, questions et réponses", "24 mois à compter du scan, pour permettre la comparaison à J+90 et au-delà."],
            ["Empreinte technique de l’adresse IP", "12 mois."],
            ["Prospects non convertis", "36 mois à compter du dernier contact."],
            ["Clients", "Durée de la relation contractuelle, puis 10 ans pour les pièces comptables (obligation légale)."],
          ]}
        />

        <H2 id="droits">Vos droits</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Ces droits s’exercent par simple message à [À COMPLÉTER : adresse électronique] ; une réponse est apportée sous un mois. Vous pouvez introduire une réclamation auprès de la CNIL, 3 place de Fontenoy, 75007 Paris.",
          )}
        </p>

        <H2 id="cookies">Cookies</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Le site ne dépose aucun cookie publicitaire ni traceur tiers de mesure d’audience. Seuls des cookies strictement nécessaires au fonctionnement peuvent être utilisés ; ils ne requièrent pas de consentement préalable.",
          )}
        </p>

        <H2 id="decision">Absence de décision automatisée</H2>
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-2">
          {fr(
            "Le score de visibilité est un indicateur calculé à partir des réponses collectées. Il ne produit aucun effet juridique et ne constitue pas une décision automatisée au sens de l’article 22 du RGPD.",
          )}
        </p>
      </div>
    </Chrome>
  );
}
