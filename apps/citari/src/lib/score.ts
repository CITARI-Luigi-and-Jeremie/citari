import { MOTEURS } from "@/lib/typo";

// Calcul du Score de Visibilité IA — règles métier figées.
// mention 50 % · position 20 % · recommandation 20 % · sentiment 10 %

export type LigneMention = {
  engine: string;
  brand: string;
  is_target: boolean;
  position: number | null;
  recommended: boolean;
  sentiment: string | null;
};

export const POIDS = { mention: 0.5, position: 0.2, reco: 0.2, sentiment: 0.1 } as const;

function scorePosition(position: number | null): number {
  if (!position || position < 1) return 0;
  if (position === 1) return 1;
  if (position === 2) return 0.8;
  if (position === 3) return 0.6;
  if (position <= 5) return 0.4;
  return 0.2;
}

function scoreSentiment(s: string | null): number {
  if (s === "positif") return 1;
  if (s === "negatif") return 0;
  return 0.5;
}

export function calculerScore(
  reponses: { id: string; engine: string }[],
  mentions: LigneMention[],
): {
  global: number;
  parMoteur: Record<string, number | null>;
  mentionRate: number;
  avgPosition: number | null;
  recoRate: number;
  sentiment: number;
} {
  const cible = mentions.filter((m) => m.is_target);
  const total = reponses.length || 1;

  const mentionRate = cible.length / total;
  const positions = cible.map((m) => m.position).filter((p): p is number => !!p);
  const avgPosition = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null;
  const posScore = cible.length ? cible.reduce((a, m) => a + scorePosition(m.position), 0) / total : 0;
  const recoRate = cible.filter((m) => m.recommended).length / total;
  const sentiment = cible.length
    ? cible.reduce((a, m) => a + scoreSentiment(m.sentiment), 0) / cible.length
    : 0.5;

  const global =
    100 *
    (POIDS.mention * mentionRate +
      POIDS.position * posScore +
      POIDS.reco * recoRate +
      POIDS.sentiment * (cible.length ? sentiment : 0));

  const parMoteur: Record<string, number | null> = {};
  for (const moteur of MOTEURS) {
    const rep = reponses.filter((r) => r.engine === moteur);
    if (!rep.length) {
      parMoteur[moteur] = null;
      continue;
    }
    const m = cible.filter((x) => x.engine === moteur);
    const mr = m.length / rep.length;
    const ps = m.reduce((a, x) => a + scorePosition(x.position), 0) / rep.length;
    const rr = m.filter((x) => x.recommended).length / rep.length;
    const st = m.length ? m.reduce((a, x) => a + scoreSentiment(x.sentiment), 0) / m.length : 0;
    parMoteur[moteur] = Math.round(
      100 * (POIDS.mention * mr + POIDS.position * ps + POIDS.reco * rr + POIDS.sentiment * st),
    );
  }

  return {
    global: Math.round(global),
    parMoteur,
    mentionRate,
    avgPosition,
    recoRate,
    sentiment,
  };
}

/**
 * Part de voix = mentions de la marque / mentions totales (marque + concurrents).
 *
 * `classe` sépare les concurrents atteignables des autres. Elle est posée après
 * coup par `finaliser`, à partir de `classerConcurrents` : cette fonction reste
 * un pur calcul, sans appel réseau, pour rester testable et déterministe.
 */
export function partDeVoix(mentions: LigneMention[]): {
  name: string;
  count: number;
  share: number;
  target: boolean;
  classe?: "rival" | "geant" | "outil";
}[] {
  const compte = new Map<string, { count: number; target: boolean }>();
  for (const m of mentions) {
    const clef = m.brand.trim();
    if (!clef) continue;
    const prev = compte.get(clef) ?? { count: 0, target: m.is_target };
    compte.set(clef, { count: prev.count + 1, target: prev.target || m.is_target });
  }
  const total = [...compte.values()].reduce((a, b) => a + b.count, 0) || 1;
  return [...compte.entries()]
    .map(([name, v]) => ({ name, count: v.count, share: v.count / total, target: v.target }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
