/**
 * Apparition au défilement, sans dépendance externe.
 * Le contenu est présent dans le DOM dès le rendu serveur : seule
 * l'opacité et la translation sont animées à l'entrée dans le viewport.
 *
 * Porté du projet Lovable de Jérémie le 07/08/2026. REJOUABLE depuis le
 * 15/08/2026 (demande Luigi) : l'animation se réarme quand le bloc sort
 * complètement de l'écran, et rejoue à chaque retour, en montant comme en
 * descendant. Conséquence assumée : un bloc au-dessus de la fenêtre est
 * masqué (avant, il était montré d'office), c'est précisément ce qui permet
 * de le voir rejouer en remontant.
 */
import { useEffect, useRef, type ReactNode } from "react";

import { useApparition } from "@/lib/use-apparition";

type Props = {
  children: ReactNode;
  /** Retard en millisecondes, pour échelonner plusieurs blocs. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "span";
};

export function Reveal({ children, delay = 0, className = "", as = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const visible = useApparition(ref, 0.12);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.toggle("reveal-on", visible);
  }, [visible]);

  // Filet de sécurité au montage : un bloc déjà dans la fenêtre ne doit
  // jamais rester invisible, même si l'observateur ne se déclenche pas.
  useEffect(() => {
    const safety = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add("reveal-on");
    }, 600);
    return () => clearTimeout(safety);
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
