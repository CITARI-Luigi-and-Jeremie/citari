import { getDb, unwrap } from "@geo/core";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = unwrap(await getDb().from("clients").select("*").order("created_at", { ascending: false })) as any[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Clients</h1>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2">Marque</th><th>Secteur</th><th>Contact</th><th>Re-scan J+90</th><th>Depuis</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-slate-200 hover:bg-white">
              <td className="py-2"><a className="text-accent underline" href={`/clients/${c.id}`}>{c.brand}</a></td>
              <td className="text-slate-500">{c.sector}</td>
              <td className="text-slate-500">{c.contact_email ?? "—"}</td>
              <td>{c.rescan_due_at ? new Date(c.rescan_due_at).toLocaleDateString("fr-FR") : <span className="text-slate-300">non planifié</span>}</td>
              <td className="text-slate-500">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-slate-400">Aucun client. Convertissez un lead !</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
