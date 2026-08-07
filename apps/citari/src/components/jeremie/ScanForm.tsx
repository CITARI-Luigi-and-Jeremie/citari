import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { SECTORS, brandFromDomain } from "@/lib/site";
import { lancerScan } from "@/lib/scan.functions";
import { useScanFormFocus } from "@/lib/scan-form-focus";
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

type Etape = 1 | 2 | 3 | 4;

const TITRE_ETAPE: Record<Etape, string> = {
  1: "Votre site",
  2: "Votre secteur et votre ville",
  3: "Qui sont vos principaux concurrents ?",
  4: "Où envoyons-nous votre rapport ?",
};

export function ScanForm({ centered = false }: { centered?: boolean }) {
  const navigate = useNavigate();
  const demarrer = useServerFn(lancerScan);
  const { registerInput } = useScanFormFocus();

  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<Etape>(1);
  const [domaine, setDomaine] = useState("");
  const [marque, setMarque] = useState("");
  const [secteur, setSecteur] = useState(SECTORS[0] ?? "");
  const [ville, setVille] = useState("");
  const [email, setEmail] = useState("");
  const [concurrents, setConcurrents] = useState(["", "", ""]);
  const [etat, setEtat] = useState<"repos" | "envoi" | "erreur">("repos");
  const [messageErreur, setMessageErreur] = useState<string | null>(null);

  const ouvrir = () => {
    if (!marque) setMarque(brandFromDomain(domaine));
    setEtape(1);
    setOuvert(true);
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
          secteur,
          ville: ville.trim() || null,
          concurrents: concurrents.map((c) => c.trim()).filter(Boolean),
          langue: "fr",
          mode: "apercu",
        },
      });

      // Le quota d'IP est rendu comme un message, pas comme une exception :
      // c'est une limite normale, pas une panne, et le visiteur doit le lire.
      if ("erreur" in reponse) {
        setEtat("erreur");
        setMessageErreur(reponse.erreur);
        return;
      }

      navigate({ to: "/scan/$id", params: { id: reponse.id } });
    } catch (e) {
      setEtat("erreur");
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
      return;
    }
    if (etape === 2) return setEtape(3);
    if (etape === 3) return setEtape(4);
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
              <div className="grid gap-4">
                <ChoixSecteur value={secteur} onChange={setSecteur} />
                <Champ
                  id="w-ville"
                  label="Ville de votre entreprise"
                  value={ville}
                  onChange={setVille}
                  placeholder="Lyon"
                />
                <p className="mono text-[13px] text-ink-2">
                  Les questions posées aux moteurs sont générées pour ce secteur et cette ville.
                </p>
              </div>
            ) : null}

            {etape === 3 ? (
              <fieldset>
                <legend className="mono text-[13px] text-ink-2">
                  Concurrents (facultatif, 3 maximum)
                </legend>
                <div className="mt-1.5 grid gap-2">
                  {concurrents.map((valeur, i) => (
                    <div key={i}>
                      <label htmlFor={`w-concurrent-${i}`} className="sr-only">
                        Concurrent {i + 1}
                      </label>
                      <input
                        id={`w-concurrent-${i}`}
                        className="field transition-colors focus:border-ink"
                        value={valeur}
                        onChange={(e) => {
                          const suite = [...concurrents];
                          suite[i] = e.target.value;
                          setConcurrents(suite);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="mono mt-3 text-[13px] text-ink-2">
                  Ces noms ne sont jamais soufflés aux moteurs : on les rapproche après coup de
                  ce qu'ils ont cité d'eux-mêmes.
                </p>
              </fieldset>
            ) : null}

            {etape === 4 ? (
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
              {etape === 4 ? (etat === "envoi" ? "Lancement…" : "Démarrer le scan") : "Continuer"}
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

function ChoixSecteur({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [fermeture, setFermeture] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);

  const refermer = () => {
    if (!ouvert) return;
    setFermeture(true);
    window.setTimeout(() => {
      setOuvert(false);
      setFermeture(false);
    }, 150);
  };

  useEffect(() => {
    if (!ouvert) return;
    const onDown = (e: MouseEvent) => {
      if (!cadre.current?.contains(e.target as Node)) refermer();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ouvert]);

  const index = SECTORS.indexOf(value);

  return (
    <div ref={cadre} className="relative">
      <span className="mono block text-[13px] text-ink-2">Secteur</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        onClick={() => (ouvert ? refermer() : setOuvert(true))}
        onKeyDown={(e) => {
          if (e.key === "Escape" && ouvert) {
            e.stopPropagation();
            refermer();
          }
        }}
        className={`option-row mt-1.5 ${ouvert ? "option-row-on" : ""}`}
      >
        <span className={`mono text-[13px] ${ouvert ? "text-signal" : "text-ink-2"}`}>
          {index >= 0 ? String(index + 1).padStart(2, "0") : "--"}
        </span>
        <span className="flex-1">{value || "Choisir un secteur"}</span>
        <span
          aria-hidden
          className="mono text-[13px] text-ink-2 transition-transform duration-200 ease-out"
          style={{ transform: ouvert ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ↓
        </span>
      </button>

      {ouvert ? (
        <div
          role="listbox"
          aria-label="Secteur d'activité"
          className={`absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(52dvh,20rem)] overflow-y-auto overscroll-contain border border-ink bg-paper p-1 shadow-[0_10px_24px_-16px_rgb(23_22_15_/_0.35)] ${
            fermeture ? "anim-menu-out" : "anim-menu-in"
          }`}
        >
          {SECTORS.map((s, i) => {
            const choisi = s === value;
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={choisi}
                onClick={() => {
                  onChange(s);
                  refermer();
                }}
                className={`flex w-full items-baseline gap-3 border-0 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-paper-2 ${
                  choisi ? "bg-paper-2 font-semibold" : ""
                }`}
              >
                <span className={`mono text-[13px] ${choisi ? "text-signal" : "text-ink-2"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{s}</span>
                {choisi ? (
                  <span aria-hidden className="mono text-[13px] text-signal">
                    ■
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
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
          <p className="mono text-[13px] text-ink-2">Étape {etape} / 4</p>
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
          aria-valuemax={4}
          aria-valuenow={etape}
          aria-label="Progression du formulaire"
        >
          <div
            className="h-full bg-ink transition-[width] duration-500 ease-out"
            style={{ width: `${(etape / 4) * 100}%` }}
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
