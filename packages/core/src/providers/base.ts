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
 * Attente avant nouvel essai : l'éditeur sait mieux que nous.
 *
 * `retry-after` est renvoyé en secondes, ou en date HTTP. On le respecte quand
 * il est présent et raisonnable, sinon on retombe sur un doublement classique
 * avec bruit, pour éviter que six moteurs relancés en parallèle ne repartent
 * tous exactement à la même milliseconde.
 */
function attenteMs(res: Response, attempt: number): number {
  const brut = res.headers.get("retry-after");
  if (brut) {
    const secondes = Number(brut);
    const ms = Number.isFinite(secondes) ? secondes * 1000 : Date.parse(brut) - Date.now();
    if (ms > 0 && ms <= 60_000) return ms;
  }
  return 2000 * 2 ** attempt + Math.random() * 500;
}

/**
 * POST JSON avec reprise sur erreur transitoire (réseau/timeout, 429, 5xx).
 *
 * Une réponse moteur perdue fausserait le score : on ne lâche pas au premier
 * échec. Trois reprises et non une, car un `529 Overloaded` d'Anthropic dure
 * couramment plus longtemps que les 2 s d'attente d'origine ; constaté en réel
 * sur `draft-content`, où une rédaction de plusieurs minutes déjà payée était
 * perdue pour un incident passager de quelques secondes.
 */
export async function postJson(url: string, headers: Record<string, string>, body: unknown, retries = 3): Promise<any> {
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
        await sleep(1500 * 2 ** attempt + Math.random() * 500);
        continue;
      }
      throw new Error(`${url} → réseau: ${String(e).slice(0, 200)}`);
    }
    if (res.ok) return res.json();
    const detail = (await res.text()).slice(0, 500);
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(attenteMs(res, attempt));
      continue;
    }
    throw new Error(`${url} → HTTP ${res.status}: ${detail}`);
  }
}
