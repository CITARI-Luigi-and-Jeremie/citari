import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SECTORS } from "@/lib/site";
import { brandFromDomain } from "@/lib/scan";
import { createScan } from "@/lib/scan-create.functions";

type Step = 1 | 2 | 3;

const STEP_LABEL: Record<Step, string> = {
  1: "Votre site",
  2: "Votre secteur",
  3: "Vos concurrents",
};

export function ScanForm() {
  const navigate = useNavigate();
  const startScan = useServerFn(createScan);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [domain, setDomain] = useState("");
  const [brand, setBrand] = useState("");
  const [sector, setSector] = useState(SECTORS[0] ?? "");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  const openWizard = () => {
    if (!brand) setBrand(brandFromDomain(domain));
    setStep(1);
    setOpen(true);
  };

  const close = () => {
    if (status === "sending") return;
    setOpen(false);
    setStatus("idle");
  };

  const submit = async () => {
    setStatus("sending");
    try {
      const { id } = await startScan({
        data: {
          domain: domain.trim(),
          brand: brand.trim(),
          sector,
          competitors: competitors.map((c) => c.trim()).filter(Boolean),
        },
      });
      navigate({ to: "/scan/$id", params: { id } });
    } catch {
      setStatus("error");
    }
  };

  const next = () => {
    if (step === 1) {
      if (!domain.trim() || !brand.trim()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    void submit();
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openWizard();
        }}
        className="mt-8 max-w-xl"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="domain" className="sr-only">
            Adresse de votre site
          </label>
          <input
            id="domain"
            name="domain"
            className="field"
            placeholder="votre-site.fr"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
          <button type="submit" className="cta shrink-0">
            Lancer le scan gratuit
          </button>
        </div>

        <p className="mono mt-4 text-[13px] text-ink-2">
          90 secondes · Aucune réponse simulée · Aucune carte bancaire
        </p>
        <p className="mono mt-2 text-[13px] text-ink-2">
          ChatGPT · Claude · Gemini · Perplexity · Grok · Le Chat
        </p>
      </form>

      {open ? (
        <Modal
          onClose={close}
          step={step}
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          {step === 1 ? (
            <div className="grid gap-4">
              <Field
                id="w-domain"
                label="Adresse de votre site"
                value={domain}
                onChange={(v) => {
                  setDomain(v);
                  setBrand(brandFromDomain(v));
                }}
                placeholder="votre-site.fr"
                autoFocus
                required
              />
              <Field
                id="w-brand"
                label="Nom de la marque"
                value={brand}
                onChange={setBrand}
                required
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <label htmlFor="w-sector" className="mono block text-[13px] text-ink-2">
                Secteur
              </label>
              <select
                id="w-sector"
                className="field mt-1.5"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="mono mt-3 text-[13px] text-ink-2">
                Les questions posées aux moteurs sont générées pour ce secteur.
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <fieldset>
              <legend className="mono text-[13px] text-ink-2">
                Concurrents (optionnel, 3 maximum)
              </legend>
              <div className="mt-1.5 grid gap-2">
                {competitors.map((value, index) => (
                  <div key={index}>
                    <label htmlFor={`w-competitor-${index}`} className="sr-only">
                      Concurrent {index + 1}
                    </label>
                    <input
                      id={`w-competitor-${index}`}
                      className="field"
                      value={value}
                      onChange={(e) => {
                        const nextValues = [...competitors];
                        nextValues[index] = e.target.value;
                        setCompetitors(nextValues);
                      }}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                className="mono text-[13px] text-ink-2 underline underline-offset-4"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                disabled={status === "sending"}
              >
                ← Retour
              </button>
            ) : null}
            <button type="submit" className="cta ml-auto" disabled={status === "sending"}>
              {step === 3
                ? status === "sending"
                  ? "Lancement…"
                  : "Démarrer le scan"
                : "Continuer"}
            </button>
          </div>

          {status === "error" ? (
            <p className="mono mt-3 text-[13px] text-ink-2">
              Envoi impossible pour le moment. Réessayez dans un instant.
            </p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}

function Field({
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
        className="field mt-1.5"
        value={value}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Modal({
  step,
  children,
  onClose,
  onSubmit,
}: {
  step: Step;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (!ref.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={STEP_LABEL[step]}
        className="w-full max-w-lg border border-rule-strong bg-paper p-5 sm:p-7"
      >
        <div className="flex items-baseline justify-between">
          <p className="mono text-[13px] text-ink-2">Étape {step} / 3</p>
          <button
            type="button"
            onClick={onClose}
            className="mono text-[13px] text-ink-2 underline underline-offset-4"
          >
            Fermer
          </button>
        </div>
        <h2 className="mt-2 text-[22px] sm:text-[26px]">{STEP_LABEL[step]}</h2>
        <form onSubmit={onSubmit} className="mt-5">
          {children}
        </form>
      </div>
    </div>
  );
}
