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
  libelle: "EXEMPLE · RAPPORT DU SCAN PREMIUM",
  score: 34,
  questions: 24,
  moteurs: 6,
  reponses: 144,
  mentions: [
    { nom: "Concurrent A", valeur: 19, part: 100, vous: false },
    { nom: "Concurrent B", valeur: 12, part: 63, vous: false },
    { nom: "Vous", valeur: 2, part: 10, vous: true },
  ],
  // « OFFERT » : le diagnostic complet est à 0 €, la landing ne le disait
  // qu'en bas de page. Un mot, et la promesse change de nature.
  pointsLabel: "LE SCAN PREMIUM OFFERT VÉRIFIE",
  points: [
    {
      label: "Sur quelles questions d'achat votre nom ne sort-il pas ?",
      valeur: "144 réponses",
    },
    { label: "Où les IA vont-elles chercher avant de citer un nom ?", valeur: "les sites exacts" },
    { label: "Le robot de ChatGPT peut-il seulement entrer sur votre site ?", valeur: "4 robots testés" },
    // « une par moteur » et non « 6 moteurs » : un moteur en panne est exclu
    // du miroir comme du score, promettre un nombre fixe serait faux.
    { label: "Quelle fiche les IA récitent-elles sur vous ?", valeur: "une par moteur" },
    // Le générateur produit DIX actions classées (moteurs.server.ts), pas
    // trois : le spécimen sous-vendait ce qui est réellement livré.
    { label: "Par quoi commencer, et que pouvez-vous faire sans nous ?", valeur: "10 actions classées" },
  ],
  mentionLegale: "Exemple illustratif : entreprise et concurrents fictifs, aucune mesure réelle.",
} as const;
