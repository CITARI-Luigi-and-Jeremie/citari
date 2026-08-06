import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Les modèles interrogés sont figés, et ce test le fait respecter.
 *
 * Le modèle fait partie de la mesure : une version différente ne répond pas
 * pareil, donc le score bouge. S'il change entre le scan initial et le
 * contrôle J+90, on annonce au client une progression qu'il n'a pas produite,
 * et c'est toute la promesse du sprint qui devient invérifiable.
 *
 * Deux dérives se sont produites pour de vrai, d'où ce fichier :
 *
 *  - Le code demandait « grok-4 » et xAI servait déjà « grok-4.3 ». Personne
 *    n'avait touché au code : le fournisseur avait redirigé l'alias tout seul.
 *  - `.env.example` annonçait gpt-4o et gemini-2.0-flash alors que le code
 *    utilisait gpt-5.6-terra et gemini-3.6-flash. Une documentation fausse est
 *    pire que pas de documentation.
 *
 * Ce test lit les deux fichiers et refuse l'un comme l'autre. Il ne fait aucun
 * appel réseau : il vérifie une discipline, pas une disponibilité.
 */

const racine = new URL("../../../", import.meta.url).pathname;
const source = readFileSync(`${racine}apps/citari/src/lib/moteurs.server.ts`, "utf8");
const exemple = readFileSync(`${racine}.env.example`, "utf8");

/** Les défauts écrits dans le code : `process.env.X_MODEL || "valeur"`. */
function defautsDuCode(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of source.matchAll(/process\.env\.([A-Z_]*MODEL)\s*\|\|\s*"([^"]+)"/g)) {
    out[m[1]!] = m[2]!;
  }
  return out;
}

/** Les valeurs annoncées dans `.env.example`, commentaires ignorés. */
function valeursDocumentees(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const ligne of exemple.split("\n")) {
    const m = ligne.match(/^([A-Z_]*MODEL)=(.+)$/);
    if (m) out[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

describe("modèles interrogés", () => {
  it("en déclare un par moteur", () => {
    const code = defautsDuCode();
    // Six moteurs, plus le petit modèle qui sert à l'analyse des réponses.
    expect(Object.keys(code).sort()).toEqual([
      "ANTHROPIC_MODEL",
      "GEMINI_ANALYSE_MODEL",
      "GEMINI_MODEL",
      "MISTRAL_MODEL",
      "OPENAI_MODEL",
      "PERPLEXITY_MODEL",
      "XAI_MODEL",
    ]);
  });

  it("n'utilise aucun alias mouvant", () => {
    // « -latest » veut dire « la dernière en date » : l'éditeur la remplace
    // quand il veut, et notre règle graduée se déplace sans prévenir.
    for (const [clef, valeur] of Object.entries(defautsDuCode())) {
      expect(valeur, `${clef} pointe sur un alias mouvant`).not.toMatch(/latest/i);
    }
  });

  it("nomme une version précise, jamais une famille", () => {
    // « grok-4 » était une famille, pas une version : xAI y répondait avec
    // grok-4.3. Un numéro de version ou une date est exigé, sauf pour
    // Perplexity qui n'en publie aucune.
    const tolerés = new Set(["PERPLEXITY_MODEL"]);
    for (const [clef, valeur] of Object.entries(defautsDuCode())) {
      if (tolerés.has(clef)) continue;
      expect(valeur, `${clef} = « ${valeur} » ne désigne pas une version précise`).toMatch(
        /[-.]\d/,
      );
    }
  });

  it("dit la même chose dans le code et dans .env.example", () => {
    // Une documentation qui ment sur le modèle interrogé enverrait le prochain
    // lecteur vérifier la mauvaise version.
    expect(valeursDocumentees()).toEqual(defautsDuCode());
  });
});
