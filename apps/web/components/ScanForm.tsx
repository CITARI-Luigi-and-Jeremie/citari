"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { SECTORS } from "@/lib/constants";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Formulaire de scan — traité comme un formulaire d'instrument : champs à filet, labels techniques. */
export default function ScanForm() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [url, setUrl] = useState("");
  const [sector, setSector] = useState("");
  const [customSector, setCustomSector] = useState("");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [lang, setLang] = useState<"fr" | "it" | "en">("fr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const turnstileToken =
      (e.currentTarget.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ?? undefined;
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          url,
          sector: sector === "__autre__" ? customSector : sector,
          competitors: competitors.filter(Boolean).map((name) => ({ name })),
          lang,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      router.push(`/scan/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-rule-strong bg-paper-raised">
      <div className="flex items-baseline justify-between border-b border-rule px-4 py-3">
        <span className="label">Scan de visibilité</span>
        <span className="label">Gratuit · 90 s</span>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Marque *</span>
            <input
              className="field mt-2"
              placeholder="Acme"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className="block">
            <span className="label">Site *</span>
            <input
              className="field mt-2"
              placeholder="acme.fr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              maxLength={300}
            />
          </label>
        </div>

        <label className="block">
          <span className="label">Secteur *</span>
          <select className="field mt-2" value={sector} onChange={(e) => setSector(e.target.value)} required>
            <option value="">— sélectionner —</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="__autre__">Autre…</option>
          </select>
        </label>

        {sector === "__autre__" && (
          <input
            className="field"
            placeholder="Précisez votre secteur"
            value={customSector}
            onChange={(e) => setCustomSector(e.target.value)}
            required
            maxLength={120}
          />
        )}

        <div>
          <span className="label">Concurrents (recommandé)</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {competitors.map((c, i) => (
              <input
                key={i}
                className="field"
                placeholder={`Concurrent ${i + 1}`}
                value={c}
                maxLength={100}
                onChange={(e) => setCompetitors(competitors.map((v, j) => (j === i ? e.target.value : v)))}
              />
            ))}
          </div>
        </div>

        <label className="block">
          <span className="label">Langue des requêtes</span>
          <select className="field mt-2" value={lang} onChange={(e) => setLang(e.target.value as "fr" | "it" | "en")}>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </select>
        </label>

        {TURNSTILE_KEY && (
          <>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
            <div className="cf-turnstile" data-sitekey={TURNSTILE_KEY} />
          </>
        )}

        {error && (
          <p className="border-l-2 border-signal pl-3 font-mono text-xs text-signal">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-signal w-full">
          {loading ? "Lancement…" : "Lancer le scan"}
        </button>
        <p className="font-mono text-micro uppercase text-ink-faint">
          Sans inscription · API officielles
        </p>
      </div>
    </form>
  );
}
