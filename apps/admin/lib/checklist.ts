/**
 * Checklist des 90 jours, créée pour chaque sprint à la conversion du lead.
 * C'est l'encodage exécutable de docs/LIVRAISON.md : si les deux divergent,
 * c'est LIVRAISON.md qui fait foi et cette liste qu'on corrige.
 *
 * `week` 1-4 = le sprint de 30 jours. `week` 5 = l'après (J+45 et J+90).
 */
export const SPRINT_CHECKLIST: { week: number; label: string }[] = [
  // Semaine 1 — technique : rendre le site lisible
  { week: 1, label: "Call de cadrage 1 h — accès site, panier moyen, chiffres clés (→ client_data)" },
  { week: 1, label: "Lancer `pnpm toolkit audit-technique <url> --client <client>`" },
  { week: 1, label: "Lancer `pnpm toolkit generate-fixes <client>`" },
  { week: 1, label: "Poser les correctifs (ou envoyer le cahier de specs au développeur du client)" },
  { week: 1, label: "Lancer `pnpm toolkit verify-fixes <client>` — CONFIRMER que tout est en ligne" },
  { week: 1, label: "Verrouiller l'entité : fiche Wikidata, sameAs, nom-adresse-téléphone identiques partout" },
  { week: 1, label: "Demander au client l'export des logs serveur (format combiné) pour crawler-log" },
  { week: 1, label: "Lancer `pnpm toolkit prioriser <client>` — les questions gagnables avant J+90" },
  { week: 1, label: "Lancer `pnpm toolkit content-brief <client>` puis valider les 5 sujets avec le client" },
  { week: 1, label: "Vendredi : email de preuve n°1" },
  // Semaine 2 — contenu + citations lancées
  { week: 2, label: "`draft-content` × 2-3 premiers contenus, combler les [À COMPLÉTER] avec les vrais chiffres" },
  { week: 2, label: "Relecture client puis publication des premiers contenus" },
  { week: 2, label: "Lancer `pnpm toolkit indexnow <client> <urls>` sur chaque contenu publié" },
  { week: 2, label: "Lancer `pnpm toolkit citation-targets <client>`" },
  { week: 2, label: "Premières inscriptions annuaires + fiches (Google Business, comparateurs)" },
  { week: 2, label: "Remettre au client le kit « 10 avis en 30 jours »" },
  { week: 2, label: "Vendredi : email de preuve n°2" },
  // Semaine 3 — le reste du contenu, placement ciblé
  { week: 3, label: "`draft-content` × contenus restants, publication, `indexnow`" },
  { week: 3, label: "Placement ciblé : contacter les classements que les moteurs citent déjà" },
  { week: 3, label: "Pitchs presse envoyés" },
  { week: 3, label: "Lancer `pnpm toolkit crawler-log <client> <logs>` — les robots passent-ils ?" },
  { week: 3, label: "Vendredi : email de preuve n°3" },
  // Semaine 4 — preuves et clôture
  { week: 4, label: "Relances presse et citations" },
  { week: 4, label: "Lancer `pnpm toolkit verify-contents <client> <urls>` — contenus en ligne, balisés, dans llms.txt" },
  { week: 4, label: "Lancer `pnpm toolkit verify-citations <client>` — la marque figure vraiment sur les cibles" },
  { week: 4, label: "Lancer `pnpm toolkit verify-fixes <client>` — vérification technique finale" },
  { week: 4, label: "Lancer `pnpm toolkit sprint-report <client>` puis call de clôture et envoi du rapport" },
  { week: 4, label: "Vendredi : email de preuve n°4 (le rapport)" },
  // Après le sprint — la fenêtre des 90 jours continue
  { week: 5, label: "J+45 : lancer `pnpm toolkit controle-45 <client>` (interne, jamais montré au client)" },
  { week: 5, label: "J+45 : si rien ne bouge sur les moteurs à recherche, réorienter les citations" },
  { week: 5, label: "J+90 : lancer le re-scan (mêmes 24 questions) puis call de restitution avant/après" },
  { week: 5, label: "J+90 : proposer la suite (Vigie ou second sprint selon la décision prise)" },
];
