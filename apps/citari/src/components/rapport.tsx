import { Etiquette } from "@/components/kit";


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
