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

/**
 * Trois étapes depuis le 14/08/2026 (décision Luigi) : l'étape
 * « concurrents » est retirée — la mesure les découvre elle-même, et le
 * champ n'alimentait que l'accroche d'email. Le secteur se tape librement,
 * avec nos verticales en suggestions : « poker en ligne » vaut mieux
 * qu'« Autre », et c'est le site qui dicte les questions de toute façon.
 */
type Etape = 1 | 2 | 3;

const TITRE_ETAPE: Record<Etape, string> = {
  1: "Votre site",
  2: "Votre secteur et votre ville",
  3: "Où envoyons-nous votre rapport ?",
};

export function ScanForm({ centered = false }: { centered?: boolean }) {
  const navigate = useNavigate();
  const demarrer = useServerFn(lancerScan);
  const { registerInput } = useScanFormFocus();

  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<Etape>(1);
  const [domaine, setDomaine] = useState("");
  const [marque, setMarque] = useState("");
  const [secteur, setSecteur] = useState("");
  const [ville, setVille] = useState("");
  const [email, setEmail] = useState("");
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
          secteur: secteur.trim(),
          ville: ville.trim() || null,
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
        return;
      }

      // La modale Calendly du rapport préremplit l'email du lead : on le garde
      // dans la session du navigateur, jamais dans l'URL du rapport.
      try {
        sessionStorage.setItem("citari:email", email.trim());
      } catch {
        /* stockage indisponible : la réservation reste possible sans préremplissage. */
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
    if (etape === 2) {
      if (!secteur.trim()) return;
      setEtape(3);
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
              <div className="grid gap-4">
                <ChampSecteur value={secteur} onChange={setSecteur} />
                <Champ
                  id="w-ville"
                  label="Ville de votre entreprise"
                  value={ville}
                  onChange={setVille}
                  placeholder="Lyon"
                />
                <p className="mono text-[13px] text-ink-2">
                  Votre site est lu, puis les questions sont générées pour ce métier et cette
                  ville — celles que vos acheteurs posent vraiment.
                </p>
              </div>
            ) : null}

            {etape === 3 ? (
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
              {etape === 3 ? (etat === "envoi" ? "Lancement…" : "Démarrer le scan") : "Continuer"}
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

/**
 * Le secteur se tape librement, nos verticales servent de suggestions
 * (filtrées par la saisie, cliquables). « Poker en ligne » vaut mieux que
 * le « Autre » de l'ancien menu : le texte libre nourrit la génération, la
 * question miroir et le classement des concurrents. Le serveur acceptait
 * déjà n'importe quel texte, seul ce composant l'interdisait.
 */
function ChampSecteur({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focus, setFocus] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus) return;
    const onDown = (e: MouseEvent) => {
      if (!cadre.current?.contains(e.target as Node)) setFocus(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [focus]);

  const saisie = value.trim().toLowerCase();
  const suggestions = SECTORS.filter(
    (s) => s !== "Autre" && (saisie.length === 0 || s.toLowerCase().includes(saisie)),
  );
  const listeVisible = focus && suggestions.length > 0 && value !== suggestions[0];

  return (
    <div ref={cadre} className="relative">
      <label htmlFor="w-secteur" className="mono block text-[13px] text-ink-2">
        Votre métier, dans vos mots
      </label>
      <input
        id="w-secteur"
        className="field mt-1.5 transition-colors focus:border-ink"
        value={value}
        placeholder="Expertise comptable, agence immobilière, poker en ligne…"
        required
        autoFocus
        autoComplete="off"
        onFocus={() => setFocus(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setFocus(false);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setFocus(true);
        }}
      />

      {listeVisible ? (
        <div
          role="listbox"
          aria-label="Suggestions de secteur"
          className="anim-menu-in absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(40dvh,16rem)] overflow-y-auto overscroll-contain border border-ink bg-paper p-1 shadow-[0_10px_24px_-16px_rgb(23_22_15_/_0.35)]"
        >
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={s === value}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setFocus(false);
              }}
              className="flex w-full items-baseline gap-3 border-0 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-paper-2"
            >
              <span className="mono text-[13px] text-ink-2">→</span>
              <span className="flex-1">{s}</span>
            </button>
          ))}
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
          <p className="mono text-[13px] text-ink-2">Étape {etape} / 3</p>
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
          aria-valuemax={3}
          aria-valuenow={etape}
          aria-label="Progression du formulaire"
        >
          <div
            className="h-full bg-ink transition-[width] duration-500 ease-out"
            style={{ width: `${(etape / 3) * 100}%` }}
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
