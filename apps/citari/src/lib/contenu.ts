/**
 * Données illustratives du site.
 *
 * Portées du projet Lovable de Jérémie le 08/08/2026. Rien ici n'est une
 * mesure : il n'y a pas encore de client, donc pas de résultat réel à montrer.
 * La doctrine d'honnêteté impose que tout exemple soit étiqueté comme tel et
 * que les concurrents portent des noms visiblement fictifs. C'est le cas
 * ci-dessous, et ça doit le rester tant qu'aucun client n'a donné son accord
 * écrit pour publier ses chiffres.
 *
 * Les volumes annoncés sont ceux du scan gratuit réel — 20 questions, 2
 * moteurs, 40 réponses — pour que le spécimen ne promette pas plus que ce que
 * la page d'accueil délivre.
 */

export const SPECIMEN = {
  reference: "N° 0412",
  libelle: "Spécimen de rapport",
  score: 34,
  questions: 20,
  moteurs: 2,
  reponses: 40,
  citation: {
    avant: "Pour une PME à Lyon, je recommande plutôt ",
    marque: "Concurrent A",
    apres: ", qui revient le plus souvent dans les comparatifs du secteur.",
    source: "Réponse reconstituée · aperçu, 2 moteurs interrogés",
  },
  mentions: [
    { nom: "Concurrent A", valeur: 19, vous: false },
    { nom: "Concurrent B", valeur: 12, vous: false },
    { nom: "Cabinet Vaurel", valeur: 2, vous: true },
  ],
  mentionLegale: "Exemple illustratif : entreprise et concurrents fictifs, aucune mesure réelle.",
} as const;
