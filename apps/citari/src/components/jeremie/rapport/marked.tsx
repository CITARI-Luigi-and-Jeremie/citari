import { INK, RED, TEXT } from "./theme";

/**
 * Découpe un texte marqué en fragments stylés.
 *   *Concurrent*   → signal
 *   +VotreMarque+  → encre
 */
export function marked(text: string) {
  return text
    .split(/(\*[^*]+\*|\+[^+]+\+)/)
    .filter(Boolean)
    .map((tok, k) => {
      if (tok.startsWith("*"))
        return (
          <span key={k} style={{ color: RED, fontWeight: 700 }}>
            {tok.slice(1, -1)}
          </span>
        );
      if (tok.startsWith("+"))
        return (
          <span key={k} style={{ color: INK, fontWeight: 700 }}>
            {tok.slice(1, -1)}
          </span>
        );
      return (
        <span key={k} style={{ color: TEXT, fontWeight: 400 }}>
          {tok}
        </span>
      );
    });
}
