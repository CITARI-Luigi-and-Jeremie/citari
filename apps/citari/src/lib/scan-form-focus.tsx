import { createContext, useContext, useCallback, useRef } from "react";

/**
 * Contexte partagé pour focaliser le champ URL du formulaire de scan
 * depuis n'importe quel CTA du site, même quand le champ n'est pas encore monté.
 *
 * Porté du projet Lovable de Jérémie le 07/08/2026, à l'identique.
 */

type ScanFormFocusContextValue = {
  /** Appelé par ScanForm pour enregistrer le champ domaine. */
  registerInput: (ref: HTMLInputElement | null) => void;
  /** Déclenche le défilement en haut de page, le focus et l'animation du champ. */
  focusAndScroll: () => void;
};

const ScanFormFocusContext = createContext<ScanFormFocusContextValue | null>(null);

const DURATION = 1200;

function performFocus(input: HTMLInputElement) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const delay = prefersReduced ? 0 : 80;

  window.setTimeout(() => {
    // preventScroll : sans cela, le focus interrompt le défilement vers le haut
    // et la page se fige à mi-course, hero coupé.
    input.focus({ preventScroll: true });
    input.select();
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    input.classList.add("field-signal");
    window.setTimeout(() => {
      input.classList.remove("field-signal");
    }, DURATION);
  }, delay);
}

export function ScanFormFocusProvider({ children }: { children: React.ReactNode }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingRef = useRef(false);

  const registerInput = useCallback((ref: HTMLInputElement | null) => {
    inputRef.current = ref;
    if (pendingRef.current && ref) {
      performFocus(ref);
      pendingRef.current = false;
    }
  }, []);

  const focusAndScroll = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const input = inputRef.current;
    if (input) performFocus(input);
    else pendingRef.current = true;
  }, []);

  return (
    <ScanFormFocusContext.Provider value={{ registerInput, focusAndScroll }}>
      {children}
    </ScanFormFocusContext.Provider>
  );
}

export function useScanFormFocus() {
  const ctx = useContext(ScanFormFocusContext);
  if (!ctx) throw new Error("useScanFormFocus doit être utilisé dans ScanFormFocusProvider");
  return ctx;
}
