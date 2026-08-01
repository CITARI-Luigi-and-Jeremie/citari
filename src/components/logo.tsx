import { Link } from "@tanstack/react-router";
import logo from "@/assets/citari-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Marque Citari.
 * Le signe est peint par masque alpha : sa couleur vient de --marque-couleur,
 * comme tout le reste (hauteur, opacité, écarts, transitions) — voir styles.css.
 */
export function Logo({
  className,
  hauteur = 24,
  point = true,
}: {
  className?: string;
  hauteur?: number;
  /** Point bronze final, seul écart de couleur autorisé dans la marque. */
  point?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label="Citari"
      className={cn("marque", className)}
      style={{
        ["--marque-h" as string]: `${hauteur}px`,
        ["--marque-src" as string]: `url(${logo.url})`,
      }}
    >
      <span aria-hidden="true" className="marque-signe" />
      {point ? <span aria-hidden="true" className="marque-point" /> : null}
    </span>
  );
}

export function LogoLien({
  className,
  hauteur,
  point,
}: {
  className?: string;
  hauteur?: number;
  point?: boolean;
}) {
  return (
    <Link
      to="/"
      aria-label="Citari — accueil"
      className={cn(
        "group/logo relative inline-flex items-center justify-center",
        className,
      )}
    >
      {/* Halo circulaire derrière le signe, ancré à gauche. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 top-1/2 aspect-square h-[calc(var(--marque-h)*2.6)] -translate-y-1/2 rounded-full bg-ink/[0.04] opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover/logo:opacity-100 group-hover/logo:scale-100"
        style={{ transform: "translateY(-50%) scale(0.85)" }}
      />
      <Logo hauteur={hauteur} point={point} className="marque-i relative" />
      {/* Filet d'accent sous le logo. */}
      <span
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover/logo:scale-x-100"
      />
    </Link>
  );
}
