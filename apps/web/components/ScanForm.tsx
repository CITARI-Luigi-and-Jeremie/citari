"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { SECTORS } from "@/lib/constants";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Nom de votre marque *" value={brand} onChange={(e) => setBrand(e.target.value)} required maxLength={100} />
        <input className={input} placeholder="Site web (ex. acme.fr) *" value={url} onChange={(e) => setUrl(e.target.value)} required maxLength={300} />
      </div>
      <select className={input} value={sector} onChange={(e) => setSector(e.target.value)} required>
        <option value="">Votre secteur *</option>
        {SECTORS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
        <option value="__autre__">Autre…</option>
      </select>
      {sector === "__autre__" && (
        <input className={input} placeholder="Précisez votre secteur *" value={customSector} onChange={(e) => setCustomSector(e.target.value)} required maxLength={120} />
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {competitors.map((c, i) => (
          <input
            key={i}
            className={input}
            placeholder={`Concurrent ${i + 1}${i === 0 ? " (recommandé)" : ""}`}
            value={c}
            maxLength={100}
            onChange={(e) => setCompetitors(competitors.map((v, j) => (j === i ? e.target.value : v)))}
          />
        ))}
      </div>
      <select className={input} value={lang} onChange={(e) => setLang(e.target.value as "fr" | "it" | "en")}>
        <option value="fr">Requêtes en français</option>
        <option value="it">Requêtes en italien</option>
        <option value="en">Requêtes en anglais</option>
      </select>

      {TURNSTILE_KEY && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={TURNSTILE_KEY} />
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? "Lancement du scan…" : "Tester ma visibilité IA — gratuit"}
      </button>
      <p className="text-center text-xs text-slate-500">Sans inscription. Résultat en ~90 secondes. 3 scans/jour max.</p>
    </form>
  );
}
