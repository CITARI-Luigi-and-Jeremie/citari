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
    q: "C’est du SEO ?",
    r: "Non. Le SEO vous place dans une liste de liens. Ici, il s’agit d’être cité dans une réponse rédigée. Les signaux que lisent les IA ne sont pas ceux que lit Google : le travail est différent.",
  },
  {
    q: "Pourquoi maintenant ?",
    r: "Parce que 46 % des utilisateurs d’IA démarrent déjà leur recherche d’achat directement sur une IA (Alchemer 2026, G2 Research 2026, Reuters). Les modèles apprennent lentement et retiennent longtemps : ceux qui s’installent aujourd’hui dans les réponses y resteront des années. Ceux qui attendent devront déloger quelqu’un.",
  },

  {
    q: "Vous garantissez un résultat ?",
    r: "Non, et méfiez-vous de ceux qui le promettent. Nous garantissons des actions précises, listées à l’avance, et une mesure honnête avant/après. Les moteurs mettent 4 à 12 semaines à intégrer les changements.",
  },
  {
    q: "Combien de temps ça me prend, à moi ?",
    r: "Un call de cadrage d’une heure au départ, un call de validation en cours de route. Le reste, c’est nous.",
  },
  {
    q: "Et si mon site est fait par une agence ?",
    r: "Nous livrons soit les modifications directement, soit un cahier de spécifications que votre agence applique. Les deux fonctionnent.",
  },
  {
    q: "Vous travaillez avec mes concurrents ?",
    r: "Un seul client par secteur et par zone. Le premier arrivé bloque la place.",
  },
  {
    q: "Le scan est-il vraiment gratuit ?",
    r: "Oui, et sans carte bancaire. Vous renseignez votre marque, votre email professionnel, votre secteur et jusqu’à trois concurrents, et la mesure démarre. L’email sert à vous envoyer le rapport et à vous recontacter ; vous pouvez vous désinscrire en un clic dans chaque message.",
  },
  {
    q: "Comment le score est-il calculé ?",
    r: "Sur 100 points : taux de mention pour 50 %, position moyenne dans la réponse pour 20 %, recommandation explicite pour 20 %, sentiment pour 10 %. L’échantillon compte 24 questions d’intention d’achat interrogées sur ChatGPT, Claude, Gemini, Perplexity, Grok et Le Chat, soit 144 réponses, via les API officielles des éditeurs, jamais par scraping.",
  },
];
