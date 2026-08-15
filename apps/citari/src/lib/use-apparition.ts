import { useEffect, useState, type RefObject } from "react";

/**
 * Apparition REJOUABLE au défilement.
 *
 * Les animations d'entrée (Reveal, StrokeText, compteurs) coupaient leur
 * observateur au premier passage : jouées une fois, plus jamais. Demande de
 * Luigi du 15/08/2026 : les revoir à chaque fois qu'on redescend ou qu'on
 * remonte. Ce hook rend `true` quand l'élément entre dans la fenêtre (au
 * seuil demandé) et ne repasse à `false` que lorsqu'il en est COMPLÈTEMENT
 * sorti : la remise à zéro n'est jamais visible, et le retour rejoue
 * l'animation.
 *
 * Deux seuils observés (0 et `seuil`) : avec le seul seuil d'entrée, la
 * sortie totale de l'écran ne déclenche aucun rappel et l'état ne se
 * réarme jamais. `prefers-reduced-motion` fige tout en visible.
 */
export function useApparition(ref: RefObject<Element | null>, seuil = 0.15): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting && e.intersectionRatio >= seuil) {
            setVisible(true);
          } else if (!e.isIntersecting) {
            setVisible(false);
          }
        }
      },
      { threshold: [0, seuil] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seuil]);

  return visible;
}
