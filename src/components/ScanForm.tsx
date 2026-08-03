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
          <button type="submit" className="cta shrink-0 transition-opacity hover:opacity-90">
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
          <div key={step} className="anim-step">
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
                <SectorSelect value={sector} onChange={setSector} />
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
                        className="field transition-colors focus:border-ink"
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
          </div>

          <div className="mt-6 flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                className="mono text-[13px] text-ink-2 underline underline-offset-4 transition-colors hover:text-ink"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                disabled={status === "sending"}
              >
                ← Retour
              </button>
            ) : null}
            <button
              type="submit"
              className="cta ml-auto transition-opacity hover:opacity-90 disabled:opacity-60"
              disabled={status === "sending"}
            >
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

function SectorSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const dismiss = () => {
    if (!open) return;
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) dismiss();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const index = SECTORS.indexOf(value);

  return (
    <div ref={wrap} className="relative">
      <span className="mono block text-[13px] text-ink-2">Secteur</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? dismiss() : setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            dismiss();
          }
        }}
        className={`option-row mt-1.5 ${open ? "option-row-on" : ""}`}
      >
        <span className={`mono text-[13px] ${open ? "text-signal" : "text-ink-2"}`}>
          {index >= 0 ? String(index + 1).padStart(2, "0") : "--"}
        </span>
        <span className="flex-1">{value || "Choisir un secteur"}</span>
        <span
          aria-hidden
          className="mono text-[13px] text-ink-2 transition-transform duration-200 ease-out"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ↓
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Secteur d'activité"
          className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-[46vh] overflow-y-auto border border-ink bg-paper p-1 ${
            closing ? "anim-menu-out" : "anim-menu-in"
          }`}
        >
          {SECTORS.map((s, i) => {
            const selected = s === value;
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(s);
                  dismiss();
                }}
                className={`flex w-full items-baseline gap-3 border-0 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-paper-2 ${
                  selected ? "bg-paper-2 font-semibold" : ""
                }`}
              >
                <span
                  className={`mono text-[13px] ${selected ? "text-signal" : "text-ink-2"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{s}</span>
                {selected ? (
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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="anim-veil fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-ink/35 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (!ref.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={STEP_LABEL[step]}
        className="anim-panel my-auto w-full max-w-lg overflow-visible border border-rule-strong bg-paper p-5 will-change-transform sm:p-7"
      >

        <div className="flex items-baseline justify-between">
          <p className="mono text-[13px] text-ink-2">Étape {step} / 3</p>
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
          aria-valuenow={step}
          aria-label="Progression du scan"
        >
          <div
            className="h-full bg-ink transition-[width] duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <h2 className="mt-4 text-[22px] sm:text-[26px]">{STEP_LABEL[step]}</h2>
        <form onSubmit={onSubmit} className="mt-5">
          {children}
        </form>
      </div>
    </div>
  );
}
