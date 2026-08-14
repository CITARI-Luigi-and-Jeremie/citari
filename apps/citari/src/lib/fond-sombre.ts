/**
 * Détecte si le fond réellement peint sous un point de l'écran est sombre.
 *
 * Les éléments flottants (logo, barre latérale) s'en servent pour passer en
 * papier au-dessus des sections sombres. Deux subtilités, payées chacune par
 * un bug :
 *
 * 1. `elementFromPoint` ignore les couches décoratives en `pointer-events:
 *    none` — dont le `Quadrillage sombre`, qui est précisément ce qui peint
 *    le noir des sections procédure, CTA final et pied de page. Leur fond ne
 *    vit PAS dans `backgroundColor` d'un ancêtre : c'est un enfant absolu.
 *    On inspecte donc aussi les quadrillages directs de chaque ancêtre.
 * 2. L'appelant est lui-même l'élément au point sondé : il doit se rendre
 *    transparent aux clics le temps de la mesure (fait ici).
 */
export function fondSombreAuPoint(x: number, y: number, soi?: HTMLElement | null): boolean {
  const avant = soi?.style.pointerEvents;
  if (soi) soi.style.pointerEvents = "none";
  const cible = document.elementFromPoint(x, y);
  if (soi) soi.style.pointerEvents = avant ?? "";

  let el: Element | null = cible;
  while (el) {
    // Un quadrillage posé directement dans cet ancêtre peint tout son fond.
    if (el.querySelector(":scope > .quad-sombre")) return true;
    if (el.querySelector(":scope > .quad-clair")) return false;

    const bg = getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const [r = 255, g = 255, b = 255, a = 1] = m[1]!.split(",").map((v) => parseFloat(v));
      if (a > 0.5) return 0.299 * r + 0.587 * g + 0.114 * b < 128;
    }
    el = el.parentElement;
  }
  return false;
}
