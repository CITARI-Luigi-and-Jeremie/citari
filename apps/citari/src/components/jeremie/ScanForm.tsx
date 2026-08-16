import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { brandFromDomain } from "@/lib/site";
import { lancerScan } from "@/lib/scan.functions";
import { useScanFormFocus } from "@/lib/scan-form-focus";
import { suivreEvenement } from "@/lib/analytics";
import { LogosMoteurs } from "@/components/jeremie/LogosMoteurs";

/**
 * Formulaire de lancement du scan.
 *
 * Habillage porté du projet Lovable de Jérémie le 07/08/2026 ; la soumission,
 * elle, appelle NOTRE fonction serveur `lancerScan`, qui parle à notre
 * orchestrateur et à notre base. Son projet visait une autre base Supabase avec
 * un autre schéma : cette couche-là n'a pas été reprise.
 *
 * Correspondance des champs, à garder en tête si le formulaire évolue :
 *   domaine → url · marque → marque · secteur → secteur
 *   ville   → ville · email  → email  · concurrents → concurrents
 *
 * L'email est obligatoire et demandé à la dernière étape : c'est la
 * contrepartie du scan gratuit, sans elle un visiteur consulte son score et
 * disparaît sans qu'on puisse le rappeler.
 */

/**
 * DEUX étapes depuis le 14/08/2026 : le site, puis l'email.
 *
 * L'étape « concurrents » a été retirée le matin (la mesure les découvre
 * elle-même), puis l'étape « secteur et ville » l'après-midi — décision de
 * Luigi : « si ça ne change rien de le demander, autant le supprimer ». Le
 * métier et la zone sont maintenant DÉDUITS de la page d'accueil pendant la
 * phase « on lit votre site » (`deduireMetier`), et écrits en base pour tout
 * l'aval. Le prospect voit ce qu'on a compris sur l'écran de mesure.
 *
 * Ce qui reste demandé est ce qu'aucune lecture ne peut donner : l'adresse
 * du site, le nom exact de la marque à suivre, et l'email du rapport.
 */
type Etape = 1 | 2;

const TITRE_ETAPE: Record<Etape, string> = {
  1: "Votre site",
  2: "Où envoyons-nous votre rapport ?",
};

