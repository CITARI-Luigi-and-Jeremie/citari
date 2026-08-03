/**
 * Prospects issus du baromètre : scannés, mais pas encore contactables.
 *
 * `scan-lot` mesure des entreprises qui n'ont rien demandé. Elles entrent au
 * pipeline comme prospects, sans email réel. Deux marqueurs les distinguent
 * d'un lead entrant, et les deux comptent : le statut les sort des sélections
 * de relance, et l'adresse fictive sert de dernier filet côté envoi.
 */

/** Suffixe de l'adresse fictive posée tant que le vrai contact est inconnu. */
export const EMAIL_A_TROUVER = "@barometre.local";

/** Statut d'un prospect démarché, distinct de « nouveau » qui signifie « a demandé un scan ». */
export const STATUT_PROSPECT = "prospect";
