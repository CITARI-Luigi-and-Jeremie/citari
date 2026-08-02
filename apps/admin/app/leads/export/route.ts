import { getDb, unwrap } from "@geo/core";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const db = getDb();
  const leads = unwrap(await db.from("leads").select("*").order("created_at", { ascending: false })) as any[];
  // Marque, secteur et score vivent sur le scan, pas sur le lead.
  const scans = unwrap(await db.from("scans").select("id,brand_name,sector,score_global")) as any[];
  const scanById = new Map(scans.map((s) => [s.id, s]));

  const header = ["email", "entreprise", "secteur", "score", "statut", "date", "notes"];
  const rows = leads.map((l) => {
    const s = scanById.get(l.scan_id);
    return [
      l.email,
      s?.brand_name ?? l.company,
      s?.sector,
      s?.score_global != null ? Math.round(s.score_global) : "",
      l.status,
      l.created_at,
      l.notes,
    ].map(csvEscape).join(";");
  });
  // BOM UTF-8 : Excel (FR) ouvre les accents correctement
  return new Response("﻿" + [header.join(";"), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-citari.csv"`,
    },
  });
}
