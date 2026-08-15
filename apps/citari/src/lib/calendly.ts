/**
 * L'origine d'un message Calendly, vérifiée strictement.
 *
 * Le widget embarqué émet ses postMessage depuis `https://calendly.com`
 * (sans sous-domaine). Le premier filtre exigeait un domaine finissant par
 * « .calendly.com » : le point de trop rejetait l'origine principale, et
 * AUCUNE réservation réelle n'aurait été captée (trouvé le 15/08/2026 en
 * re-vérifiant la chaîne avant la mise en service). La règle : https, et
 * l'hôte est calendly.com ou l'un de ses sous-domaines — jamais un simple
 * suffixe de chaîne, sinon `https://evil-calendly.com` passerait.
 */
export function estOrigineCalendly(origine: string): boolean {
  try {
    const u = new URL(origine);
    return u.protocol === "https:" && (u.hostname === "calendly.com" || u.hostname.endsWith(".calendly.com"));
  } catch {
    return false;
  }
}
