import { notFound } from "next/navigation";
import { getDb, unwrap } from "@geo/core";
import { convertLeadToClient, markFollowUpSent, saveLeadNotes, stopFollowUps, updateLeadStatus } from "@/app/actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "call_booked", "client", "lost"];

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { data: lead } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();
  const scan = unwrap(await db.from("scans").select("*").eq("id", lead.scan_id).single()) as any;
  const { count: nQueries } = await db.from("queries").select("id", { count: "exact", head: true }).eq("scan_id", scan.id);
  const { count: nResponses } = await db.from("responses").select("id", { count: "exact", head: true }).eq("scan_id", scan.id);
  const followUps = unwrap(await db.from("follow_ups").select("*").eq("lead_id", lead.id).order("step")) as any[];

  return (
    <div>
      <a href="/leads" className="text-sm text-bone-faint">← Leads</a>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{lead.brand} <span className="text-base font-normal text-bone-faint">— {lead.email}</span></h1>
        {lead.status !== "client" && (
          <form action={convertLeadToClient.bind(null, lead.id)}>
            <button className="btn-signal">
              Convertir en client
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="border border-rule bg-ink-raised p-5">
          <h2 className="font-semibold">Scan</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-bone-faint">Score</dt><dd className="font-bold">{scan.score ?? "—"}/100</dd></div>
            <div className="flex justify-between"><dt className="text-bone-faint">Secteur</dt><dd>{scan.sector}</dd></div>
            <div className="flex justify-between"><dt className="text-bone-faint">URL</dt><dd>{scan.url}</dd></div>
            <div className="flex justify-between"><dt className="text-bone-faint">Concurrents</dt><dd>{(scan.competitors ?? []).map((c: any) => c.name).join(", ") || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-bone-faint">Requêtes / Réponses</dt><dd>{nQueries} / {nResponses}</dd></div>
            <div className="flex justify-between"><dt className="text-bone-faint">Coût</dt><dd>{scan.cost_cents} ct</dd></div>
            <div className="flex justify-between"><dt className="text-bone-faint">Rapport</dt><dd>{scan.report_token ? <a className="text-signal underline" href={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/rapport/${scan.report_token}`} target="_blank">ouvrir</a> : "—"}</dd></div>
          </dl>
        </div>

        <div className="border border-rule bg-ink-raised p-5">
          <h2 className="font-semibold">Statut & notes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <form key={s} action={updateLeadStatus.bind(null, lead.id, s)}>
                <button className={`px-3 py-1 text-xs ${lead.status === s ? "bg-signal text-ink" : "border border-rule bg-transparent hover:border-bone"}`}>
                  {s}
                </button>
              </form>
            ))}
          </div>
          <form action={saveLeadNotes.bind(null, lead.id)} className="mt-4">
            <textarea name="notes" defaultValue={lead.notes ?? ""} rows={5} className="field" placeholder="Notes…" />
            <button className="btn-ghost mt-2">Enregistrer</button>
          </form>
        </div>
      </div>

      <div className="mt-6 border border-rule bg-ink-raised p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Séquence de relance</h2>
          {followUps.some((f) => f.status === "draft") && (
            <form action={stopFollowUps.bind(null, lead.id, "replied")}>
              <button className="bg-valid px-3 py-1.5 text-xs font-semibold text-ink">
                Il a répondu / call réservé — arrêter la séquence
              </button>
            </form>
          )}
        </div>
        {followUps.length === 0 ? (
          <p className="mt-2 text-sm text-bone-faint">
            Aucune relance générée. Lancez <code className="bg-ink-raised px-1">pnpm toolkit relance &quot;{lead.email}&quot;</code>
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {followUps.map((f) => (
              <details key={f.id} className="border border-rule p-3">
                <summary className="cursor-pointer text-sm">
                  <strong>Relance {f.step}</strong>
                  <span className="text-bone-faint"> · prévue le {new Date(f.scheduled_for).toLocaleDateString("fr-FR")}</span>
                  <span className={`ml-2 px-1.5 py-0.5 text-xs ${
                    f.status === "sent" ? "bg-ink-raised text-valid"
                    : f.status === "replied" ? "bg-signal text-ink"
                    : f.status === "skipped" ? "bg-ink-raised text-bone-faint"
                    : "bg-ink-raised text-bone"}`}>
                    {f.status === "sent" ? `envoyée le ${new Date(f.sent_at).toLocaleDateString("fr-FR")}` : f.status}
                  </span>
                </summary>
                <p className="mt-2 text-sm"><strong>Objet :</strong> {f.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap bg-ink-raised p-3 text-xs text-bone-dim">{f.body}</pre>
                {f.status === "draft" && (
                  <form action={markFollowUpSent.bind(null, f.id, lead.id)} className="mt-2">
                    <button className="bg-signal px-3 py-1.5 text-xs font-semibold text-ink">Marquer comme envoyé</button>
                  </form>
                )}
              </details>
            ))}
          </div>
        )}
      </div>

      <details className="mt-6 border border-rule bg-ink-raised p-5">
        <summary className="cursor-pointer font-semibold">Données brutes (scan)</summary>
        <pre className="mt-3 overflow-x-auto bg-ink-sunken p-4 text-xs text-bone-dim">{JSON.stringify(scan, null, 2)}</pre>
      </details>
    </div>
  );
}