export function ScanForm({ centered = false }: { centered?: boolean }) {
  const navigate = useNavigate();
  const demarrer = useServerFn(lancerScan);
  const { registerInput } = useScanFormFocus();

  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<Etape>(1);
  const [domaine, setDomaine] = useState("");
  const [marque, setMarque] = useState("");
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"repos" | "envoi" | "erreur">("repos");
  const [messageErreur, setMessageErreur] = useState<string | null>(null);

  const ouvrir = () => {
    if (!marque) setMarque(brandFromDomain(domaine));
    setEtape(1);
    setOuvert(true);
    // Première marche de l'entonnoir : le visiteur a tapé un domaine et cliqué.
    // C'est l'intention, à distinguer de la visite qui n'a rien fait.
    suivreEvenement("scan_formulaire_ouvert");
  };

  const fermer = () => {
    if (etat === "envoi") return;
    setOuvert(false);
    setEtat("repos");
    setMessageErreur(null);
  };

  const soumettre = async () => {
    setEtat("envoi");
    setMessageErreur(null);
    try {
      const reponse = await demarrer({
        data: {
          marque: marque.trim(),
          url: domaine.trim() || null,
          email: email.trim(),
          // Déduits du site pendant la mesure : voir `deduireMetier`.
          secteur: "",
          ville: null,
          concurrents: [],
          langue: "fr",
          mode: "apercu",
        },
      });

      // Le quota d'IP est rendu comme un message, pas comme une exception :
      // c'est une limite normale, pas une panne, et le visiteur doit le lire.
      if ("erreur" in reponse && reponse.erreur) {
        setEtat("erreur");
        setMessageErreur(reponse.erreur);
        // Un refus se compte : quota d'IP atteint ou marque invalide, ce sont
        // des scans que l'entonnoir a perdus là et nulle part ailleurs.
        suivreEvenement("scan_refuse", { motif: reponse.erreur.slice(0, 100) });
        return;
      }

      // La modale Calendly du rapport préremplit l'email du lead : on le garde
      // dans la session du navigateur, jamais dans l'URL du rapport.
      try {
        sessionStorage.setItem("citari:email", email.trim());
      } catch {
        /* stockage indisponible : la réservation reste possible sans préremplissage. */
      }

      // La conversion qui compte sur ce site : un scan part, et l'email est
      // dans la même soumission — les deux marches du plan initial n'en font
      // plus qu'une depuis que `lancerScan` exige l'adresse.
      //
      // Ni la marque ni l'email ne sont envoyés : Supabase sait déjà QUI a
      // scanné, GA n'a besoin de savoir que COMBIEN. Envoyer l'adresse d'un
      // prospect à Google serait au surplus contraire aux conditions de GA.
      suivreEvenement("scan_lance", { mode: "apercu", deja_en_cache: reponse.cached === true });

      navigate({ to: "/scan/$id", params: { id: reponse.id } });
    } catch (e) {
      setEtat("erreur");
      suivreEvenement("scan_echec");
      // Les messages de validation du serveur sont écrits pour être lus.
      const brut = e instanceof Error ? e.message : "";
      setMessageErreur(
        /email|marque|adresse/i.test(brut)
          ? brut
          : "Le lancement a échoué. Réessayez dans un instant.",
      );
    }
  };

  const suivant = () => {
    if (etape === 1) {
      if (!domaine.trim() || !marque.trim()) return;
      setEtape(2);
      // L'écart entre cette marche et `scan_lance` mesure exactement ce que
      // coûte la demande d'email — le seul frein qu'on ait choisi de poser.
      suivreEvenement("scan_etape_email");
      return;
    }
    void soumettre();
  };

  return (
    <>
      <form
        id="scan-form"
        onSubmit={(e) => {
          e.preventDefault();
          ouvrir();
        }}
        className={centered ? "mx-auto mt-9 max-w-xl" : "mt-8 max-w-xl"}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="domaine" className="sr-only">
            Adresse de votre site
          </label>
          <input
            ref={registerInput}
            id="domaine"
            name="domaine"
            className="field"
            placeholder="votre-site.fr"
            value={domaine}
            onChange={(e) => setDomaine(e.target.value)}
            required
          />
          <button type="submit" className="cta shrink-0 transition-opacity hover:opacity-90">
            Lancer le scan gratuit
          </button>
        </div>

        <p className={`mono mt-4 text-[13px] text-ink-2 ${centered ? "text-center" : ""}`}>
          90 secondes · Aucune réponse simulée · Aucune carte bancaire
        </p>
        <LogosMoteurs centered={centered} />
      </form>

      {ouvert ? (
        <Fenetre
          etape={etape}
          onClose={fermer}
          onSubmit={(e) => {
            e.preventDefault();
            suivant();
          }}
        >
          <div key={etape} className="anim-step">
            {etape === 1 ? (
              <div className="grid gap-4">
                <Champ
                  id="w-domaine"
                  label="Adresse de votre site"
                  value={domaine}
                  onChange={(v) => {
                    setDomaine(v);
                    setMarque(brandFromDomain(v));
                  }}
                  placeholder="votre-site.fr"
                  autoFocus
                  required
                />
                <Champ
                  id="w-marque"
                  label="Nom de votre marque"
                  value={marque}
                  onChange={setMarque}
                  required
                />
                <p className="mono text-[13px] text-ink-2">
                  Votre nom n'apparaîtra jamais dans les questions posées aux moteurs : on
                  mesure si votre marque sort d'elle-même.
                </p>
              </div>
            ) : null}

            {etape === 2 ? (
              <div>
                <label htmlFor="w-email" className="mono block text-[13px] text-ink-2">
                  Votre adresse email professionnelle
                </label>
                <input
                  id="w-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="field mt-1.5 transition-colors focus:border-ink"
                  placeholder="prenom@votre-site.fr"
                  value={email}
                  maxLength={160}
                  required
                  autoFocus
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mono mt-3 text-[13px] text-ink-2">
                  Le scan est offert, sans carte bancaire, limité à 2 scans par jour et par
                  connexion.
                </p>
                <p className="mono mt-2 text-[13px] text-ink-2">
                  Votre adresse sert à vous envoyer les citations relevées et le suivi de votre
                  visibilité. Elle n'est ni revendue, ni transmise.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center gap-3">
            {etape > 1 ? (
              <button
                type="button"
                className="mono text-[13px] text-ink-2 underline underline-offset-4 transition-colors hover:text-ink"
                onClick={() => setEtape((e) => (e > 1 ? ((e - 1) as Etape) : e))}
                disabled={etat === "envoi"}
              >
                ← Retour
              </button>
            ) : null}
            <button
              type="submit"
              className="cta ml-auto transition-opacity hover:opacity-90 disabled:opacity-60"
              disabled={etat === "envoi"}
            >
              {etape === 2 ? (etat === "envoi" ? "Lancement…" : "Démarrer le scan") : "Continuer"}
            </button>
          </div>

          {messageErreur ? (
            <p className="mono mt-3 text-[13px] text-signal">{messageErreur}</p>
          ) : null}
        </Fenetre>
      ) : null}
    </>
  );
}

function Champ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mono block text-[13px] text-ink-2">
        {label}
      </label>
      <input
        id={id}
        className="field mt-1.5 transition-colors focus:border-ink"
        value={value}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Fenetre({
  etape,
  children,
  onClose,
  onSubmit,
}: {
  etape: Etape;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [monte, setMonte] = useState(false);

  useEffect(() => setMonte(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!monte) return null;

  return createPortal(
    <div
      className="anim-veil fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-ink/35 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (!ref.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={TITRE_ETAPE[etape]}
        className="anim-panel my-auto w-full max-w-lg overflow-visible border border-rule-strong bg-paper p-5 will-change-transform sm:p-7"
      >
        <div className="flex items-baseline justify-between">
          <p className="mono text-[13px] text-ink-2">Étape {etape} / 2</p>
          <button
            type="button"
            onClick={onClose}
            className="mono text-[13px] text-ink-2 underline underline-offset-4 transition-colors hover:text-ink"
          >
            Fermer
          </button>
        </div>

        <div
          className="mt-3 h-[3px] w-full bg-paper-2"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={etape}
          aria-label="Progression du formulaire"
        >
          <div
            className="h-full bg-ink transition-[width] duration-500 ease-out"
            style={{ width: `${(etape / 2) * 100}%` }}
          />
        </div>

        <h2 className="mt-4 text-[22px] sm:text-[26px]">{TITRE_ETAPE[etape]}</h2>
        <form onSubmit={onSubmit} className="mt-5">
          {children}
        </form>
      </div>
    </div>,
    document.body,
  );
}
