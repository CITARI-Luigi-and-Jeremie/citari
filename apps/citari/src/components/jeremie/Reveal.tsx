/**
 * Apparition au défilement, sans dépendance externe.
 * Le contenu est présent dans le DOM dès le rendu serveur : seule
 * l'opacité et la translation sont animées à l'entrée dans le viewport.
 *
 * Porté du projet Lovable de Jérémie le 07/08/2026, à l'identique.
 */
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Retard en millisecondes, pour échelonner plusieurs blocs. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "span";
};

export function Reveal({ children, delay = 0, className = "", as = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("reveal-on");
      return;
    }
    const show = () => {
      el.classList.add("reveal-on");
      io.disconnect();
      clearTimeout(safety);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Visible, ou déjà dépassé (page chargée ou remontée en position basse).
          if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
            show();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // Filet de sécurité : un bloc déjà dans (ou au-dessus de) la fenêtre
    // ne doit jamais rester invisible, même si l'observateur ne se déclenche pas.
    const safety = window.setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) show();
    }, 600);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
