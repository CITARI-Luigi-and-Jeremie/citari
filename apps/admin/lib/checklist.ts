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
  // ── Phase 5 (J31-J45) — Maturation ──
  // Les moteurs mettent 4 à 12 semaines à intégrer. Ici on ne crée plus, on
  // fait aboutir : les pitchs envoyés en S3 reçoivent leurs réponses, les
  // inscriptions se valident, et on vérifie que rien n'a été écrasé.
  { week: 5, label: "J+35 : 2e relance des pitchs presse restés sans réponse" },
  { week: 5, label: "J+35 : vérifier la validation des inscriptions annuaires (2 à 4 semaines de délai)" },
  { week: 5, label: "J+40 : `verify-fixes` — un redéploiement du client a-t-il écrasé les correctifs ?" },
  { week: 5, label: "J+40 : point avis avec le client — combien collectés sur les 10 visés ?" },
  { week: 5, label: "Email de preuve mensuel n°1" },
  // ── Phase 6 (J45-J60) — Contrôle et correction de trajectoire ──
  // Le seul moment où l'on peut encore infléchir le résultat du J+90.
  { week: 6, label: "J+45 : lancer `pnpm toolkit controle-45 <client>` (interne, jamais montré au client)" },
  { week: 6, label: "J+45 : les 3 moteurs à recherche ont-ils bougé ? Comparer au scan initial" },
  { week: 6, label: "J+45 : si plat, diagnostiquer — robots bloqués ? contenus non indexés ? citations non obtenues ?" },
  { week: 6, label: "J+50 : `crawler-log` #2 — comparer les passages de robots avec la mesure de S3" },
  { week: 6, label: "J+55 : si plat, réorienter — nouvelles cibles de citation, `indexnow` relancé, contenu additionnel" },
  // ── Phase 7 (J60-J75) — Consolidation ──
  // Ce qui a été obtenu peut disparaître : une fiche supprimée, une page
  // déplacée. On vérifie que les acquis tiennent avant la mesure finale.
  { week: 7, label: "J+65 : `verify-citations` #2 — les citations obtenues tiennent-elles toujours ?" },
  { week: 7, label: "J+65 : `verify-contents` #2 — contenus toujours en ligne, balisés, dans llms.txt ?" },
  { week: 7, label: "J+70 : dernière vague de relances presse (au-delà, le J+90 ne les verra pas)" },
  { week: 7, label: "J+70 : relancer le kit avis si moins de 5 collectés" },
  { week: 7, label: "Email de preuve mensuel n°2" },
  // ── Phase 8 (J75-J90) — La mesure finale ──
  { week: 8, label: "J+80 : préparer le comparatif avant/après (relire le rapport de fin de sprint)" },
  { week: 8, label: "J+90 : lancer le re-scan (mêmes 24 questions, mêmes 6 moteurs)" },
  { week: 8, label: "J+90 : call de restitution avant/après, y compris si le résultat est mauvais" },
  { week: 8, label: "J+90 : proposer la suite (Vigie ou second sprint selon la décision prise)" },
];
