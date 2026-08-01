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
    <Link to="/" aria-label="Citari — accueil" className={cn("inline-flex items-center", className)}>
      <Logo hauteur={hauteur} point={point} className="marque-i" />
    </Link>
  );
}
