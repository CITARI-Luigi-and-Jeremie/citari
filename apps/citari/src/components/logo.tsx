import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Marque Citari, hors des pages qui ont l'en-tête de Jérémie.
 *
 * Réécrite le 08/08/2026. Elle peignait le signe par masque alpha à partir de
 * `--marque-src`, mais la règle CSS du masque n'a pas survécu à la fusion des
 * feuilles de style : le logo était un bloc vide sur le rapport et sur les
 * pages de contenu. Elle pointait de surcroît vers `src/assets/*.asset.json`,
 * une URL de CDN Lovable qui n'existe pas sur notre serveur.
 *
 * On sert donc la même image que l'en-tête du site, depuis `public/img`.
 */

export function Logo({ className, hauteur = 26 }: { className?: string; hauteur?: number }) {
  return (
    <img
      src="/img/citari-logo.png"
      alt="Citari"
      width={680}
      height={160}
      className={cn("w-auto", className)}
      style={{ height: `${hauteur}px` }}
    />
  );
}

export function LogoLien({ className, hauteur }: { className?: string; hauteur?: number }) {
  return (
    <Link
      to="/"
      aria-label="Citari, accueil"
      className={cn("group/logo relative inline-flex items-center justify-start", className)}
    >
      <Logo hauteur={hauteur} />
      {/* Filet d'accent sous le logo, au survol. */}
      <span
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-signal transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover/logo:scale-x-100"
      />
    </Link>
  );
}
