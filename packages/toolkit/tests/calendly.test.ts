import { describe, expect, it } from "vitest";

import { estOrigineCalendly } from "@/lib/calendly";

/**
 * Le filtre d'origine de la capture des réservations.
 *
 * Le premier filtre exigeait un suffixe « .calendly.com » : le point de trop
 * rejetait l'origine principale du widget (https://calendly.com), et AUCUNE
 * réservation réelle n'aurait été captée. Trouvé le 15/08/2026 en
 * re-vérifiant la chaîne avant la mise en service — ces tests l'empêchent
 * de revenir, dans les deux sens : accepter Calendly, et n'accepter QUE lui.
 */
describe("estOrigineCalendly", () => {
  it("accepte l'origine principale du widget", () => {
    expect(estOrigineCalendly("https://calendly.com")).toBe(true);
  });

  it("accepte les sous-domaines Calendly", () => {
    expect(estOrigineCalendly("https://assets.calendly.com")).toBe(true);
  });

  it("refuse les domaines qui ne font que ressembler", () => {
    expect(estOrigineCalendly("https://evil-calendly.com")).toBe(false);
    expect(estOrigineCalendly("https://calendly.com.evil.com")).toBe(false);
    expect(estOrigineCalendly("https://notcalendly.com")).toBe(false);
  });

  it("refuse le HTTP non chiffré et les chaînes cassées", () => {
    expect(estOrigineCalendly("http://calendly.com")).toBe(false);
    expect(estOrigineCalendly("calendly.com")).toBe(false);
    expect(estOrigineCalendly("")).toBe(false);
  });
});
