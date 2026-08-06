/**
 * Récupère un extrait textuel d'une page d'accueil.
 *
 * Seul rescapé de ce fichier, qui contenait aussi la génération des questions
 * du scan. Cette génération appartenait au moteur de `packages/core`, supprimé
 * le 06/08/2026 : les questions sont désormais produites par
 * `apps/citari/src/lib/moteurs.server.ts`, avec Gemini.
 *
 * Utilisé par le toolkit pour contextualiser un audit technique.
 */
export async function fetchHomeText(url: string): Promise<string> {
  try {
    const full = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(full, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOSprintBot/1.0)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return "";
  }
}
