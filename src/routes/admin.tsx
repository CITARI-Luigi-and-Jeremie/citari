import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Btn, Champ, Etiquette, Label } from "@/components/kit";
import { chargerAdmin, majLead, type ClientAdmin, type LeadAdmin } from "@/lib/admin.functions";
import { dateFr, euros, fr, groupe } from "@/lib/typo";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Back-office — GEO Sprint" },
      { name: "description", content: "Espace de gestion interne des scans, prospects et missions." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Back-office — GEO Sprint" },
      { property: "og:description", content: "Espace interne." },
    ],
  }),
  component: Page,
});

const STATUTS = ["nouveau", "contacté", "call_planifié", "proposition", "gagné", "perdu"] as const;

type Donnees = Awaited<ReturnType<typeof chargerAdmin>>;

function Page() {
  const charger = useServerFn(chargerAdmin);
  const [motDePasse, setMotDePasse] = useState("");
  const [session, setSession] = useState<string | null>(null);
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    const s = sessionStorage.getItem("geo-admin");
    if (s) setSession(s);
  }, []);

  useEffect(() => {
    if (!session) return;
    setChargement(true);
    charger({ data: { motDePasse: session } })
      .then((d) => {
        setDonnees(d);
        setErreur(null);
      })
      .catch((e: Error) => {
        setErreur(e.message);
        sessionStorage.removeItem("geo-admin");
        setSession(null);
      })
      .finally(() => setChargement(false));
  }, [session, charger]);

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-6">
        <h1 className="text-[38px] leading-none">Back-office</h1>
        <form
          className="mt-8 border-t border-rule-strong pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem("geo-admin", motDePasse);
            setSession(motDePasse);
          }}
        >
          <Label className="pb-2">mot de passe</Label>
          <Champ
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="current-password"
          />
          {erreur && <p className="mt-3 text-[13px] text-bordeaux">{erreur}</p>}
          <Btn className="mt-5 w-full" type="submit">
            Entrer
          </Btn>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-10 lg:px-10">
      <header className="flex items-baseline justify-between border-b border-rule-strong pb-3">
        <h1 className="font-display text-[26px] leading-none">Back-office</h1>
        <button
          className="label-xs hover:text-bordeaux"
          onClick={() => {
            sessionStorage.removeItem("geo-admin");
            setSession(null);
            setDonnees(null);
          }}
        >
          quitter
        </button>
      </header>

      {chargement && !donnees && <p className="mt-8 text-[14px] text-ink-3">Chargement…</p>}
      {erreur && <p className="mt-8 text-[14px] text-bordeaux">{erreur}</p>}

      {donnees && (
        <>
          <dl className="mt-8 grid grid-cols-2 border-t border-rule-strong lg:grid-cols-4">
            {[
              ["scans", groupe(donnees.stats.scans)],
              ["prospects", groupe(donnees.stats.leads)],
              ["convertis", groupe(donnees.stats.convertis)],
              ["facturé", euros(donnees.stats.chiffre)],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-r border-rule px-4 py-5 last:border-r-0">
                <dt className="label-xs">{k}</dt>
                <dd className="num mt-1 text-[30px] leading-none">{v}</dd>
              </div>
            ))}
          </dl>

          <Section titre="Prospects">
            <TableLeads leads={donnees.leads} motDePasse={session} onMaj={() => setSession(session)} />
          </Section>

          <Section titre="Scans récents">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-rule-strong">
                  {["date", "marque", "secteur", "statut", "score", "rapport"].map((h) => (
                    <th key={h} className="label-xs py-2 pr-4 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donnees.scans.map((s) => (
                  <tr key={s.id} className="border-b border-rule">
                    <td className="num py-2 pr-4 text-ink-3">{dateFr(s.created_at)}</td>
                    <td className="py-2 pr-4 font-medium">{s.brand_name}</td>
                    <td className="py-2 pr-4 text-ink-2">
                      {[s.sector, s.city].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <Etiquette ton={s.status === "termine" ? "neutre" : "bordeaux"}>{s.status}</Etiquette>
                    </td>
                    <td className="num py-2 pr-4">{s.score_global ?? "—"}</td>
                    <td className="py-2">
                      {s.report_token ? (
                        <a className="underline hover:text-bordeaux" href={`/rapport/${s.report_token}`}>
                          ouvrir
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section titre="Clients">
            {donnees.clients.length === 0 ? (
              <p className="py-4 text-[14px] text-ink-3">{fr("Aucun client enregistré pour le moment.")}</p>
            ) : (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-y border-rule-strong">
                    {["date", "marque", "contact", "offre", "montant", "facture"].map((h) => (
                      <th key={h} className="label-xs py-2 pr-4 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donnees.clients.map((c: ClientAdmin) => (
                    <tr key={c.id} className="border-b border-rule">
                      <td className="num py-2 pr-4 text-ink-3">{dateFr(c.created_at)}</td>
                      <td className="py-2 pr-4 font-medium">{c.brand_name}</td>
                      <td className="py-2 pr-4 text-ink-2">{c.contact_email ?? "—"}</td>
                      <td className="py-2 pr-4 text-ink-2">{c.offer ?? "—"}</td>
                      <td className="num py-2 pr-4">{c.amount_eur ? euros(c.amount_eur) : "—"}</td>
                      <td className="py-2 pr-4">{c.invoice_status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-[24px] leading-none">{titre}</h2>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function TableLeads({
  leads,
  motDePasse,
  onMaj,
}: {
  leads: LeadAdmin[];
  motDePasse: string;
  onMaj: () => void;
}) {
  const maj = useServerFn(majLead);
  const [ouvert, setOuvert] = useState<string | null>(null);

  if (leads.length === 0) {
    return <p className="py-4 text-[14px] text-ink-3">{fr("Aucun prospect pour le moment.")}</p>;
  }

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-y border-rule-strong">
          {["date", "email", "marque", "score", "statut", "notes"].map((h) => (
            <th key={h} className="label-xs py-2 pr-4 text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {leads.map((l) => (
          <tr key={l.id} className="border-b border-rule align-top">
            <td className="num py-2 pr-4 text-ink-3">{dateFr(l.created_at)}</td>
            <td className="py-2 pr-4">
              <span className="font-medium">{l.email}</span>
              {l.first_name && <span className="block text-ink-3">{l.first_name}</span>}
            </td>
            <td className="py-2 pr-4">
              {l.scan?.report_token ? (
                <a className="underline hover:text-bordeaux" href={`/rapport/${l.scan.report_token}`}>
                  {l.scan.brand_name}
                </a>
              ) : (
                (l.company ?? "—")
              )}
            </td>
            <td className="num py-2 pr-4">{l.scan?.score_global ?? "—"}</td>
            <td className="py-2 pr-4">
              <select
                className="border border-rule-strong bg-transparent px-2 py-1 text-[12px]"
                value={l.status}
                onChange={async (e) => {
                  await maj({ data: { motDePasse, id: l.id, champs: { status: e.target.value } } });
                  onMaj();
                }}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
            <td className="py-2">
              {ouvert === l.id ? (
                <textarea
                  autoFocus
                  defaultValue={l.notes ?? ""}
                  rows={3}
                  className="w-full min-w-[220px] border border-rule-strong bg-transparent p-2 text-[12px]"
                  onBlur={async (e) => {
                    await maj({ data: { motDePasse, id: l.id, champs: { notes: e.target.value } } });
                    setOuvert(null);
                    onMaj();
                  }}
                />
              ) : (
                <button className="text-left text-ink-2 hover:text-bordeaux" onClick={() => setOuvert(l.id)}>
                  {l.notes || "ajouter une note"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
