import { bookingUrl } from "@/lib/site";

/** Réservation Calendly en pop-up plein écran. Portée le 14/08/2026. */
export function BookingModal({
  open,
  onClose,
  marque,
  email = null,
}: {
  open: boolean;
  onClose: () => void;
  marque: string;
  /** Email du lead, si la session du navigateur le connaît : Calendly le préremplit. */
  email?: string | null;
}) {
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
