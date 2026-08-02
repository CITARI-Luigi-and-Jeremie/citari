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

/** Statuts canoniques des cibles de citation (les mêmes que le toolkit). */
const CITATION_STATUSES: Record<string, string> = {
  a_faire: "À contacter",
  envoyee: "Envoyé",
  relancee: "Relancé",
  obtenue: "Obtenu",
  refusee: "Refusé",
};

const WEEK_LABELS: Record<number, string> = {
  1: "Semaine 1 — technique",
  2: "Semaine 2 — contenu",
  3: "Semaine 3 — placement",
  4: "Semaine 4 — preuves et clôture",
  5: "Après le sprint — J+45 et J+90",
};

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { data: client } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();

  const sprints = unwrap(await db.from("sprints").select("*").eq("client_id", id).order("created_at")) as any[];
  const sprint = sprints[sprints.length - 1];
  const tasks = sprint
    ? (unwrap(await db.from("sprint_tasks").select("*").eq("sprint_id", sprint.id).order("position")) as any[])
    : [];
  const deliverables = unwrap(await db.from("deliverables").select("*").eq("client_id", id).order("created_at")) as any[];
  const citations = sprints.length
    ? (unwrap(await db.from("citation_targets").select("*").in("sprint_id", sprints.map((s) => s.id)).order("created_at")) as any[])
    : [];
  const clientData = unwrap(await db.from("client_data").select("*").eq("client_id", id).order("created_at")) as any[];

  // Le scan initial est clients.scan_id ; les re-scans et contrôles pointent
  // vers lui par previous_scan_id.
  const initialScan = client.scan_id
    ? ((await db.from("scans").select("id,score_global,mode,report_token,created_at").eq("id", client.scan_id).maybeSingle()).data as any)
    : null;
  const suivis = client.scan_id
    ? (unwrap(
        await db
          .from("scans")
          .select("id,score_global,mode,status,report_token,created_at")
          .eq("previous_scan_id", client.scan_id)
          .order("created_at")
      ) as any[])
    : [];

  const webUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const fmtScore = (s: any) => (s != null ? Math.round(Number(s)) : "—");

  return (
    <div>
      <a href="/clients" className="text-sm text-ink-faint">← Clients</a>
      <h1 className="mt-2 text-2xl font-bold">{client.brand_name}</h1>
      <p className="text-sm text-ink-faint">{client.sector ?? ""} · {client.website_url ?? "site non renseigné"}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Fiche client */}
        <div className="border border-rule bg-paper-raised p-5">
          <h2 className="font-semibold">Fiche client</h2>
          <form action={updateClient.bind(null, client.id)} className="mt-3 space-y-2 text-sm">
            <input name="contact_name" defaultValue={client.contact_name ?? ""} placeholder="Nom du contact" className="field" />
            <input name="contact_email" defaultValue={client.contact_email ?? ""} placeholder="Email du contact" className="field" />
            <input name="website_url" defaultValue={client.website_url ?? ""} placeholder="Site (https://…)" className="field" />
            <textarea name="notes" defaultValue={client.notes ?? ""} placeholder="Notes (accès site, CMS, contact dev…)" rows={3} className="field" />
            <button className="btn-ghost">Enregistrer</button>
          </form>

          <h3 className="mt-5 text-sm font-semibold">Données collectées au call (panier moyen, prix, chiffres…)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {clientData.map((d) => (
              <li key={d.id}><strong>{d.key}</strong> : {d.value}</li>
            ))}
          </ul>
          <form action={addClientData.bind(null, client.id)} className="mt-2 flex gap-2 text-sm">
            <input name="key" placeholder="Clé (ex. panier_moyen)" className="field" />
            <input name="value" placeholder="Valeur" className="field" />
            <button className="bg-paper-raised px-3 text-xs font-semibold text-ink">+</button>
          </form>
        </div>

        {/* Scans & re-scan J+90 */}
        <div className="border border-rule bg-paper-raised p-5">
          <h2 className="font-semibold">Scans, contrôle J+45 et re-scan J+90</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {initialScan && (
              <li>
                Scan initial ({new Date(initialScan.created_at).toLocaleDateString("fr-FR")}) — score {fmtScore(initialScan.score_global)} ·{" "}
                {initialScan.report_token && <a className="text-signal underline" target="_blank" href={`${webUrl}/rapport/${initialScan.report_token}`}>rapport</a>}
              </li>
            )}
            {suivis.map((s) => (
              <li key={s.id}>
                {s.mode === "controle" ? "Contrôle J+45 (interne)" : "Re-scan J+90"} ({new Date(s.created_at).toLocaleDateString("fr-FR")}) — {s.status} · score {fmtScore(s.score_global)} ·{" "}
                {s.status === "running" && <a className="text-signal underline" target="_blank" href={`${webUrl}/scan/${s.id}`}>piloter la collecte</a>}
                {s.report_token && s.status === "done" && s.mode !== "controle" && (
                  <a className="text-signal underline" target="_blank" href={`${webUrl}/rapport/${s.report_token}`}>rapport avant/après</a>
                )}
              </li>
            ))}
          </ul>
          <form action={scheduleRescan.bind(null, client.id)} className="mt-4 flex items-center gap-2 text-sm">
            <label className="text-ink-faint">J+90 planifié le</label>
            <input type="date" name="rescan_due_on" defaultValue={sprint?.rescan_due_on ?? ""} className="field" />
            <button className="btn-ghost">Planifier</button>
          </form>
          <form action={launchRescan.bind(null, client.id)} className="mt-2">
            <button className="btn-signal">
              Ouvrir le re-scan J+90 (mêmes questions)
            </button>
          </form>
          <p className="mt-1 text-xs text-ink-faint">
            La collecte se pilote ensuite depuis la page du scan (lien « piloter la collecte » ci-dessus).
          </p>
        </div>
      </div>

      {/* Checklist des 90 jours */}
      <div className="mt-6 border border-rule bg-paper-raised p-5">
        <h2 className="font-semibold">
          Checklist des 90 jours {sprint ? `(démarré le ${new Date(sprint.started_on ?? sprint.created_at).toLocaleDateString("fr-FR")})` : ""}
          <span className="ml-2 text-sm font-normal text-ink-faint">
            {tasks.filter((t) => t.done).length}/{tasks.length} faites
          </span>
        </h2>
        {[1, 2, 3, 4, 5].map((week) => (
          <div key={week} className="mt-4">
            <h3 className="text-sm font-bold text-ink-faint">{WEEK_LABELS[week] ?? `Semaine ${week}`}</h3>
            <ul className="mt-1 space-y-1">
              {tasks.filter((t) => t.week === week).map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <form action={toggleTask.bind(null, t.id, client.id, !t.done)}>
                    <button className={`mt-1 flex h-5 w-5 items-center justify-center border text-xs ${t.done ? "border-valid bg-valid text-paper" : "border-rule-strong bg-paper-raised"}`}>
                      {t.done ? "✓" : ""}
                    </button>
                  </form>
                  <div className="flex-1">
                    <span className={t.done ? "text-ink-faint line-through" : ""}>{t.label}</span>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-ink-faint">notes{t.notes ? " ·" : ""} {t.notes ? t.notes.slice(0, 60) : ""}</summary>
                      <form action={saveTaskNotes.bind(null, t.id, client.id)} className="mt-1 flex gap-2">
                        <input name="notes" defaultValue={t.notes ?? ""} className="field" />
                        <button className="bg-paper-raised px-2 text-xs text-ink">OK</button>
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
      <div className="mt-6 border border-rule bg-paper-raised p-5">
        <h2 className="font-semibold">Livrables générés par le toolkit</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {deliverables.map((d) => (
            <li key={d.id}>
              <span className="mr-2 bg-paper-raised px-2 py-1 text-xs">{d.kind}</span>
              {d.title} {d.local_path && <code className="text-xs text-ink-faint">{d.local_path}</code>}
            </li>
          ))}
          {deliverables.length === 0 && <li className="text-ink-faint">Aucun livrable — utilisez `pnpm toolkit …`.</li>}
        </ul>
      </div>

      {/* Citations externes */}
      <div className="mt-6 border border-rule bg-paper-raised p-5">
        <h2 className="font-semibold">Citations externes (Chantier 3)</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule-strong text-left text-xs text-ink-faint">
              <th className="py-1">Source</th><th>Notes</th><th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {citations.map((c) => (
              <tr key={c.id} className="border-b border-rule">
                <td className="py-2">{c.url ? <a className="text-signal underline" target="_blank" href={c.url}>{c.name}</a> : c.name}</td>
                <td className="max-w-md text-xs text-ink-faint">{c.notes ? c.notes.split("\n")[0] : ""}</td>
                <td>
                  <div className="flex gap-1">
                    {Object.entries(CITATION_STATUSES).map(([value, label]) => (
                      <form key={value} action={updateCitationStatus.bind(null, c.id, client.id, value)}>
                        <button className={`px-2 py-1 text-xs ${c.status === value ? "bg-signal text-paper" : "border border-rule bg-transparent hover:border-ink"}`}>
                          {label}
                        </button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {citations.length === 0 && (
              <tr><td colSpan={3} className="py-3 text-ink-faint">Aucune cible — lancez `pnpm toolkit citation-targets`.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
