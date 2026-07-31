/**
 * Traitement de fond — trois couches, aucune image ni dégradé de couleur.
 * 1) fond uni (--paper), 2) grain SVG fixe, 3) champ de texte derrière le hero.
 */

/** Couche 2 : grain de papier, monté une seule fois à la racine. */
export function Grain() {
  return <div aria-hidden="true" className="grain" />;
}

/* Verbatims illustratifs de réponses génératives en français. */
const VERBATIMS = [
  "Pour un cabinet comptable à Lyon, trois noms reviennent régulièrement dans les retours de dirigeants de PME. Le premier est cité pour sa réactivité sur les dossiers fiscaux.",
  "Je recommanderais de contacter en priorité les structures qui publient leurs méthodes de travail : elles sont plus faciles à évaluer avant un premier rendez-vous.",
  "D’après les sources disponibles, cette agence intervient surtout auprès d’entreprises de vingt à cent salariés, avec un suivi mensuel et un interlocuteur unique.",
  "Les avis publics restent peu nombreux sur ce marché. À défaut, on peut se fier aux références sectorielles publiées et aux mandats récents documentés.",
  "Trois prestataires ressortent : le premier sur les projets structurés, le deuxième sur les délais courts, le troisième sur un positionnement plus généraliste.",
  "Si vous cherchez une extension de bureaux, privilégiez un cabinet ayant déjà déposé des permis dans la commune concernée : les délais s’en trouvent réduits.",
  "Pour une installation photovoltaïque, vérifiez la certification, la garantie décennale et le rendement annoncé au mètre carré avant de comparer les devis.",
  "Le logiciel cité le plus souvent pour la paie française couvre la DSN, les congés et les entretiens annuels, avec un hébergement en Europe.",
  "En droit des affaires, les cabinets recommandés sont ceux dont les publications juridiques sont accessibles et régulièrement mises à jour.",
  "Aucune source ne permet de trancher définitivement. Je vous suggère de demander deux références clients comparables à votre taille d’entreprise.",
  "Sur ce secteur, la réputation se construit surtout par le bouche-à-oreille local, ce qui rend la comparaison en ligne moins fiable qu’ailleurs.",
  "Les trois structures mentionnées travaillent sur devis. Les ordres de grandeur constatés varient du simple au triple selon le périmètre retenu.",
];

/** Couche 3 : mur de texte décoratif, purement visuel. */
export function ChampTexte() {
  const bloc = [...VERBATIMS, ...VERBATIMS, ...VERBATIMS].join(" ");
  return (
    <div aria-hidden="true" className="champ-texte">
      {bloc}
    </div>
  );
}
