import { useState } from "react";
import { SECTORS } from "@/lib/site";
import { brandFromDomain, submitScan } from "@/lib/scan";

export function ScanForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [domain, setDomain] = useState("");
  const [brand, setBrand] = useState("");
  const [sector, setSector] = useState(SECTORS[0] ?? "");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  const openStep2 = () => {
    if (!domain.trim()) return;
    if (!brand) setBrand(brandFromDomain(domain));
    setStep(2);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      openStep2();
      return;
    }
    setStatus("sending");
    try {
      await submitScan({
        domain: domain.trim(),
        brand: brand.trim(),
        sector,
        competitors: competitors.map((c) => c.trim()).filter(Boolean),
      });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl">
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
        {step === 1 ? (
          <button type="submit" className="cta shrink-0">
            Lancer le scan gratuit
          </button>
        ) : null}
      </div>

      {step === 2 ? (
        <div className="mt-4 border border-rule-strong p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brand" className="mono block text-[13px] text-ink-2">
                Nom de la marque
              </label>
              <input
                id="brand"
                name="brand"
                className="field mt-1.5"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="sector" className="mono block text-[13px] text-ink-2">
                Secteur
              </label>
              <select
                id="sector"
                name="sector"
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
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className="mono text-[13px] text-ink-2">
              Concurrents (optionnel, 3 maximum)
            </legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
              {competitors.map((value, index) => (
                <div key={index}>
                  <label htmlFor={`competitor-${index}`} className="sr-only">
                    Concurrent {index + 1}
                  </label>
                  <input
                    id={`competitor-${index}`}
                    name={`competitor-${index}`}
                    className="field"
                    value={value}
                    onChange={(e) => {
                      const next = [...competitors];
                      next[index] = e.target.value;
                      setCompetitors(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="cta mt-5" disabled={status === "sending"}>
            Démarrer le scan
          </button>
          {status === "error" ? (
            <p className="mono mt-3 text-[13px] text-ink-2">
              Envoi impossible pour le moment. Réessayez dans un instant.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mono mt-4 text-[13px] text-ink-2">
        90 secondes · Aucune réponse simulée · Aucune carte bancaire
      </p>
      <p className="mono mt-2 text-[13px] text-ink-2">
        ChatGPT · Claude · Gemini · Perplexity · Grok · Le Chat
      </p>
    </form>
  );
}
