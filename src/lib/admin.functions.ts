import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

export type LeadAdmin = {
  id: string;
  created_at: string;
  email: string;
  first_name: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  priority: number | null;
  converted: boolean;
  notes: string | null;
  scan_id: string | null;
  scan: {
    brand_name: string;
    website_url: string | null;
    sector: string | null;
    city: string | null;
    score_global: number | null;
    report_token: string | null;
  } | null;
};

export type ClientAdmin = {
  id: string;
  created_at: string;
  brand_name: string;
  contact_email: string | null;
  contact_name: string | null;
  offer: string | null;
  amount_eur: number | null;
  invoice_status: string | null;
  notes: string | null;
};

function verifierMotDePasse(saisie: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD;
  if (!attendu) throw new Error("ADMIN_PASSWORD n'est pas configuré.");
  const a = createHash("sha256").update(saisie, "utf8").digest();
  const b = createHash("sha256").update(attendu, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const connexionAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { motDePasse: string }) => d)
  .handler(async ({ data }) => ({ ok: verifierMotDePasse(data.motDePasse) }));

export const chargerAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { motDePasse: string }) => d)
  .handler(async ({ data }) => {
    if (!verifierMotDePasse(data.motDePasse)) throw new Error("Mot de passe incorrect.");
    const db = await admin();

    const [leadsRes, clientsRes, scansRes] = await Promise.all([
      db
        .from("leads")
        .select(
          "id, created_at, email, first_name, phone, company, status, priority, converted, notes, scan_id, scans(brand_name, website_url, sector, city, score_global, report_token)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("clients").select("*").order("created_at", { ascending: false }).limit(100),
      db
        .from("scans")
        .select("id, created_at, brand_name, status, score_global, report_token, sector, city")
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

    if (leadsRes.error) throw leadsRes.error;
    if (clientsRes.error) throw clientsRes.error;
    if (scansRes.error) throw scansRes.error;

    const leads = (leadsRes.data ?? []).map((l: Record<string, unknown>) => {
      const brut = l["scans"];
      const scan = Array.isArray(brut) ? (brut[0] ?? null) : (brut ?? null);
      return { ...l, scan } as unknown as LeadAdmin;
    });

    const scans = scansRes.data ?? [];
    const clients = (clientsRes.data ?? []) as unknown as ClientAdmin[];

    return {
      leads,
      clients,
      scans,
      stats: {
        scans: scans.length,
        leads: leads.length,
        convertis: leads.filter((l) => l.converted).length,
        chiffre: clients.reduce((s, c) => s + (c.amount_eur ?? 0), 0),
      },
    };
  });

export const majLead = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { motDePasse: string; id: string; champs: { status?: string; notes?: string; converted?: boolean } }) => d,
  )
  .handler(async ({ data }) => {
    if (!verifierMotDePasse(data.motDePasse)) throw new Error("Mot de passe incorrect.");
    const db = await admin();
    const { error } = await db
      .from("leads")
      .update({ ...data.champs, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
