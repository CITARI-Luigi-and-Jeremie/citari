import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { lancerPremium, listerReservations } from "@/lib/equipe.functions";
import { dateFr } from "@/lib/typo";

/**
 * /equipe : le suivi des réservations Calendly, et le lancement du scan
 * premium. Page INTERNE, sur le site parce que Luigi ne veut ni serveur ni
 * domaine de plus (15/08/2026) : elle voyage avec citari.fr, se protège par
 * le mot de passe admin (le même que le back-office local), et n'existe
 * qu'ici — pas de doublon avec apps/admin, qui garde leads et clients.
 *
 * Le bouton « Lancer » crée le scan complet puis OUVRE l'écran de mesure
 * /scan/$id : c'est lui qui pilote la mesure, exactement comme le
 * navigateur d'un prospect. Un seul moteur, une seule mécanique.
 */

const TITLE = "Équipe · Citari";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: TITLE },
      // Page interne : jamais indexée, jamais décrite.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PageEquipe,
});

type Ligne = {
  id: string;
  created_at: string;
  email: string | null;
  brand: string;
  website: string | null;
  premium_launched_at: string | null;
  apercu: { id: string; score_global: number | null; report_token: string; sector: string; city: string | null } | null;
  premium: {
    id: string;
    status: string;
    phase: string;
    score_global: number | null;
    report_token: string;
    completed_at: string | null;
  } | null;
};

