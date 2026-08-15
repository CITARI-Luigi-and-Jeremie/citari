import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";

import { bookingUrl } from "@/lib/site";
import { estOrigineCalendly } from "@/lib/calendly";
import { enregistrerReservation } from "@/lib/equipe.functions";

/**
 * Réservation Calendly en pop-up plein écran. Portée le 14/08/2026.
 *
 * Depuis le 15/08/2026, la confirmation est CAPTÉE : le widget embarqué
 * émet un postMessage `calendly.event_scheduled` quand le prospect valide
 * son créneau, et on écrit alors la réservation en base, rattachée au scan.
 * C'est ce qui alimente la page /equipe, d'où se lance le scan premium.
 */
export function BookingModal({
  open,
  onClose,
  marque,
  email = null,
  jeton = null,
}: {
  open: boolean;
  onClose: () => void;
  marque: string;
  /** Email du lead, si la session du navigateur le connaît : Calendly le préremplit. */
  email?: string | null;
  /** Jeton du rapport : rattache la réservation captée au scan d'origine. */
  jeton?: string | null;
}) {
  const enregistrer = useServerFn(enregistrerReservation);

  useEffect(() => {
    if (!open || !jeton) return;
    const onMessage = (e: MessageEvent) => {
      // Seul Calendly est écouté, et seul l'événement de confirmation compte.
      if (typeof e.origin !== "string" || !estOrigineCalendly(e.origin)) return;
      const type = (e.data as { event?: string } | null)?.event;
      if (type !== "calendly.event_scheduled") return;
      // Tolérant : une capture ratée ne doit jamais gêner la réservation
      // elle-même, qui est déjà confirmée chez Calendly.
      void enregistrer({ data: { jeton, email: email ?? null } }).catch(() => undefined);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, jeton, email, enregistrer]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/85 p-0 sm:p-[2vh_2vw]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative h-full w-full overflow-hidden bg-paper sm:h-[90vh] sm:w-[95%] sm:max-w-[1100px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full border border-rule-strong bg-paper text-[24px] leading-none text-ink-2 transition-colors hover:text-ink"
        >
          ×
        </button>
        <iframe
          title="Réserver le scan premium"
          src={bookingUrl({ email, name: marque })}
          className="block h-full w-full border-0"
        />
      </div>
    </div>
  );
}
