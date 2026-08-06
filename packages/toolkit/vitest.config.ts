import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * L'alias « @ » du site, résolu pour les tests.
 *
 * Les règles qui décident de ce qu'on facture à un client vivent dans
 * `apps/citari/src/lib/` : la formule du score, la détection de marque, le
 * regroupement des variantes. Elles n'étaient pas testables d'ici, faute de
 * résoudre `@/`, si bien que les tests en recopiaient le code. Une copie ne
 * teste rien : elle se contente de vérifier qu'elle est d'accord avec
 * elle-même, et elle diverge en silence dès que l'original bouge.
 *
 * Cet alias fait pointer `@` sur les sources du site, ce qui permet d'importer
 * le VRAI code. Deux conditions le rendent possible sans base ni clé :
 * `score.ts` ne dépend que de `typo.ts`, qui n'importe rien ; et le client
 * Supabase de `client.server.ts` est construit paresseusement derrière un
 * Proxy, donc l'importer n'ouvre aucune connexion.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../apps/citari/src", import.meta.url)),
    },
  },
});
