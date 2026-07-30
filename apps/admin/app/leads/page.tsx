import { getDb, unwrap } from "@geo/core";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  call_booked: "Call réservé",
  client: "Client",
  lost: "Perdu",
};

export default async function LeadsPage() {
  const db = getDb();
  const leads = unwrap(await db.from("leads").select("*").order("created_at", { ascending: false })) as any[];
  const scans = unwrap(
    await db.from("scans").select("id,brand,sector,score,status,email,created_at").order("created_at", { ascending: false }).limit(50)
  ) as any[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Leads</h1>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2">Email</th><th>Marque</th><th>Secteur</th><th>Score</th><th>Date</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-b border-slate-200 hover:bg-white">
              <td className="py-2"><a className="text-accent underline" href={`/leads/${l.id}`}>{l.email}</a></td>
              <td>{l.brand}</td>
              <td className="text-slate-500">{l.sector}</td>
              <td className="font-semibold">{l.score ?? "—"}</td>
              <td className="text-slate-500">{new Date(l.created_at).toLocaleDateString("fr-FR")}</td>
              <td><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{STATUS_LABELS[l.status] ?? l.status}</span></td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-slate-400">Aucun lead pour l'instant.</td></tr>
          )}
        </tbody>
      </table>

      <h2 className="mt-12 text-lg font-bold">50 derniers scans (avec ou sans email)</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2">Marque</th><th>Secteur</th><th>Score</th><th>Statut</th><th>Email</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id} className="border-b border-slate-200">
              <td className="py-2">{s.brand}</td>
              <td className="text-slate-500">{s.sector}</td>
              <td className="font-semibold">{s.score ?? "—"}</td>
              <td className="text-xs text-slate-500">{s.status}</td>
              <td className="text-slate-500">{s.email ?? <span className="text-slate-300">non capturé</span>}</td>
              <td className="text-slate-500">{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
