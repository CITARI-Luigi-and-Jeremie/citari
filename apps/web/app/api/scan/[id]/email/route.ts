import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@geo/core";
import { getScan } from "@/lib/scan-data";
import { sendEmail } from "@/lib/resend";
import { renderReportPdf } from "@/lib/pdf";
import { SITE_URL, BOOKING_URL } from "@/lib/constants";

export const maxDuration = 120;

const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  const { email } = parsed.data;

  const scan = await getScan(id);
  if (!scan) return NextResponse.json({ error: "Scan introuvable" }, { status: 404 });
  if (scan.status !== "done" || !scan.report_token) {
    return NextResponse.json({ error: "Le scan n'est pas terminé" }, { status: 409 });
  }

  const db = getDb();
  await db.from("scans").update({ email }).eq("id", id);
  await db.from("leads").insert({ scan_id: id, email, brand: scan.brand, sector: scan.sector, score: scan.score });

  const reportUrl = `${SITE_URL}/rapport/${scan.report_token}`;
  const pdf = await renderReportPdf(reportUrl);

  await sendEmail({
    to: email,
    subject: `Votre rapport de visibilité IA — ${scan.brand} : ${scan.score}/100`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h1 style="font-size:20px">Votre rapport de visibilité IA est prêt</h1>
        <p><strong>${scan.brand}</strong> obtient un Score de Visibilité IA de <strong>${scan.score}/100</strong> sur ChatGPT, Claude, Gemini et Perplexity.</p>
        <p><a href="${reportUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Voir le rapport complet</a></p>
        <p>Envie d'en discuter ? <a href="${BOOKING_URL}">Réservez votre call de restitution gratuit (30 min)</a> — on commente vos résultats et les actions prioritaires, sans engagement.</p>
        <p style="color:#64748b;font-size:12px">Le lien du rapport est personnel. ${pdf ? "Le PDF est joint à cet email." : ""}</p>
      </div>`,
    attachments: pdf
      ? [{ filename: `rapport-visibilite-ia-${scan.brand.toLowerCase().replace(/\s+/g, "-")}.pdf`, content: pdf.toString("base64") }]
      : undefined,
  });

  return NextResponse.json({ ok: true, reportUrl });
}
