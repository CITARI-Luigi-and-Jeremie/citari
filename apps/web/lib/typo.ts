/**
 * Micro-typographie française.
 *
 * L'usage français impose une espace fine insécable (U+202F) avant ? ! ; :
 * et à l'intérieur des guillemets. C'est invisible tant que c'est correct,
 * et immédiatement perceptible quand ça ne l'est pas — un texte français
 * rendu avec les règles anglaises « sonne » traduit.
 */
const NNBSP = " "; // espace fine insécable
const NBSP = " "; // espace insécable classique

export function fr(input: string): string {
  return (
    input
      // Apostrophe typographique entre deux lettres : l’offre, d’achat, n’y
      .replace(/(\p{L})'(\p{L})/gu, "$1’$2")
      // Ponctuation haute : espace fine insécable devant
      .replace(/\s*([?!;:])/g, `${NNBSP}$1`)
      // Guillemets français : fine insécable à l'intérieur
      .replace(/«\s*/g, `«${NNBSP}`)
      .replace(/\s*»/g, `${NNBSP}»`)
      // Le pourcentage prend une insécable pleine
      .replace(/(\d)\s+%/g, `$1${NBSP}%`)
      // Espaces des milliers : insécables (2 900 € ne doit jamais se couper)
      .replace(/(\d)\s+(\d{3})/g, `$1${NBSP}$2`)
      .replace(/(\d)\s+€/g, `$1${NBSP}€`)
  );
}
