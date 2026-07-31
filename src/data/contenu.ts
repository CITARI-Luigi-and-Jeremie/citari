export const SECTEURS = [
  "Expertise comptable",
  "Avocats et juridique",
  "Menuiserie et agencement",
  "Agence immobilière",
  "Agence marketing",
  "Éditeur de logiciels",
  "Conseil et stratégie",
  "Architecture",
  "Bâtiment et rénovation",
  "Santé et cliniques",
  "Formation professionnelle",
  "Recrutement",
  "Assurance et courtage",
  "Transport et logistique",
  "Industrie et sous-traitance",
  "Restauration et hôtellerie",
  "Artisanat d’art",
  "Énergie et rénovation énergétique",
  "Sécurité et sûreté",
  "Services informatiques",
  "Autre",
];

export const LANGUES = [
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "en", label: "English" },
];

/* Bloc de preuve : exemples illustratifs. Les noms de concurrents sont FICTIFS. */
export const METIERS = [
  "expert-comptable",
  "avocat en droit des affaires",
  "menuisier",
  "agent immobilier",
  "agence marketing",
  "éditeur de logiciel RH",
  "architecte",
  "installateur de panneaux solaires",
] as const;

export const VILLES = [
  "Lyon",
  "Paris",
  "Bordeaux",
  "Nantes",
  "Lille",
  "Toulouse",
  "Strasbourg",
  "Marseille",
] as const;

export type Metier = (typeof METIERS)[number];

const QUESTIONS: Record<Metier, string> = {
  "expert-comptable": "Quel cabinet comptable choisir à %VILLE% pour une PME de 30 salariés ?",
  "avocat en droit des affaires": "Quel avocat en droit des affaires recommandez-vous à %VILLE% ?",
  menuisier: "Qui fait de la menuiserie sur mesure de qualité à %VILLE% ?",
  "agent immobilier": "Quelle agence immobilière est la plus sérieuse à %VILLE% ?",
  "agence marketing": "Quelle agence marketing B2B choisir à %VILLE% ?",
  "éditeur de logiciel RH": "Quel logiciel RH français pour une entreprise de %VILLE% de 80 salariés ?",
  architecte: "Quel architecte pour une extension de bureaux à %VILLE% ?",
  "installateur de panneaux solaires": "À qui confier une installation photovoltaïque à %VILLE% ?",
};

const FICTIFS: Record<Metier, string[]> = {
  "expert-comptable": ["Cabinet Vaurel & Associés", "Fiduciaire Montbrun", "Chiffres&Cie"],
  "avocat en droit des affaires": ["Cabinet Perrin-Lacaze", "Étude Vareille", "Delmas Avocats Associés"],
  menuisier: ["Ateliers Rouvray", "Menuiserie Castel-Bois", "L’Établi du Faubourg"],
  "agent immobilier": ["Agence Prévost Immobilier", "Clés & Pierres", "Résidences Marnier"],
  "agence marketing": ["Studio Halbran", "Agence Verrière", "Comptoir Média"],
  "éditeur de logiciel RH": ["Palissade RH", "Ekivo", "Sillage Suite"],
  architecte: ["Atelier Bréguet-Noir", "Cabinet Vasseur Architecture", "Forme & Trame"],
  "installateur de panneaux solaires": ["Solaris Vallée", "Toitures Héliane", "Énergie Coteau"],
};

export function exemple(metier: Metier, ville: string) {
  const question = QUESTIONS[metier].replace("%VILLE%", ville);
  const noms = FICTIFS[metier];
  const reponse = `Pour ${metier === "éditeur de logiciel RH" ? "ce besoin" : `un ${metier}`} à ${ville}, trois noms reviennent régulièrement. ${noms[0]} est le plus souvent cité pour son suivi et sa réactivité. ${noms[1]} est apprécié sur les dossiers structurés. ${noms[2]} complète la liste, avec un positionnement plus généraliste. Je recommanderais de contacter ${noms[0]} en premier.`;
  return { question, reponse, concurrents: noms };
}

export const FAQ = [
  {
    q: "Qu’est-ce que le GEO exactement ?",
    r: "Le GEO (Generative Engine Optimization) consiste à faire en sorte qu’une marque soit citée par les IA génératives quand un acheteur leur pose une question d’achat. Là où le SEO vise un classement de liens, le GEO vise une place dans une réponse rédigée qui ne comporte qu’une poignée de noms.",
  },
  {
    q: "Le scan est-il vraiment gratuit et sans inscription ?",
    r: "Oui. Vous renseignez votre marque, votre secteur et jusqu’à trois concurrents, et la mesure démarre. L’email n’est demandé qu’au moment de débloquer le rapport complet, une fois le score affiché.",
  },
  {
    q: "Comment le score est-il calculé ?",
    r: "Sur 100 points : taux de mention pour 50 %, position moyenne dans la réponse pour 20 %, recommandation explicite pour 20 %, sentiment pour 10 %. L’échantillon compte 24 questions d’intention d’achat interrogées sur ChatGPT, Claude, Gemini et Perplexity.",
  },
  {
    q: "Garantissez-vous une amélioration du score ?",
    r: "Non, et c’est volontaire. Nous garantissons les actions livrées : audit technique, cinq contenus rédigés, huit cibles de citation, rapport de fin de sprint, re-scan à J+90. Les moteurs intègrent les changements en 4 à 12 semaines ; personne ne peut honnêtement garantir un chiffre sur cette fenêtre.",
  },
  {
    q: "Utilisez-vous du scraping de ChatGPT ou de Perplexity ?",
    r: "Non. Toutes les mesures passent par les API officielles des éditeurs. Cette limite est rappelée dans chaque rapport : les réponses obtenues ne reproduisent pas exactement l’écran d’un utilisateur connecté.",
  },
  {
    q: "Combien coûte le Sprint GEO et comment se passe le paiement ?",
    r: "2 900 € pour une mission de 30 jours, paiement unique réparti 50 % au lancement et 50 % à la livraison, sans abonnement. L’option Sprint Domination est à 4 900 €.",
  },
  {
    q: "Que se passe-t-il à J+90 ?",
    r: "Nous rejouons exactement les mêmes 24 questions sur les mêmes moteurs et vous recevez un rapport comparatif avant/après. C’est le seul moyen honnête de mesurer un effet.",
  },
];
