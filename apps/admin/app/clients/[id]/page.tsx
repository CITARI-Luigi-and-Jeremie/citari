import { notFound } from "next/navigation";
import { getDb, unwrap } from "@geo/core";
import {
  addClientData,
  launchRescan,
  saveTaskNotes,
  scheduleRescan,
  toggleTask,
  updateCitationStatus,
  updateClient,
} from "@/app/actions";

export const dynamic = "force-dynamic";

const CITATION_STATUSES: Record<string, string> = {
  todo: "À contacter",
  sent: "Envoyé",
  followed_up: "Relancé",
  obtained: "Obtenu",
};

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { data: client } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();

  const sprints = unwrap(await db.from("sprints").select("*").eq("client_id", id).order("created_at")) as any[];
  const sprint = sprints[0];
  const tasks = sprint
    ? (unwrap(await db.from("sprint_tasks").select("*").eq("sprint_id", sprint.id).order("position")) as any[])
    : [];
  const deliverables = unwrap(await db.from("deliverables").select("*").eq("client_id", id).order("created_at")) as any[];
  const citations = unwrap(await db.from("citation_targets").select("*").eq("client_id", id).order("created_at")) as any[];
  const clientData = unwrap(await db.from("client_data").select("*").eq("client_id", id).order("created_at")) as any[];
  const scans = unwrap(
    await db.from("scans").select("id,score,status,report_token,previous_scan_id,created_at").eq("client_id", id).order("created_at")
  ) as any[];
  const initialScan = client.initial_scan_id
    ? ((await db.from("scans").select("id,score,report_token,created_at").eq("id", client.initial_scan_id).maybeSingle()).data as any)
    : null;

  const webUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div>
      <a href="/clients" className="text-sm text-slate-500">← Clients</a>
      <h1 className="mt-2 text-2xl font-bold">{client.brand}</h1>
      <p className="text-sm text-slate-500">{client.sector} · {client.url}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Fiche client */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Fiche client</h2>
          <form action={updateClient.bind(null, client.id)} className="mt-3 space-y-2 text-sm">
            <input name="contact_name" defaultValue={client.contact_name ?? ""} placeholder="Nom du contact" className="w-full rounded border border-slate-300 px-2 py-1.5" />
            <input name="contact_email" defaultValue={client.contact_email ?? ""} placeholder="Email du contact" className="w-full rounded border border-slate-300 px-2 py-1.5" />
            <textarea name="site_access" defaultValue={client.site_access ?? ""} placeholder="Accès site (CMS, repo, contact dev…)" rows={3} className="w-full rounded border border-slate-300 px-2 py-1.5" />
            <button className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">Enregistrer</button>
          </form>

          <h3 className="mt-5 text-sm font-semibold">Données collectées au call (prix, différenciateurs, chiffres…)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {clientData.map((d) => (
              <li key={d.id}><strong>{d.key}</strong> : {d.value}</li>
            ))}
          </ul>
          <form action={addClientData.bind(null, client.id)} className="mt-2 flex gap-2 text-sm">
            <input name="key" placeholder="Clé (ex. prix)" className="w-32 rounded border border-slate-300 px-2 py-1.5" />
            <input name="value" placeholder="Valeur" className="flex-1 rounded border border-slate-300 px-2 py-1.5" />
            <button className="rounded bg-slate-800 px-3 text-xs font-semibold text-white">+</button>
          </form>
        </div>

        {/* Re-scan J+90 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Scans & re-scan J+90</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {initialScan && (
              <li>
                Scan initial ({new Date(initialScan.created_at).toLocaleDateString("fr-FR")}) — score {initialScan.score ?? "—"} ·{" "}
                {initialScan.report_token && <a className="text-accent underline" target="_blank" href={`${webUrl}/rapport/${initialScan.report_token}`}>rapport</a>}
              </li>
            )}
            {scans.map((s) => (
              <li key={s.id}>
                Re-scan ({new Date(s.created_at).toLocaleDateString("fr-FR")}) — {s.status} · score {s.score ?? "—"} ·{" "}
                {s.report_token && <a className="text-accent underline" target="_blank" href={`${webUrl}/rapport/${s.report_token}`}>rapport avant/après</a>}
              </li>
            ))}
          </ul>
          <form action={scheduleRescan.bind(null, client.id)} className="mt-4 flex items-center gap-2 text-sm">
            <label className="text-slate-500">Planifié le</label>
            <input type="date" name="rescan_due_at" defaultValue={client.rescan_due_at ?? ""} className="rounded border border-slate-300 px-2 py-1.5" />
            <button className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">Planifier</button>
          </form>
          <form action={launchRescan.bind(null, client.id)} className="mt-2">
            <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
              Lancer le re-scan maintenant (mêmes requêtes)
            </button>
          </form>
        </div>
      </div>

      {/* Checklist de sprint */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">
          Checklist du sprint {sprint ? `(démarré le ${new Date(sprint.starts_at ?? sprint.created_at).toLocaleDateString("fr-FR")})` : ""}
          <span className="ml-2 text-sm font-normal text-slate-500">
            {tasks.filter((t) => t.done).length}/{tasks.length} faites
          </span>
        </h2>
        {[1, 2, 3, 4].map((week) => (
          <div key={week} className="mt-4">
            <h3 className="text-sm font-bold text-slate-500">Semaine {week}</h3>
            <ul className="mt-1 space-y-1">
              {tasks.filter((t) => t.week === week).map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <form action={toggleTask.bind(null, t.id, client.id, !t.done)}>
                    <button className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-xs ${t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"}`}>
                      {t.done ? "✓" : ""}
                    </button>
                  </form>
                  <div className="flex-1">
                    <span className={t.done ? "text-slate-400 line-through" : ""}>{t.label}</span>
                    <details className="mt-0.5">
                      <summary className="cursor-pointer text-xs text-slate-400">notes{t.notes ? " ·" : ""} {t.notes ? t.notes.slice(0, 60) : ""}</summary>
                      <form action={saveTaskNotes.bind(null, t.id, client.id)} className="mt-1 flex gap-2">
                        <input name="notes" defaultValue={t.notes ?? ""} className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs" />
                        <button className="rounded bg-slate-800 px-2 text-xs text-white">OK</button>
                      </form>
                    </details>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Livrables */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Livrables générés par le toolkit</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {deliverables.map((d) => (
            <li key={d.id}>
              <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs">{d.kind}</span>
              {d.title} {d.path && <code className="text-xs text-slate-400">{d.path}</code>}
            </li>
          ))}
          {deliverables.length === 0 && <li className="text-slate-400">Aucun livrable — utilisez `pnpm toolkit …`.</li>}
        </ul>
      </div>

      {/* Citations externes */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Citations externes (Chantier 3)</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs text-slate-500">
              <th className="py-1">Source</th><th>Type</th><th>Difficulté</th><th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {citations.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="py-1.5">{c.url ? <a className="text-accent underline" target="_blank" href={c.url}>{c.source}</a> : c.source}</td>
                <td className="text-slate-500">{c.type}</td>
                <td className="text-slate-500">{c.difficulty}</td>
                <td>
                  <div className="flex gap-1">
                    {Object.entries(CITATION_STATUSES).map(([value, label]) => (
                      <form key={value} action={updateCitationStatus.bind(null, c.id, client.id, value)}>
                        <button className={`rounded px-2 py-0.5 text-xs ${c.status === value ? "bg-accent text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
                          {label}
                        </button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {citations.length === 0 && (
              <tr><td colSpan={4} className="py-3 text-slate-400">Aucune cible — lancez `pnpm toolkit citation-targets`.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
