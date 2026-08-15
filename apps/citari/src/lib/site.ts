/**
 * Constantes uniques du site.
 *
 * Portées du projet Lovable de Jérémie le 07/08/2026. Tout ce qui est affiché
 * plusieurs fois vit ici : changer une valeur à un seul endroit évite qu'un
 * chiffre publié diverge d'une page à l'autre, ce qui est déjà arrivé.
 */

/** Événement de réservation collectif : Jérémie ou Luigi. */
export const BOOKING_URL =
  process.env.BOOKING_URL ||
  "https://calendly.com/d/d3hj-bky-9x2/diagnostic-visibilite-ia";

export function bookingUrl({
  email,
  name,
  embarque,
}: {
  email?: string | null;
  name?: string | null;
  /**
   * Hôte de la page qui EMBARQUE le widget (iframe). Sans `embed_domain` et
   * `embed_type`, Calendly n'émet AUCUN postMessage vers la page hôte :
   * prouvé le 15/08/2026 par A/B (0 message en 12 s sans, 5 dès le
   * chargement avec), après qu'une vraie réservation de test n'est jamais
   * apparue sur /equipe. À passer pour toute iframe, jamais pour un lien.
   */
  embarque?: string | null;
} = {}): string {
  const url = new URL(BOOKING_URL);
  url.searchParams.set("hide_gdpr_banner", "1");
  url.searchParams.set("background_color", "fbfaf7");
  url.searchParams.set("text_color", "17160f");
  url.searchParams.set("primary_color", "c0371d");
  if (email) url.searchParams.set("email", email);
  if (name) url.searchParams.set("name", name);
  if (embarque) {
    url.searchParams.set("embed_domain", embarque);
    url.searchParams.set("embed_type", "Inline");
  }
  return url.toString();
}

export const CONTACT_EMAIL = "contact@citari.fr";

/** Forme juridique, à compléter dès que la structure existe (voir SETUP.md). */
export const LEGAL_FORM = "[forme juridique à compléter]";

/**
 * Score public de Citari, mesuré sur nous-mêmes.
 *
 * La doctrine interdit tout compteur simulé : cette valeur doit provenir d'un
 * scan réellement enregistré. Si elle vaut null, le bloc est masqué plutôt que
 * d'afficher un chiffre inventé.
 */
export const SELF_SCORE: number | null = null;
export const SELF_SCORE_DATE = "";

/**
 * Verticales SUGGÉRÉES au formulaire — le champ est libre depuis le
 * 14/08/2026, le prospect écrit son métier dans ses mots. La liste reste la
 * taxonomie de NOS segments (baromètre, corrections de concurrents par
 * secteur, gabarits d'emails) : nos propres scans par lot la posent
 * programmatiquement.
 */
export const SECTORS = [
  "Cabinet comptable",
  "Cabinet d'avocats",
  "Gestion de patrimoine",
  "Services informatiques",
  "Agence immobilière",
  "Artisan du bâtiment",
  "Santé et paramédical",
  "Conseil et formation",
  "Commerce local",
  "Industrie et B2B",
  "Autre",
];

/** « cabinet-vaurel.fr » → « Cabinet Vaurel ». Pré-remplissage, toujours éditable. */
export function brandFromDomain(domain: string): string {
  const host =
    domain
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0] ?? "";
  const label = host.split(".")[0] ?? "";
  if (!label) return "";
  return label
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
