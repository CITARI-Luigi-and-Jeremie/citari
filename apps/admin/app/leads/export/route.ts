import { getDb, unwrap } from "@geo/core";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const leads = unwrap(await getDb().from("leads").select("*").order("created_at", { ascending: false })) as any[];
  const header = ["email", "marque", "secteur", "score", "statut", "date", "notes"];
  const rows = leads.map((l) =>
    [l.email, l.brand, l.sector, l.score, l.status, l.created_at, l.notes].map(csvEscape).join(";")
  );
  return new Response([header.join(";"), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-geo-sprint.csv"`,
    },
  });
}
