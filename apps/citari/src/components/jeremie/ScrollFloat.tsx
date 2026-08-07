/**
 * Chaque mot monte et se révèle au fil du défilement.
 *
 * Porté du projet Lovable de Jérémie le 07/08/2026. Le texte complet reste
 * dans le DOM au rendu serveur : seule l'animation est côté client, donc un
 * moteur d'IA qui lit la page voit la phrase entière. C'est important pour un
 * site qui vend sa propre lisibilité par les IA.
 */
import { useEffect, useMemo, useRef, type CSSProperties } from "react";

type Props = {
  children: string;
  className?: string;
  style?: CSSProperties;
  /** Décalage vertical de départ, en em. */
  from?: number;
  scrollStart?: string;
  scrollEnd?: string;
};

export function ScrollFloat({
  children,
  className,
  style,
  from = 0.5,
  scrollStart = "top 88%",
  scrollEnd = "bottom 62%",
}: Props) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const mots = useMemo(() => children.split(" "), [children]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cibles = Array.from(el.querySelectorAll<HTMLElement>("[data-float-word]"));
    if (cibles.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const c of cibles) {
        c.style.opacity = "1";
        c.style.transform = "none";
      }
      return;
    }

    let monte = true;
    let ctx: { revert: () => void } | null = null;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!monte) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.fromTo(
          cibles,
          { opacity: 0, yPercent: from * 100, scaleY: 1.1, scaleX: 0.98, transformOrigin: "50% 0%" },
          {
            opacity: 1,
            yPercent: 0,
            scaleY: 1,
            scaleX: 1,
            ease: "none",
            stagger: 0.06,
            scrollTrigger: { trigger: el, start: scrollStart, end: scrollEnd, scrub: true },
          },
        );
      }, el);
    })();

    return () => {
      monte = false;
      ctx?.revert();
    };
  }, [from, scrollStart, scrollEnd, mots.length]);

  return (
    <h2 ref={ref} className={className} style={style}>
      {mots.map((mot, i) => (
        <span key={`${mot}-${i}`} style={{ display: "inline-block", overflow: "hidden" }}>
          <span
            data-float-word
            style={{ display: "inline-block", opacity: 0, willChange: "transform, opacity" }}
          >
            {mot}
          </span>
          {i < mots.length - 1 ? " " : null}
        </span>
      ))}
    </h2>
  );
}
