import { NextResponse } from "next/server";
import { getDb, unwrap } from "@geo/core";
import { sendEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * À appeler quotidiennement (cron Vercel ou crontab) : rappelle au fondateur
 * les re-scans J+90 arrivés à échéance. Protégé par CRON_SECRET si défini.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && new URL(req.url).searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) return NextResponse.json({ error: "FOUNDER_EMAIL non configuré" }, { status: 500 });

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const due = unwrap(
    await db.from("clients").select("*").lte("rescan_due_at", today).eq("rescan_reminder_sent", false).not("rescan_due_at", "is", null)
  ) as any[];

  for (const client of due) {
    await sendEmail({
      to: founderEmail,
      subject: `⏰ Re-scan J+90 à lancer : ${client.brand}`,
      html: `<p>Le re-scan de <strong>${client.brand}</strong> était planifié pour le ${client.rescan_due_at}.</p>
             <p>Lance-le depuis l'admin (fiche client) ou via <code>pnpm toolkit rescan ${client.brand}</code>.</p>`,
    });
    await db.from("clients").update({ rescan_reminder_sent: true }).eq("id", client.id);
  }

  return NextResponse.json({ reminded: due.length });
}
