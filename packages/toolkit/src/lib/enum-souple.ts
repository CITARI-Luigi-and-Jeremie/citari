import { z } from "zod";

/**
 * Enum tolérant pour les valeurs produites par un modèle.
 *
 * Un modèle à qui l'on demande `"comparatif" | "alternatives" | "faq" | "guide"`
 * répond parfois « Client vs Concurrent » ou « Alternatives à [leader] ». Avec
 * un `z.enum` strict, toute la commande échoue alors que le contenu utile est
 * parfaitement exploitable : constaté en réel sur `content-brief`, où douze
 * briefs bien rédigés ont été jetés à cause d'un seul libellé.
 *
 * On rattache donc la valeur reçue à la plus proche des valeurs permises, par
 * mots-clés, et on retombe sur un défaut explicite si rien ne correspond.
 * Le prompt reste strict ; ceci n'est que le filet.
 */
export function enumSouple<T extends readonly [string, ...string[]]>(
  valeurs: T,
  motsCles: Partial<Record<T[number], readonly string[]>>,
  defaut: T[number]
) {
  const normaliser = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

  return z.preprocess((brut) => {
    if (typeof brut !== "string") return defaut;
    const v = normaliser(brut);
    // Correspondance exacte d'abord : le cas nominal ne doit rien coûter.
    const exact = valeurs.find((a) => normaliser(a) === v);
    if (exact) return exact;
    for (const valeur of valeurs) {
      const cles = motsCles[valeur as T[number]] ?? [normaliser(valeur).slice(0, 6)];
      if (cles.some((c) => v.includes(c))) return valeur;
    }
    return defaut;
  }, z.enum(valeurs));
}
