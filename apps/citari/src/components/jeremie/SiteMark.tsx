import { Link } from "@tanstack/react-router";

/**
 * Logo Citari flottant. Positionnable en fixed via className.
 * Porté du projet Lovable de Jérémie le 14/08/2026 ; l'image vient de
 * `public/img`, jamais du CDN Lovable.
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
