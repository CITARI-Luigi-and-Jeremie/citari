import { Link } from "@tanstack/react-router";
import logo from "@/assets/citari-logo.png.asset.json";
import { cn } from "@/lib/utils";

/** Marque Citari — logotype seul, sans effet, aligné sur la grille typographique. */
export function Logo({ className, hauteur = 22 }: { className?: string; hauteur?: number }) {
  return (
    <img
      src={logo.url}
      alt="Citari"
      style={{ height: hauteur }}
      className={cn("w-auto select-none opacity-90 transition-opacity duration-300", className)}
      draggable={false}
    />
  );
}

export function LogoLien({ className, hauteur }: { className?: string; hauteur?: number }) {
  return (
    <Link to="/" aria-label="Citari — accueil" className={cn("inline-flex items-center", className)}>
      <Logo hauteur={hauteur} className="hover:opacity-100" />
    </Link>
  );
}
