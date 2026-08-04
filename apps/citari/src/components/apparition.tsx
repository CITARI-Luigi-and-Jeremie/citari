import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Apparition au défilement : une transition unique, très courte en amplitude.
 * Aucune dépendance, un seul IntersectionObserver par élément, désactivé
 * automatiquement par la règle prefers-reduced-motion globale.
 */
export function Apparition({
  children,
  className,
  delai = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delai?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [vu, setVu] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVu(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVu(true);
            obs.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-vu={vu ? "1" : "0"}
      style={delai ? ({ "--delai": `${delai}ms` } as React.CSSProperties) : undefined}
      className={cn("apparait", className)}
    >
      {children}
    </Tag>
  );
}
