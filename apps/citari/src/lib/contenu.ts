/**
 * Données illustratives du site.
 *
 * Portées du projet Lovable de Jérémie, version du 14/08/2026. Rien ici n'est
 * une mesure : il n'y a pas encore de client, donc pas de résultat réel à
 * montrer. La doctrine d'honnêteté impose que tout exemple soit étiqueté comme
 * tel et que les concurrents portent des noms visiblement fictifs.
 *
 * Le spécimen montre désormais un extrait du rapport du DIAGNOSTIC (24
 * questions × 6 moteurs = 144 réponses) : ce sont les volumes réels de ce que
 * la visio remet, pas des chiffres d'ambiance.
 */

export const SPECIMEN = {
  reference: "PAGE 1 / 9",
  libelle: "EXEMPLE · RAPPORT DU DIAGNOSTIC",
  score: 34,
  questions: 24,
  moteurs: 6,
  reponses: 144,
  mentions: [
    { nom: "Concurrent A", valeur: 19, part: 100, vous: false },
    { nom: "Concurrent B", valeur: 12, part: 63, vous: false },
    { nom: "Vous", valeur: 2, part: 10, vous: true },
  ],
  pointsLabel: "LE DIAGNOSTIC VÉRIFIE",
  points: [
    {
      label: "Que répondent les 6 moteurs quand un client cherche votre métier ?",
      valeur: "144 réponses",
    },
    { label: "Où vont-ils chercher avant de prononcer un nom ?", valeur: "sources listées" },
    { label: "Peuvent-ils seulement entrer sur votre site ?", valeur: "4 robots contrôlés" },
    { label: "Que racontent-ils sur vous quand on leur donne votre nom ?", valeur: "6 moteurs" },
    { label: "Par quoi commencer ?", valeur: "3 corrections" },
  ],
  mentionLegale: "Exemple illustratif : entreprise et concurrents fictifs, aucune mesure réelle.",
} as const;
