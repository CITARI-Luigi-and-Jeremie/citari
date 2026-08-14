import { cn } from "@/lib/utils";
import { Etiquette, Label, Rule } from "@/components/kit";
import { MOTEURS, pourcent, NBSP } from "@/lib/typo";
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

export const INTENTS: Record<string, string> = {
  comparative: "comparative",
  probleme: "problème",
  locale: "locale",
  confiance: "confiance",
};

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

/* ---------- Part de voix : focus + contexte ---------- */

export function PartDeVoix({
  items,
}: {
  items: { name: string; count: number; share: number; target: boolean }[];
}) {
  if (!items.length) return <Vide>Aucune marque détectée dans les réponses collectées.</Vide>;
  return (
    <div>
      {items.map((it) => (
        <div key={it.name} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule py-2.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "w-[150px] shrink-0 truncate text-[14px] md:w-[210px]",
                it.target ? "font-semibold text-signal" : "text-ink-2",
              )}
            >
              {it.name}
              {it.target ? " ◂" : ""}
            </span>
            <span className="h-3 flex-1 bg-paper-2">
              <span
                className={cn("block h-3", it.target ? "bg-signal" : "bg-rule-strong")}
                style={{ width: `${Math.max(1.5, it.share * 100)}%` }}
              />
            </span>
          </div>
          <span className="num text-[13px] tabular-nums text-ink-2">
            {pourcent(it.share * 100, 1)}
            <span className="text-ink-3">{NBSP}·{NBSP}{it.count}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Tableau requête par requête ---------- */

export function TableauRequetes({
  questions,
  reponses,
  mentions,
  marque,
}: {
  questions: Question[];
  reponses: Reponse[];
  mentions: Mention[];
  marque: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-y border-rule-strong">
            <th className="label-xs w-8 py-2 text-left align-bottom">nº</th>
            <th className="label-xs py-2 text-left align-bottom">question</th>
            <th className="label-xs w-24 py-2 text-left align-bottom">intention</th>
            {MOTEURS.map((m) => (
              <th key={m} className="label-xs w-[110px] py-2 text-left align-bottom">
                <span className="inline-flex items-center gap-1.5">
                  <MoteurLogo moteur={m} className="text-[12px] text-ink" />
                  {m}
                </span>
              </th>

            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className="border-b border-rule align-top">
              <td className="num py-2 pr-2 text-[11px] text-ink-3">
                {String(q.rank).padStart(2, "0")}
              </td>
              <td className="max-w-[340px] py-2 pr-4 leading-snug">{q.text}</td>
              <td className="num py-2 pr-3 text-[11px] text-ink-3">{INTENTS[q.intent] ?? q.intent}</td>
              {MOTEURS.map((m) => {
                const rep = reponses.find((r) => r.query_id === q.id && r.engine === m);
                const cell = mentions.filter((x) => x.query_id === q.id && x.engine === m);
                const cible = cell.find((x) => x.is_target);
                if (!rep || rep.error)
                  return (
                    <td key={m} className="num py-2 pr-3 text-[11px] text-ink-3">
                      n. d.
                    </td>
                  );
                return (
                  <td key={m} className="py-2 pr-3">
                    {cible ? (
                      <span className="num text-[12px]">
                        {marque} <span className="text-ink-3">#{cible.position ?? "?"}</span>
                        {cible.recommended ? <span className="text-signal"> ✓reco</span> : null}
                      </span>
                    ) : (
                      <span className="num text-[12px] text-signal">absent</span>
                    )}
                    <div className="mt-0.5 text-[11px] leading-tight text-ink-3">
                      {cell
                        .filter((x) => !x.is_target)
                        .slice(0, 3)
                        .map((x) => x.brand)
                        .join(", ") || "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Verbatims ---------- */

export function Verbatims({ mentions, marque }: { mentions: Mention[]; marque: string }) {
  const items = mentions.filter((m) => m.verbatim && m.verbatim.length > 40).slice(0, 5);
  if (!items.length) return <Vide>Aucun extrait exploitable n'a été collecté.</Vide>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((m) => (
        <figure key={m.id} className="avoid-break border-t border-rule-strong pt-3">
          <blockquote className="quote-serif text-[21px] leading-[1.3]">
            <Surligne texte={m.verbatim ?? ""} marque={m.brand} cible={marque} />
          </blockquote>
          <figcaption className="num mt-3 text-[11px] text-ink-3">
            {m.engine} · marque citée : {m.brand}
            {m.is_target ? "" : " (concurrent)"}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Surligne({ texte, marque, cible }: { texte: string; marque: string; cible: string }) {
  const cles = [marque, cible].filter(Boolean);
  const re = new RegExp(`(${cles.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {texte.split(re).map((part, i) =>
        cles.some((c) => c.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={i}
            className={cn(
              "bg-paper-3 px-0.5",
              part.toLowerCase() === cible.toLowerCase() && "bg-signal-tint text-signal",
            )}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* ---------- Sources Perplexity ---------- */

export function Sources({ reponses }: { reponses: Reponse[] }) {
  const compte = new Map<string, number>();
  for (const r of reponses) {
    if (r.engine !== "Perplexity") continue;
    const list = Array.isArray(r.sources) ? (r.sources as { url: string }[]) : [];
    for (const s of list) {
      if (!s?.url) continue;
      let hote = s.url;
      try {
        hote = new URL(s.url).hostname.replace(/^www\./, "");
      } catch {
        /* URL non analysable : on garde la chaîne brute */
      }
      compte.set(hote, (compte.get(hote) ?? 0) + 1);
    }
  }
  const items = [...compte.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  if (!items.length)
    return <Vide>Perplexity n'a renvoyé aucune source sur cet échantillon (moteur non interrogé ou sans citation).</Vide>;
  return (
    <ol className="grid gap-x-10 md:grid-cols-2">
      {items.map(([hote, n], i) => (
        <li key={hote} className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
          <span className="flex items-baseline gap-3">
            <span className="num text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[14px]">{hote}</span>
          </span>
          <span className="num text-[12px] text-ink-3">{n} citation{n > 1 ? "s" : ""}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Actions ---------- */

export function Actions({
  actions,
}: {
  actions: { chantier: string; titre: string; pourquoi: string; effort: string }[];
}) {
  if (!actions.length) return <Vide>Les actions seront calculées à la fin du scan.</Vide>;
  const chantiers = [...new Set(actions.map((a) => a.chantier))];
  return (
    <div className="grid gap-10 md:grid-cols-3">
      {chantiers.map((c) => (
        <div key={c} className="avoid-break">
          <Label className="pb-2">{c}</Label>
          <Rule strong />
          {actions
            .filter((a) => a.chantier === c)
            .map((a, i) => (
              <div key={i} className="border-b border-rule py-3">
                <div className="text-[15px] font-medium leading-snug">{a.titre}</div>
                <p className="mt-1 text-[13px] leading-snug text-ink-2">{a.pourquoi}</p>
                <div className="num mt-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-3">
                  effort {a.effort}
                </div>
              </div>
            ))}
        </div>
      ))}
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

/* ---------- Toutes les réponses, mot pour mot ---------- */

/**
 * L'intégralité des réponses collectées, question par question, moteur par
 * moteur — texte complet compris.
 *
 * Ajoutée le 14/08/2026 sur une remarque de Luigi : « on vend 144 réponses
 * et on n'en montre que quelques-unes ». Les textes étaient DÉJÀ envoyés au
 * navigateur (`raw_text` dans `rapportParJeton`), simplement jamais affichés.
 * C'est la pièce qui prouve la mesure : un dirigeant sceptique peut relire
 * chaque réponse, et retrouver mot pour mot celle qui recommande son
 * concurrent.
 *
 * En `<details>` natif : aucun JavaScript, imprimable, et la page reste
 * courte tant que rien n'est déplié.
 */
/**
 * Les moteurs répondent en markdown léger : sans rendu, le prospect lit des
 * `**astérisques**` en clair et croit à un bug. On ne réécrit rien — les
 * gras deviennent des gras, les titres et puces perdent leurs marqueurs, le
 * texte reste mot pour mot.
 */
function TexteMoteur({ texte }: { texte: string }) {
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

export function ToutesLesReponses({
  questions,
  reponses,
  mentions,
  marque,
}: {
  questions: Question[];
  reponses: Reponse[];
  mentions: Mention[];
  marque: string;
}) {
  const valides = reponses.filter((r) => !r.error && r.raw_text);
  if (!valides.length) return <Vide>Aucune réponse n'a pu être conservée.</Vide>;

  const moteursPresents = MOTEURS.filter((m) => valides.some((r) => r.engine === m));

  return (
    <div className="space-y-3">
      {questions.map((q) => {
        const deLaQuestion = valides.filter((r) => r.query_id === q.id);
        if (!deLaQuestion.length) return null;
        const citee = mentions.some((m) => m.query_id === q.id && m.is_target);
        const moteursCitants = moteursPresents.filter((m) =>
          mentions.some((x) => x.query_id === q.id && x.engine === m && x.is_target),
        );

        return (
          <details key={q.id} className="avoid-break group border-t border-rule-strong">
            {/* L'affordance de clic était invisible (14/08/2026) : la ligne
                ressemblait à du texte. Chevron, fond au survol et libellé
                explicite à droite — un prospect qui ne devine pas qu'il peut
                ouvrir ne lira jamais la meilleure pièce du rapport. */}
            <summary className="-mx-2 flex cursor-pointer list-none items-baseline gap-3 rounded-[3px] px-2 py-3 transition-colors hover:bg-paper-2">
              <span
                aria-hidden
                className="num shrink-0 text-[11px] text-signal transition-transform duration-200 group-open:rotate-90"
              >
                ▸
              </span>
              <span className="num shrink-0 text-[11px] text-ink-3">
                {String(q.rank).padStart(2, "0")}
              </span>
              <span className="flex-1 text-[14px] leading-snug">{q.text}</span>
              <span className="num shrink-0 text-[11px]">
                {citee ? (
                  <span className="text-ink-3">
                    cité{moteursCitants.length ? ` · ${moteursCitants.join(", ")}` : ""}
                  </span>
                ) : (
                  <span className="text-signal">absent partout</span>
                )}
              </span>
              <span className="num hidden shrink-0 text-[11px] text-ink-3 underline underline-offset-2 group-open:hidden sm:inline">
                lire {deLaQuestion.length} réponse{deLaQuestion.length > 1 ? "s" : ""}
              </span>
            </summary>

            <div className="space-y-5 pb-6 pl-8 pr-2">
              {moteursPresents.map((m) => {
                const rep = deLaQuestion.find((r) => r.engine === m);
                if (!rep) return null;
                const citations = mentions.filter((x) => x.response_id === rep.id);
                const cible = citations.find((x) => x.is_target);
                const concurrents = citations.filter((x) => !x.is_target).map((x) => x.brand);
                return (
                  <div key={m}>
                    <p className="num flex flex-wrap items-baseline gap-x-3 text-[11px] text-ink-3">
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <MoteurLogo moteur={m} className="text-[12px]" />
                        {m}
                      </span>
                      {cible ? (
                        <span>
                          {marque} en position {cible.position ?? "?"}
                          {cible.recommended ? " · recommandé" : ""}
                        </span>
                      ) : (
                        <span className="text-signal">{marque} absent de cette réponse</span>
                      )}
                      {concurrents.length ? <span>cités : {concurrents.join(", ")}</span> : null}
                    </p>
                    <p className="mt-1.5 max-w-[80ch] whitespace-pre-line text-[13.5px] leading-[1.6] text-ink-2">
                      <TexteMoteur texte={rep.raw_text ?? ""} />
                    </p>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

/* ---------- Miroir et audit des robots (rapport complet) ---------- */

/**
 * La question miroir, moteur par moteur.
 *
 * Ajoutée au rapport COMPLET le 14/08/2026 : la séquence gratuite l'affichait
 * déjà (CarteMiroir) et le tableau comparatif promettait « 1 moteur / 6
 * moteurs » sur une page qui n'en rendait aucun. Un rapport payant qui tient
 * moins que l'aperçu qu'il prolonge est la pire promesse rompue possible.
 *
 * Un moteur en panne n'est pas ecrit en base (`finaliser` filtre les erreurs) :
 * on affiche ce qui existe, sans jamais annoncer un nombre fixe.
 */
export function Miroir({ miroir, marque }: { miroir: unknown; marque: string }) {
  const lignes = (Array.isArray(miroir) ? miroir : []).filter(
    (m): m is { moteur?: string; texte: string } =>
      Boolean(m) && typeof (m as { texte?: unknown }).texte === "string" &&
      (m as { texte: string }).texte.trim().length > 40,
  );
  if (!lignes.length)
    return <Vide>Aucune réponse exploitable n'a été obtenue sur la question miroir.</Vide>;

  return (
    <div className="space-y-6">
      <p className="num text-[12px] text-ink-3">
        Question posée : « Que peux-tu me dire de {marque} ? Est-ce une entreprise que tu
        recommanderais ? »
      </p>
      {lignes.map((l, i) => (
        <figure key={`${l.moteur ?? i}`} className="avoid-break border-t border-rule-strong pt-3">
          <figcaption className="num mb-2 flex items-center gap-1.5 text-[11px] text-ink-3">
            <MoteurLogo moteur={l.moteur ?? ""} className="text-[12px] text-ink" />
            {l.moteur ?? "moteur"}
          </figcaption>
          <blockquote className="quote-serif max-w-[70ch] whitespace-pre-line text-[16px] leading-[1.45]">
            {l.texte.trim()}
          </blockquote>
        </figure>
      ))}
    </div>
  );
}

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
