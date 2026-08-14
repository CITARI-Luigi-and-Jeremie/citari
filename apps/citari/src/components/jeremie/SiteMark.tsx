import { Link } from "@tanstack/react-router";

/**
 * Logo Citari, posé en haut à gauche DE LA PAGE (pas du viewport) : il défile
 * avec le contenu et disparaît naturellement quand on descend. Décision de
 * Luigi du 14/08/2026 : toujours encre sur clair, sans cartouche — le PNG est
 * transparent et se pose directement sur le fond ; pas de détection de
 * luminosité ici, le logo ne survole jamais les sections sombres.
 * L'image vient de `public/img`, jamais du CDN Lovable.
 */
export function SiteMark({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Citari, retour à l'accueil"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src="/img/citari-logo.png"
        alt="Citari"
        width={680}
        height={160}
        className="h-[30px] w-auto sm:h-[38px]"
      />
    </Link>
  );
}
