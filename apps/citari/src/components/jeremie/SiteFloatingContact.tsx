import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Bouton de contact flottant, en haut à droite.
 * Porté du projet Lovable de Jérémie le 14/08/2026.
 */
export function SiteFloatingContact() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="mono fixed right-5 top-5 z-50 flex items-center gap-1 rounded-[4px] border border-rule/40 bg-paper/95 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-ink-2 backdrop-blur-sm transition-colors hover:bg-paper hover:text-ink sm:right-8 sm:top-7"
    >
      contact
      <span aria-hidden="true" className="text-[10px]">
        ↗
      </span>
    </a>
  );
}
