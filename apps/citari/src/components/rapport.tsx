import { cn } from "@/lib/utils";
import { Etiquette, Label } from "@/components/kit";
import { MOTEURS } from "@/lib/typo";
import { MoteurLogo } from "@/components/moteur-logo";


export type Mention = {
  id: string;
  query_id: string;
  response_id: string;
  engine: string;
  brand: string;
  is_target: boolean;
  position: number | null;
  recommended: boolean;
  sentiment: string | null;
  verbatim: string | null;
};

export type Reponse = {
  id: string;
  query_id: string;
  engine: string;
  raw_text: string | null;
  sources: unknown;
  error: string | null;
};

export type Question = { id: string; rank: number; text: string; intent: string };

/* ---------- Score : cadran monospace + écart éventuel ---------- */

export function ScoreGeant({
  score,
  verdict,
  ecart,
}: {
  score: number;
  verdict: string;
  ecart?: number | null;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
      <div className="num leading-[0.8] text-[112px] md:text-[152px]">{score}</div>
      <div className="pb-3">
        <Label>sur 100</Label>
        <div className="font-sans font-semibold text-[34px] leading-none">{verdict}</div>
        {typeof ecart === "number" ? (
          <div className="num mt-2 text-[13px] text-signal">
            {ecart >= 0 ? "+" : "−"}
            {Math.abs(ecart)} pt depuis le scan initial
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ScoresMoteurs({
  scores,
  avant,
}: {
  scores: Record<string, number | null>;
  avant?: Record<string, number | null> | null;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {MOTEURS.map((m, i) => {
        const v = scores[m];
        const a = avant?.[m];
        return (
          <div
            key={m}
            className={cn("border-t border-rule py-4 pr-6", i > 0 && "lg:border-l lg:pl-5")}
          >
            <Label>
              <span className="inline-flex items-center gap-1.5">
                <MoteurLogo moteur={m} className="text-[13px] text-ink" />
                {m}
              </span>
            </Label>

            <div className="num mt-1 text-[38px] leading-none">
              {v === null || v === undefined ? "—" : v}
            </div>
            <div className="mt-3 h-1 w-full bg-paper-3">
              <div
                className="h-1 bg-ink"
                style={{ width: `${Math.max(1, Number(v ?? 0))}%` }}
                aria-hidden
              />
            </div>
            {typeof a === "number" && typeof v === "number" ? (
              <div className="num mt-2 text-[11px] text-ink-3">
                avant {a} → après {v}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function Vide({ children }: { children: React.ReactNode }) {
  return <p className="border-l-2 border-rule-strong py-1 pl-4 text-[14px] text-ink-3">{children}</p>;
}

export function LimiteMethodologique() {
  return (
    <div className="max-w-[62ch] border-t border-rule-strong pt-3">
      <Etiquette>limite assumée</Etiquette>
      <p className="mt-2 text-[13px] leading-snug text-ink-2">
        Les mesures sont obtenues via les API officielles des six moteurs. Elles ne reproduisent pas
        exactement l’expérience d’un utilisateur connecté à l’interface grand public (personnalisation,
        historique, position géographique). Aucun scraping n’est pratiqué. Les résultats sont comparables
        entre eux dans le temps, puisque l’échantillon de questions est figé.
      </p>
    </div>
  );
}

/* ---------- Le texte des moteurs ---------- */

/**
 * Les moteurs répondent en markdown léger : sans rendu, le prospect lit des
 * `**astérisques**` en clair et croit à un bug. On ne réécrit rien — les
 * gras deviennent des gras, les titres et puces perdent leurs marqueurs, le
 * texte reste mot pour mot.
 */
export function TexteMoteur({ texte }: { texte: string }) {
  const propre = texte
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "· ")
    .replace(/`{1,3}/g, "");
  const morceaux = propre.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {morceaux.map((bout, i) =>
        bout.startsWith("**") && bout.endsWith("**") ? (
          <strong key={i} className="font-semibold text-ink">
            {bout.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{bout}</span>
        ),
      )}
    </>
  );
}

/* ---------- Audit des robots ---------- */

/** L'audit flash : les robots d'IA ont-ils le droit de lire le site ? */
export function AuditRobots({ audit, domaine }: { audit: unknown; domaine: string | null }) {
  const a = audit as { ok?: boolean; bots?: Record<string, string>; llmstxt?: boolean } | null;
  if (!a?.ok || !a.bots)
    return <Vide>Le fichier robots.txt du site n'a pas pu être lu pendant la mesure.</Vide>;

  // Trois états : bloqué, autorisé, ou non mentionné — ce dernier vaut
  // autorisation (ce qui n'est pas interdit est permis).
  const robots = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"].filter(
    (r) => typeof a.bots![r] === "string",
  );
  const bloques = robots.filter((r) => a.bots![r] === "bloque");

  return (
    <div className="max-w-[52ch]">
      <table className="w-full border-collapse text-[13px]">
        <tbody>
          {robots.map((r) => {
            const bloque = a.bots![r] === "bloque";
            return (
              <tr key={r} className="border-b border-rule">
                <td className="num py-2 text-[12px]">{r}</td>
                <td
                  className={cn(
                    "num py-2 text-right text-[12px]",
                    bloque ? "font-semibold text-signal" : "text-ink-3",
                  )}
                >
                  {bloque ? "BLOQUÉ" : a.bots![r] === "autorise" ? "autorisé" : "autorisé par défaut"}
                </td>
              </tr>
            );
          })}
          <tr className="border-b border-rule">
            <td className="num py-2 text-[12px]">llms.txt</td>
            <td className="num py-2 text-right text-[12px] text-ink-3">
              {a.llmstxt ? "présent" : "absent"}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4 text-[14px] leading-snug text-ink-2">
        {bloques.length
          ? `${bloques.length === 1 ? "Un robot est refusé" : `${bloques.length} robots sont refusés`} par votre serveur. Tant que ce refus tient, aucun contenu publié ne pourra être cité par ${bloques.length === 1 ? "ce moteur" : "ces moteurs"}.`
          : "Aucun robot d'IA n'est refusé : ce qui manque n'est pas l'autorisation, c'est la matière à lire."}
      </p>
      {domaine ? (
        <p className="num mt-2 text-[11px] text-ink-3">
          Relevé public, vérifiable sur {domaine}/robots.txt
        </p>
      ) : null}
    </div>
  );
}
