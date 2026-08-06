/**
 * Le socle partagé, réduit à ce qui sert vraiment.
 *
 * Ce paquet a hébergé un moteur de scan complet, avec ses six fournisseurs, sa
 * détection de mentions, son scoring et son runner. Tout cela parlait le schéma
 * d'avant Lovable et n'aurait jamais tourné contre la vraie base ; ses tests
 * passaient parce qu'ils s'exécutaient sur une base simulée. Supprimé le
 * 06/08/2026, avec le mode démo qui allait avec.
 *
 * Le seul moteur est `apps/citari/src/lib/orchestrateur.server.ts`. Ne pas en
 * reconstruire un ici : l'intérêt du contrôle J+90 est l'écart avec la mesure
 * initiale, et un écart entre deux implémentations ne veut rien dire.
 *
 * Ce qui reste tient en quatre outils, tous utilisés par le toolkit.
 */
export * from "./types";

/** Accès à la base. Toujours la vraie, jamais de simulation. */
export { getDb, unwrap } from "./db";

export { requireEnv, optionalEnv } from "./env";

/** Appel au modèle avec réponse JSON validée, pour les commandes du toolkit. */
export { askClaudeJson, type LLMUsage } from "./llm/json";

/** Extrait le texte d'une page d'accueil, pour l'audit technique. */
export { fetchHomeText } from "./queries/generate";
