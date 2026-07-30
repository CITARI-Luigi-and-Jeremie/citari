import type { Lang } from "../types";

export const PROVIDER_TIMEOUT_MS = 75_000;

const URL_RE = /https?:\/\/[^\s)\]}"'<>]+/g;

export function extractUrls(text: string): string[] {
  const found = text.match(URL_RE) ?? [];
  return [...new Set(found.map((u) => u.replace(/[.,;:!?]+$/, "")))];
}

/** Consigne minimale de langue — on veut la réponse « naturelle » du moteur, pas un prompt façonné. */
export function langInstruction(lang: Lang): string {
  return { fr: "Réponds en français.", it: "Rispondi in italiano.", en: "Answer in English." }[lang];
}

export async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    throw new Error(`${url} → HTTP ${res.status}: ${detail}`);
  }
  return res.json();
}