function PageEquipe() {
  const lister = useServerFn(listerReservations);
  const lancer = useServerFn(lancerPremium);

  const [motDePasse, setMotDePasse] = useState("");
  const [saisie, setSaisie] = useState("");
  const [refus, setRefus] = useState(false);
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(
    async (mdp: string) => {
      const r = await lister({ data: { motDePasse: mdp } });
      if (!r.autorise) {
        setRefus(true);
        setMotDePasse("");
        try {
          sessionStorage.removeItem("citari:equipe");
        } catch {
          /* sans stockage, on retape le mot de passe */
        }
        return;
      }
      setRefus(false);
      setLignes(r.lignes as unknown as Ligne[]);
    },
    [lister],
  );

  // Reprise de session : le mot de passe déjà validé dans cet onglet.
  useEffect(() => {
    try {
      const garde = sessionStorage.getItem("citari:equipe");
      if (garde) {
        setMotDePasse(garde);
        void charger(garde);
      }
    } catch {
      /* rien : la porte reste fermée */
    }
  }, [charger]);

  const entrer = async (e: React.FormEvent) => {
    e.preventDefault();
    const mdp = saisie.trim();
    if (!mdp) return;
    setMotDePasse(mdp);
    try {
      sessionStorage.setItem("citari:equipe", mdp);
    } catch {
      /* sans stockage, la session ne survivra pas au rechargement */
    }
    await charger(mdp);
  };

  const lancerScanPremium = async (reservationId: string) => {
    setEnCours(reservationId);
    setErreur(null);
    try {
      const r = await lancer({ data: { motDePasse, reservationId } });
      if (!r.ok) {
        setErreur(r.erreur ?? "Le lancement a échoué.");
        return;
      }
      // L'écran de mesure pilote le scan : on l'ouvre et on suit en direct.
      window.open(`/scan/${r.scanId}`, "_blank", "noopener");
      await charger(motDePasse);
    } finally {
      setEnCours(null);
    }
  };

  // ---------------------------------------------------------------- porte
  if (!motDePasse || refus || lignes === null) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
        <p className="mono text-[12px] uppercase tracking-[0.14em] text-ink-2">Équipe Citari</p>
        <h1 className="mt-2 text-[28px]">Réservations</h1>
        <form onSubmit={entrer} className="mt-6">
          <label htmlFor="mdp" className="mono block text-[13px] text-ink-2">
            Mot de passe
          </label>
          <input
            id="mdp"
            type="password"
            autoComplete="current-password"
            className="field mt-1.5 w-full"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            autoFocus
          />
          {refus ? (
            <p className="mono mt-2 text-[13px] text-signal">Mot de passe refusé.</p>
          ) : null}
          <button type="submit" className="cta mt-4 w-full">
            Entrer
          </button>
        </form>
      </div>
    );
  }

  // --------------------------------------------------------------- tableau
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="mono text-[12px] uppercase tracking-[0.14em] text-ink-2">Équipe Citari</p>
          <h1 className="mt-1 text-[32px] sm:text-[40px]">Réservations</h1>
        </div>
        <button
          type="button"
          onClick={() => charger(motDePasse)}
          className="mono text-[13px] text-ink-2 underline underline-offset-4 hover:text-ink"
        >
          Actualiser
        </button>
      </div>

      <p className="measure mt-3 text-[15px] text-ink-2">
        Une ligne par réservation Calendly confirmée depuis le site. « Lancer » crée la mesure
        complète puis ouvre l'écran de scan, qui la pilote en direct : comptez neuf minutes,
        environ 1 € d'API, et vérifiez les soldes moteurs avant un jour de démos.
      </p>

      {lignes.length === 0 ? (
        <div className="mt-12 border-t border-rule-strong pt-8">
          <p className="text-[17px]">Aucune réservation captée pour l'instant.</p>
          <p className="measure mt-2 text-[14px] text-ink-2">
            Les réservations faites dans la fenêtre Calendly du site apparaissent ici toutes
            seules. Celles prises par un lien direct (email, page scan premium) arrivent par
            l'email de notification Calendly : comparez en cas de doute.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[860px] border-t-2 border-ink text-left">
            <thead>
              <tr className="mono text-[11px] uppercase tracking-[0.1em] text-ink-2">
                <th className="py-3 pr-4 font-normal">Réservé le</th>
                <th className="py-3 pr-4 font-normal">Entreprise</th>
                <th className="py-3 pr-4 font-normal">Email</th>
                <th className="py-3 pr-4 font-normal">Scan gratuit</th>
                <th className="py-3 pr-4 font-normal">Scan premium</th>
                <th className="py-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const premiumFini = l.premium?.status === "done" || Boolean(l.premium?.completed_at);
                return (
                  <tr key={l.id} className="border-t border-rule align-top">
                    <td className="num whitespace-nowrap py-4 pr-4 text-[13px]">
                      {dateFr(l.created_at)}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-[15px] font-semibold">{l.brand}</span>
                      {l.website ? (
                        <span className="mono block text-[12px] text-ink-2">{l.website}</span>
                      ) : null}
                      {l.apercu?.sector ? (
                        <span className="mono block text-[12px] text-ink-3">
                          {l.apercu.sector}
                          {l.apercu.city ? ` · ${l.apercu.city}` : ""}
                        </span>
                      ) : null}
                    </td>
                    <td className="mono py-4 pr-4 text-[13px]">{l.email ?? "—"}</td>
                    <td className="py-4 pr-4">
                      {l.apercu ? (
                        <a
                          href={`/rapport/${l.apercu.report_token}`}
                          target="_blank"
                          rel="noopener"
                          className="num text-[14px] underline underline-offset-4 hover:text-signal"
                        >
                          {l.apercu.score_global ?? "?"}/100
                        </a>
                      ) : (
                        <span className="mono text-[13px] text-ink-3">—</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      {!l.premium ? (
                        <span className="mono text-[13px] text-ink-3">pas lancé</span>
                      ) : premiumFini ? (
                        <a
                          href={`/rapport/${l.premium.report_token}`}
                          target="_blank"
                          rel="noopener"
                          className="num text-[14px] underline underline-offset-4 hover:text-signal"
                        >
                          {l.premium.score_global ?? "?"}/100 · rapport
                        </a>
                      ) : (
                        <a
                          href={`/scan/${l.premium.id}`}
                          target="_blank"
                          rel="noopener"
                          className="mono text-[13px] text-signal underline underline-offset-4"
                        >
                          en cours · suivre
                        </a>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {!l.premium ? (
                        <button
                          type="button"
                          disabled={enCours === l.id}
                          onClick={() => lancerScanPremium(l.id)}
                          className="cta whitespace-nowrap px-4 py-2 text-[14px] disabled:opacity-60"
                        >
                          {enCours === l.id ? "Création…" : "Lancer le scan premium"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {erreur ? <p className="mono mt-6 text-[13px] text-signal">{erreur}</p> : null}
    </div>
  );
}
