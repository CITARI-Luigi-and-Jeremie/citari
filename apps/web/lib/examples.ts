/**
 * Illustrations sectorielles du bloc de preuve.
 *
 * ⚠ Les noms de concurrents sont FICTIFS et signalés comme tels à l'écran.
 * On n'utilise jamais le nom d'une entreprise réelle dans une mise en scène :
 * ce serait à la fois trompeur et juridiquement risqué.
 */
export interface Example {
  /** Le métier, tel que le dirigeant le dirait. */
  trade: string;
  /** Le mot qui désigne son entreprise. */
  noun: string;
  question: (city: string) => string;
  rivals: [string, string];
  answer: (city: string, a: string, b: string) => string;
}

export const CITIES = ["Lyon", "Paris", "Bordeaux", "Lille", "Marseille", "Nantes", "Toulouse", "Strasbourg"];

export const EXAMPLES: Example[] = [
  {
    trade: "cabinet comptable",
    noun: "cabinet",
    question: (c) => `Quel cabinet comptable choisir à ${c} ?`,
    rivals: ["Cabinet Rivière & Associés", "Fiducia Conseil"],
    answer: (c, a, b) =>
      `Pour une PME à ${c}, ${a} revient souvent : bonne réputation sur les dossiers de croissance. ${b} est également cité pour son accompagnement juridique. Les deux proposent un premier rendez-vous gratuit.`,
  },
  {
    trade: "menuisier",
    noun: "atelier",
    question: (c) => `Quel menuisier choisir pour des fenêtres à ${c} ?`,
    rivals: ["Menuiseries Auvray", "Atelier du Chêne"],
    answer: (c, a, b) =>
      `À ${c}, ${a} est régulièrement recommandé pour la pose sur mesure et le respect des délais. ${b} est cité pour ses menuiseries bois traditionnelles. Comptez un devis gratuit sous une semaine chez les deux.`,
  },
  {
    trade: "agence immobilière",
    noun: "agence",
    question: (c) => `Quelle agence immobilière choisir à ${c} ?`,
    rivals: ["Horizon Immobilier", "Agence Belvédère"],
    answer: (c, a, b) =>
      `Sur le marché de ${c}, ${a} est fréquemment mentionnée pour son estimation gratuite et sa connaissance des quartiers. ${b} ressort sur les biens de standing. Vérifiez les honoraires, qui varient sensiblement.`,
  },
  {
    trade: "cabinet d’avocats",
    noun: "cabinet",
    question: (c) => `Quel avocat en droit du travail à ${c} ?`,
    rivals: ["Cabinet Lauren & Marchand", "SELARL Vallois"],
    answer: (c, a, b) =>
      `À ${c}, ${a} est souvent cité en droit social côté employeur. ${b} intervient plutôt côté salarié. Les deux proposent un premier entretien d’évaluation payant, déductible en cas de mission.`,
  },
  {
    trade: "agence marketing",
    noun: "agence",
    question: (c) => `Quelle agence marketing pour une PME à ${c} ?`,
    rivals: ["Studio Kaleido", "Agence Nord-Ouest"],
    answer: (c, a, b) =>
      `Pour une PME à ${c}, ${a} revient souvent sur les missions d’acquisition. ${b} est cité pour la refonte de marque. Demandez systématiquement le détail des livrables mensuels avant de vous engager.`,
  },
  {
    trade: "éditeur de logiciel",
    noun: "logiciel",
    question: () => `Quel logiciel de gestion pour une PME industrielle ?`,
    rivals: ["Optima Suite", "Novaflux"],
    answer: (_c, a, b) =>
      `${a} est souvent recommandé pour la gestion de production en PME, avec un déploiement en quelques semaines. ${b} est cité pour sa souplesse de paramétrage. Les deux proposent une démonstration gratuite.`,
  },
  {
    trade: "cabinet de recrutement",
    noun: "cabinet",
    question: (c) => `Quel cabinet de recrutement à ${c} ?`,
    rivals: ["Talents & Cie", "Cabinet Vermeil"],
    answer: (c, a, b) =>
      `À ${c}, ${a} est régulièrement cité sur les profils cadres. ${b} ressort sur les fonctions techniques. Les honoraires se situent le plus souvent entre 15 et 25 % du salaire annuel brut.`,
  },
  {
    trade: "restaurant",
    noun: "restaurant",
    question: (c) => `Où bien déjeuner à ${c} pour un repas d’affaires ?`,
    rivals: ["La Table du Marché", "Maison Ferrand"],
    answer: (c, a, b) =>
      `À ${c}, ${a} est souvent proposé pour les déjeuners professionnels : service rapide et salle au calme. ${b} est cité pour sa cuisine de saison. Réservation conseillée en semaine.`,
  },
];
