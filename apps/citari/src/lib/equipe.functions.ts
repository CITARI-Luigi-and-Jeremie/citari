import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Le pilotage des réservations Calendly, sur le site lui-même.
 *
 * Décision du 15/08/2026 : Luigi ne veut ni serveur ni domaine de plus. La
 * page /equipe vit donc sur citari.fr, protégée par LE mot de passe admin
 * (le même que le back-office local, une seule vérité). Le journal du 14/08
 * a supprimé l'ancien /admin du site pour cause de DUPLICATION : ici, pas de
 * doublon — les réservations n'existent nulle part ailleurs, et le moteur de
 * scan reste unique (creerScan, puis l'écran /scan/$id pilote la mesure).
 *
 * La capture vient du widget Calendly embarqué : à `calendly.event_scheduled`,
 * le navigateur du prospect appelle `enregistrerReservation`. Limite connue et
 * assumée : une réservation prise HORS du site (lien Calendly direct, email)
 * n'est pas captée — elle arrive par l'email de notification Calendly.
 */

const motDePasseValide = (mdp: string): boolean => {
  const attendu = process.env.ADMIN_PASSWORD;
  // Pas de mot de passe configuré = page fermée, jamais ouverte par défaut.
  if (!attendu) return false;
  return mdp === attendu;
};

/**
 * Capte une réservation confirmée. Public, mais inerte sans un jeton de
 * rapport RÉEL : la seule chose qu'un abus peut produire est une ligne de
 * réservation rattachée à un scan existant, visible de nous seuls.
 */
export const enregistrerReservation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        jeton: z.string().min(10).max(80),
        email: z.string().trim().toLowerCase().max(160).nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: scan } = await supabaseAdmin
      .from("scans")
      .select("id, brand_name, website_url")
      .eq("report_token", data.jeton)
      .maybeSingle();
    if (!scan) return { ok: false as const };

    // Anti-rejeu : le widget peut émettre plusieurs fois, et un rechargement
    // de la page de rapport ne doit pas refabriquer la même ligne.
    const { data: existante } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("scan_id", scan.id)
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .maybeSingle();
    if (existante) return { ok: true as const };

    await supabaseAdmin.from("reservations").insert({
      scan_id: scan.id,
      email: data.email,
      brand: scan.brand_name,
      website: scan.website_url,
    });
    return { ok: true as const };
  });

export const listerReservations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ motDePasse: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    if (!motDePasseValide(data.motDePasse)) return { autorise: false as const, lignes: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lignes } = await supabaseAdmin
      .from("reservations")
      .select(
        `id, created_at, email, brand, website, premium_launched_at,
         apercu:scans!reservations_scan_id_fkey(id, score_global, report_token, sector, city),
         premium:scans!reservations_premium_scan_id_fkey(id, status, phase, score_global, report_token, completed_at)`,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    return { autorise: true as const, lignes: lignes ?? [] };
  });

/**
 * Lance la mesure complète pour une réservation. Le scan est CRÉÉ ici ;
 * il ne coûte rien tant que personne ne le pilote — c'est l'écran /scan/$id,
 * ouvert par la page /equipe, qui déroule la mesure comme pour un prospect.
 */
export const lancerPremium = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ motDePasse: z.string().max(200), reservationId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!motDePasseValide(data.motDePasse)) return { ok: false as const, erreur: "Mot de passe refusé." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { creerScan } = await import("@/lib/orchestrateur.server");

    const { data: resa } = await supabaseAdmin
      .from("reservations")
      .select("id, brand, website, premium_scan_id, apercu:scans!reservations_scan_id_fkey(sector, city, language)")
      .eq("id", data.reservationId)
      .maybeSingle();
    if (!resa) return { ok: false as const, erreur: "Réservation introuvable." };

    // Déjà lancé : renvoyer l'existant, le bouton est idempotent.
    if (resa.premium_scan_id) {
      const { data: deja } = await supabaseAdmin
        .from("scans")
        .select("id, report_token")
        .eq("id", resa.premium_scan_id)
        .single();
      return { ok: true as const, scanId: deja!.id, jeton: deja!.report_token };
    }

    const apercu = resa.apercu as unknown as { sector: string; city: string | null; language: string } | null;
    const scan = await creerScan({
      marque: resa.brand,
      url: resa.website,
      // Le métier et la ville déduits pendant l'aperçu se réutilisent : une
      // valeur déjà posée n'est jamais écrasée par la phase questions.
      secteur: apercu?.sector ?? "",
      ville: apercu?.city ?? null,
      concurrents: [],
      langue: apercu?.language ?? "fr",
      ipHash: "equipe",
      mode: "complet",
    });

    await supabaseAdmin
      .from("reservations")
      .update({ premium_scan_id: scan.id, premium_launched_at: new Date().toISOString() })
      .eq("id", resa.id);

    return { ok: true as const, scanId: scan.id, jeton: scan.report_token };
  });
