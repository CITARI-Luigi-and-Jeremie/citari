import { Link } from "@tanstack/react-router";
import logo from "@/assets/citari-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Marque Citari — signe + mot.
 * Aucune valeur en dur : couleurs, typographie, écarts et transitions
 * proviennent des variables --marque-* définies dans src/styles.css.
 */
export function Logo({
  className,
  hauteur = 20,
  mot = true,
  filet = false,
}: {
  className?: string;
  hauteur?: number;
  /** Affiche le mot « Citari » à côté du signe. */
  mot?: boolean;
  /** Filet bronze vertical entre le signe et le mot. */
  filet?: boolean;
}) {
  return (
    <span
      className={cn("marque", className)}
      style={{ ["--marque-h" as string]: `${hauteur}px` }}
    >
      <img src={logo.url} alt="Citari" draggable={false} />
      {filet && mot ? <span aria-hidden="true" className="marque-filet" /> : null}
      {mot ? (
        <span aria-hidden="true" className="marque-mot">
          Citari<span className="marque-point">.</span>
        </span>
      ) : null}
    </span>
  );
}

export function LogoLien({
  className,
  hauteur,
  mot,
  filet,
}: {
  className?: string;
  hauteur?: number;
  mot?: boolean;
  filet?: boolean;
}) {
  return (
    <Link to="/" aria-label="Citari — accueil" className={cn("inline-flex items-center", className)}>
      <Logo hauteur={hauteur} mot={mot} filet={filet} className="marque-i" />
    </Link>
  );
}
