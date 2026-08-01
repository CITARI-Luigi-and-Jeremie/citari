/** Modèle de checklist des 30 jours (§6 du cahier des charges), créé pour chaque sprint. */
export const SPRINT_CHECKLIST: { week: number; label: string }[] = [
  // Semaine 1
  { week: 1, label: "Call de cadrage — collecte des données client (prix, différenciateurs, chiffres)" },
  { week: 1, label: "Lancer `pnpm toolkit audit-technique <url>`" },
  { week: 1, label: "Lancer `pnpm toolkit generate-fixes <client>`" },
  { week: 1, label: "Validation + pose des fixes techniques (robots.txt, llms.txt, schema.org)" },
  { week: 1, label: "Lancer `pnpm toolkit verify-fixes <client>` — CONFIRMER que les correctifs sont en ligne" },
  { week: 1, label: "Demander au client un export des logs d'accès (format combiné) pour la mesure des crawlers" },
  { week: 1, label: "Lancer `pnpm toolkit content-brief <client>`" },
  { week: 1, label: "Validation des sujets de contenu avec le client" },
  // Semaine 2
  { week: 2, label: "`draft-content` × 2-3 premiers contenus" },
  { week: 2, label: "Relecture / enrichissement des brouillons" },
  { week: 2, label: "Livraison des premiers contenus" },
  { week: 2, label: "Lancer `pnpm toolkit citation-targets <client>`" },
  { week: 2, label: "Premières inscriptions annuaires" },
  // Semaine 3
  { week: 3, label: "`draft-content` × 2-3 contenus restants" },
  { week: 3, label: "Pitchs presse envoyés" },
  { week: 3, label: "Suivi des inscriptions annuaires" },
  // Semaine 4
  { week: 4, label: "Relances citations externes" },
  { week: 4, label: "Lancer `pnpm toolkit verify-fixes <client>` — vérification technique finale" },
  { week: 4, label: "Lancer `pnpm toolkit crawler-log <client> <logs>` — preuve du passage des crawlers IA" },
  { week: 4, label: "Lancer `pnpm toolkit sprint-report <client>` (rapport de fin de sprint) puis l'envoyer au client" },
  { week: 4, label: "Programmation du re-scan J+90" },
];
