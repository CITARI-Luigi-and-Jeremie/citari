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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST JSON avec un retry sur erreur transitoire (réseau/timeout, 429, 5xx) :
 * une réponse moteur perdue fausserait le score, on ne lâche pas au premier échec.
 */
export async function postJson(url: string, headers: Record<string, string>, body: unknown, retries = 1): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
    } catch (e) {
      if (attempt < retries) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      throw new Error(`${url} → réseau: ${String(e).slice(0, 200)}`);
    }
    if (res.ok) return res.json();
    const detail = (await res.text()).slice(0, 500);
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    throw new Error(`${url} → HTTP ${res.status}: ${detail}`);
  }
}
