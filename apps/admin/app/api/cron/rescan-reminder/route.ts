import { NextResponse } from "next/server";
import { getDb, unwrap } from "@geo/core";
import { sendEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * À appeler quotidiennement (cron Vercel ou crontab) : rappelle au fondateur
 * les re-scans J+90 arrivés à échéance. L'échéance vit sur le SPRINT
 * (sprints.rescan_due_on), pas sur le client : un client peut enchaîner
 * plusieurs sprints. Protégé par CRON_SECRET si défini.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized =
    !secret ||
    new URL(req.url).searchParams.get("secret") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`; // format des crons Vercel
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) return NextResponse.json({ error: "FOUNDER_EMAIL non configuré" }, { status: 500 });

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const due = unwrap(
    await db
      .from("sprints")
      .select("id, rescan_due_on, client_id, clients(brand_name)")
      .lte("rescan_due_on", today)
      .eq("rescan_reminder_sent", false)
      .is("rescan_scan_id", null)
      .not("rescan_due_on", "is", null)
  ) as any[];

  for (const sprint of due) {
    const brand = sprint.clients?.brand_name ?? sprint.client_id;
    await sendEmail({
      to: founderEmail,
      subject: `⏰ Re-scan J+90 à lancer : ${brand}`,
      html: `<p>Le re-scan de <strong>${brand}</strong> était planifié pour le ${sprint.rescan_due_on}.</p>
             <p>Lancez-le depuis l'admin (fiche client) : le bouton ouvre le scan avec les mêmes questions.</p>`,
    });
    await db.from("sprints").update({ rescan_reminder_sent: true }).eq("id", sprint.id);
  }

  return NextResponse.json({ reminded: due.length });
}
