import type { BrandRef, MentionResult } from "../types";

/** Normalise pour le matching : minuscules, sans accents. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Variantes déterministes d'une marque : nom, nom compacté, racine du domaine. */
export function brandVariants(brand: BrandRef): string[] {
  const variants = new Set<string>();
  const name = normalize(brand.name.trim());
  if (name) {
    variants.add(name);
    variants.add(name.replace(/[\s\-_.]+/g, ""));
    variants.add(name.replace(/[\s\-_.]+/g, " "));
  }
  if (brand.url) {
    try {
      const host = new URL(brand.url.startsWith("http") ? brand.url : `https://${brand.url}`).hostname
        .replace(/^www\./, "");
      variants.add(normalize(host));               // ex: acme.fr
      const root = host.split(".")[0];
      if (root && root.length > 2) variants.add(normalize(root)); // ex: acme
    } catch {
      // URL invalide → on ignore
    }
  }
  // >= 2 : les marques courtes (HP, 3M, EY…) doivent rester détectables ;
  // les frontières de mot évitent l'essentiel des faux positifs.
  return [...variants].filter((v) => v.length >= 2);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Index de la première occurrence d'une variante (frontières de mot), -1 sinon. */
export function firstMentionIndex(text: string, brand: BrandRef): number {
  const haystack = normalize(text);
  let best = -1;
  for (const v of brandVariants(brand)) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(v)}(?![\\p{L}\\p{N}])`, "u");
    const m = re.exec(haystack);
    if (m && (best === -1 || m.index < best)) best = m.index;
  }
  return best;
}

/**
 * Étape 1 (déterministe) : pour chaque marque, mentionnée ou non + position
 * (ordre de première citation parmi les marques mentionnées, 1 = première).
 */
export function detectMentions(text: string, brands: BrandRef[]): MentionResult[] {
  const indexed = brands.map((b) => ({ brand: b.name, index: firstMentionIndex(text, b) }));
  const ranked = indexed
    .filter((x) => x.index >= 0)
    .sort((a, b) => a.index - b.index)
    .map((x, i) => [x.brand, i + 1] as const);
  const positions = new Map<string, number>(ranked);

  return indexed.map((x) => ({
    brand: x.brand,
    mentioned: x.index >= 0,
    position: positions.get(x.brand) ?? null,
    sentiment: null,
    is_recommended: false,
    method: "deterministic" as const,
  }));
}
