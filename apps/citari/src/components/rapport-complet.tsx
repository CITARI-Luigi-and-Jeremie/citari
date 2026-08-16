import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import { Etiquette, Label } from "@/components/kit";
import { MoteurLogo } from "@/components/moteur-logo";
import { TexteMoteur, Vide } from "@/components/rapport";
import { NBSP, pourcent } from "@/lib/typo";
import type {
  DonneesDocument,
  FaceMoteur,
  Matrice,
  PhasePlan,
  Piece,
  SourcesDocument,
} from "@/lib/rapport-complet";
import type { LigneMention, LigneReponse } from "@/lib/rapport-apercu";

/**
 * Les visuels du DOCUMENT DE MESURE (rapport des modes `complet` et
 * `controle`), refonte du 15/08/2026. Chaque composant reçoit des données
 * déjà assemblées par `rapport-complet.ts` : aucun comptage ici, uniquement
 * de l'affichage. Le document est fait pour être montré en partage d'écran :
 * une idée par section, l'état visible avant d'être lu, et le texte intégral
 * toujours à un clic, jamais supprimé.
 */

/* ------------------------------------------------------------ marquage */

/** Rend un texte porteur du marqueur `*concurrent*` : le nom sort en signal. */
export function TexteMarque({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*[^*]+\*)/g);
  return (
    <>
      {morceaux.map((bout, i) =>
        bout.startsWith("*") && bout.endsWith("*") && bout.length > 2 ? (
          <mark key={i} className="bg-signal-tint px-0.5 font-semibold text-signal">
            {bout.slice(1, -1)}
          </mark>
        ) : (
          <Fragment key={i}>{bout}</Fragment>
        ),
      )}
    </>
  );
}

/* ------------------------------------------------------------- matrice */

function CaseMatrice({ etat, position, recommande }: {
  etat: "cite" | "absent" | "erreur";
  position: number | null;
  recommande: boolean;
}) {
  if (etat === "erreur")
    return (
      <span
        title="Réponse indisponible : ne compte pas dans la mesure"
        className="num inline-flex h-7 w-7 items-center justify-center text-[11px] text-ink-3"
      >
        –
      </span>
    );
  if (etat === "absent")
    return (
      <span
        title="La marque n'apparaît pas dans cette réponse"
        className="inline-flex h-7 w-7 items-center justify-center border border-signal/30 bg-signal-tint text-[11px] text-signal"
      >
        ×
      </span>
    );
  return (
    <span
      title={`Marque citée${position ? ` en position ${position}` : ""}${recommande ? " et recommandée explicitement" : ""}`}
      className={cn(
        "num inline-flex h-7 w-7 items-center justify-center bg-ink text-[11px] font-semibold text-paper",
        recommande && "ring-2 ring-signal ring-offset-1 ring-offset-paper",
      )}
    >
      {position ?? "✓"}
    </span>
  );
}

/**
 * La carte complète : questions × moteurs, un état par case. Cliquer une
 * ligne déplie les réponses intégrales de la question, mot pour mot ; la
 * carte remplace donc l'ancien tableau ET l'ancienne annexe des réponses,
 * une seule pièce à un seul endroit.
 */
export function MatriceReponses({
  matrice,
  reponses,
  mentions,
  marque,
}: {
  matrice: Matrice;
  reponses: LigneReponse[];
  mentions: LigneMention[];
  marque: string;
}) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  if (!matrice.lignes.length) return <Vide>Aucune question mesurée sur ce scan.</Vide>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="flex items-center gap-2 text-[12px] text-ink-2">
          <span className="num inline-flex h-5 w-5 items-center justify-center bg-ink text-[10px] font-semibold text-paper">2</span>
          cité, et sa position dans la réponse
        </span>
        <span className="flex items-center gap-2 text-[12px] text-ink-2">
          <span className="inline-flex h-5 w-5 items-center justify-center border border-signal/30 bg-signal-tint text-[10px] text-signal">×</span>
          absent de la réponse
        </span>
        <span className="flex items-center gap-2 text-[12px] text-ink-2">
          <span className="num inline-flex h-5 w-5 items-center justify-center text-[10px] text-ink-3">–</span>
          réponse indisponible, hors mesure
        </span>
        <span className="text-[12px] text-ink-3">cliquez une ligne pour lire les réponses en entier</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse">
          <thead>
            <tr className="border-y border-rule-strong">
              <th className="label-xs py-2.5 pr-3 text-left align-bottom">question</th>
              {matrice.moteurs.map((m) => (
                <th key={m} className="label-xs w-[64px] px-1 py-2.5 text-center align-bottom">
                  <span className="inline-flex flex-col items-center gap-1">
                    <MoteurLogo moteur={m} className="text-[14px] text-ink" />
                    <span className="hidden xl:inline">{m}</span>
                  </span>
                </th>
              ))}
              <th className="label-xs w-[150px] py-2.5 pl-4 text-left align-bottom">qui tient la question</th>
            </tr>
          </thead>
          <tbody>
            {matrice.lignes.map((l) => {
              const deplie = ouverte === l.id;
              const valides = reponses.filter((r) => r.query_id === l.id && !r.error && r.raw_text);
              return (
                <Fragment key={l.id}>
                  <tr
                    onClick={() => setOuverte(deplie ? null : l.id)}
                    className={cn(
                      "cursor-pointer border-b border-rule align-middle transition-colors hover:bg-paper-2",
                      deplie && "bg-paper-2",
                    )}
                  >
                    <td className="max-w-[380px] py-2 pr-3">
                      <span className="flex items-baseline gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            "num shrink-0 text-[10px] text-signal transition-transform duration-200",
                            deplie && "rotate-90",
                          )}
                        >
                          ▸
                        </span>
                        <span className="num shrink-0 text-[10px] text-ink-3">
                          {String(l.rang).padStart(2, "0")}
                        </span>
                        <span className="text-[13px] leading-snug">{l.texte}</span>
                      </span>
                    </td>
                    {matrice.moteurs.map((m) => {
                      const c = l.cellules[m];
                      return (
                        <td key={m} className="px-1 py-2 text-center">
                          {c ? <CaseMatrice {...c} /> : null}
                        </td>
                      );
                    })}
                    <td className="py-2 pl-4">
                      {l.tenant ? (
                        <span className="text-[12px] leading-tight text-ink-2">
                          {l.tenant.nom}
                          <span className="num block text-[10px] text-ink-3">
                            {l.tenant.reponses} réponse{l.tenant.reponses > 1 ? "s" : ""}
                            {l.tenant.classe === "geant" ? " · géant" : ""}
                            {l.tenant.classe === "outil" ? " · plateforme" : ""}
                          </span>
                        </span>
                      ) : (
                        <span className="num text-[11px] text-ink-3">personne</span>
                      )}
                    </td>
                  </tr>
                  {deplie ? (
                    <tr className="border-b border-rule-strong bg-paper-2/60">
                      <td colSpan={matrice.moteurs.length + 2} className="px-4 py-5 sm:px-8">
                        {valides.length ? (
                          <div className="space-y-5">
                            {matrice.moteurs.map((m) => {
                              const rep = valides.find((r) => r.engine === m);
                              if (!rep) return null;
                              const citations = mentions.filter((x) => x.response_id === rep.id);
                              const cible = citations.find((x) => x.is_target);
                              const concurrents = citations
                                .filter((x) => !x.is_target)
                                .map((x) => x.brand);
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
                                    {concurrents.length ? (
                                      <span>cités : {concurrents.slice(0, 6).join(", ")}</span>
                                    ) : null}
                                  </p>
                                  <p className="mt-1.5 max-w-[80ch] whitespace-pre-line text-[13.5px] leading-[1.6] text-ink-2">
                                    <TexteMoteur texte={rep.raw_text ?? ""} />
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Vide>Aucune réponse conservée pour cette question.</Vide>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink">
              <td className="label-xs py-2.5 pr-3">cité sur</td>
              {matrice.moteurs.map((m) => {
                const t = matrice.totaux[m];
                return (
                  <td key={m} className="num px-1 py-2.5 text-center text-[12px]">
                    {t ? (
                      <>
                        <span className={cn(t.citees === 0 && "text-signal")}>{t.citees}</span>
                        <span className="text-ink-3">/{t.mesurees}</span>
                      </>
                    ) : null}
                  </td>
                );
              })}
              <td className="py-2.5 pl-4" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- duel */

/** Vous contre le rival qui prend la place : deux barres, comptées en réponses. */
export function Duel({
  marque,
  vous,
  adversaire,
  total,
}: {
  marque: string;
  vous: number;
  adversaire: { nom: string; reponses: number };
  total: number;
}) {
  const maxi = Math.max(adversaire.reponses, vous, 1);
  const barres = [
    { nom: adversaire.nom, valeur: adversaire.reponses, vous: false },
    { nom: marque, valeur: vous, vous: true },
  ];
  return (
    <div className="max-w-[620px]">
      {barres.map((b) => (
        <div key={b.nom} className="border-b border-rule py-3.5">
          <div className="flex items-baseline justify-between gap-4">
            <span className={cn("text-[15px]", b.vous ? "font-semibold text-signal" : "text-ink")}>
              {b.nom}
              {b.vous ? " ◂ vous" : ""}
            </span>
            <span className="num text-[24px] leading-none">
              {b.valeur}
              <span className="text-[12px] text-ink-3">
                {NBSP}réponse{b.valeur > 1 ? "s" : ""}
              </span>
            </span>
          </div>
          <div className="mt-2 h-3.5 w-full bg-paper-2">
            <div
              className={cn("h-3.5", b.vous ? "bg-signal" : "bg-ink")}
              style={{ width: `${Math.max(1, (b.valeur / maxi) * 100)}%` }}
              aria-hidden
            />
          </div>
        </div>
      ))}
      <p className="num mt-3 text-[11px] text-ink-3">
        comptées en réponses distinctes, sur {total} lues
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ part de voix */

const CLASSES_AFFICHEES: Record<string, string> = {
  geant: "géant",
  outil: "plateforme",
  institution: "institution",
};

export function VoixDocument({
  lignes,
  reponsesLues,
}: {
  lignes: { nom: string; reponses: number; cible: boolean; classe: string | null }[];
  reponsesLues: number;
}) {
  if (!lignes.length) return <Vide>Aucune marque détectée dans les réponses collectées.</Vide>;
  const maxi = Math.max(...lignes.map((l) => l.reponses), 1);
  return (
    <div className="max-w-[720px]">
      {lignes.map((l) => (
        <div key={l.nom} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule py-2.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex w-[170px] shrink-0 items-center gap-2 truncate text-[14px] md:w-[230px]",
                l.cible ? "font-semibold text-signal" : "text-ink-2",
              )}
            >
              <span className="truncate">{l.nom}</span>
              {l.cible ? <span className="shrink-0">◂</span> : null}
              {l.classe && CLASSES_AFFICHEES[l.classe] ? (
                <span className="num shrink-0 text-[10px] uppercase tracking-[0.08em] text-ink-3">
                  {CLASSES_AFFICHEES[l.classe]}
                </span>
              ) : null}
            </span>
            <span className="h-3 flex-1 bg-paper-2">
              <span
                className={cn("block h-3", l.cible ? "bg-signal" : "bg-rule-strong")}
                style={{ width: `${Math.max(1.5, (l.reponses / maxi) * 100)}%` }}
              />
            </span>
          </div>
          <span className="num text-[13px] tabular-nums text-ink-2">
            {l.reponses}
            <span className="text-ink-3">{NBSP}rép.</span>
          </span>
        </div>
      ))}
      <p className="num mt-3 text-[11px] text-ink-3">
        réponses distinctes où la marque apparaît, sur {reponsesLues} lues · variantes d'écriture regroupées
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- pièces */

export function PiecesDocument({ pieces }: { pieces: Piece[] }) {
  if (!pieces.length)
    return <Vide>Aucune phrase de recommandation d'un concurrent crédible sur cet échantillon.</Vide>;
  return (
    <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
      {pieces.map((p) => (
        <figure key={`${p.rang}-${p.moteur}`} className="avoid-break flex flex-col border-t-2 border-ink pt-4">
          <figcaption className="num text-[11px] text-ink-3">
            question {String(p.rang).padStart(2, "0")} · {p.moteur}
          </figcaption>
          <p className="mt-1 text-[13px] font-medium leading-snug">{p.question}</p>
          <blockquote className="quote-serif mt-4 flex-1 text-[17px] leading-[1.45]">
            «{NBSP}
            <TexteMarque texte={p.texte} />
            {NBSP}»
          </blockquote>
          <p className="num mt-4 border-t border-rule pt-2.5 text-[11px]">
            <span className="text-signal">{p.statut}</span>
            {p.coupe ? <span className="text-ink-3"> · extrait, texte intégral dans la carte des réponses</span> : null}
          </p>
        </figure>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- question clé */

export function FaceAFace({ faces }: { faces: FaceMoteur[] }) {
  return (
    <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
      {faces.map((f) => (
        <div key={f.moteur} className="avoid-break border-t border-rule-strong pt-3">
          <p className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium">
              <MoteurLogo moteur={f.moteur} className="text-[14px]" />
              {f.moteur}
            </span>
            <span
              className={cn(
                "num text-[11px]",
                f.erreur ? "text-ink-3" : f.statut.includes("absent") ? "text-signal" : "text-ink-2",
              )}
            >
              {f.erreur ? "hors mesure" : f.statut}
            </span>
          </p>
          {f.erreur ? (
            <p className="mt-2 text-[13px] text-ink-3">
              Réponse indisponible pendant la mesure : elle ne compte nulle part.
            </p>
          ) : (
            <>
              <p className="mt-2 text-[13px] leading-[1.55] text-ink-2">{f.extrait}</p>
              <p className="num mt-2 text-[10px] text-ink-3">
                {f.marques.length ? `cités : ${f.marques.join(", ")}` : "aucune marque citée"}
                {f.coupe ? " · texte intégral dans la carte des réponses" : ""}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- miroir */

export function MiroirDocument({
  miroir,
}: {
  miroir: { moteur: string; extrait: string; coupe: boolean; texte: string }[];
}) {
  if (!miroir.length)
    return <Vide>Aucune réponse exploitable n'a été obtenue sur la question miroir.</Vide>;
  return (
    <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
      {miroir.map((m, i) => (
        <figure key={`${i}-${m.moteur}`} className="avoid-break border-t border-rule-strong pt-3">
          <figcaption className="num mb-2 flex items-center gap-1.5 text-[11px] text-ink-3">
            <MoteurLogo moteur={m.moteur} className="text-[12px] text-ink" />
            {m.moteur}
          </figcaption>
          <blockquote className="quote-serif text-[15.5px] leading-[1.5]">{m.extrait}</blockquote>
          {m.coupe ? (
            <details className="mt-2">
              <summary className="num cursor-pointer list-none text-[11px] text-ink-3 underline underline-offset-2 hover:text-ink">
                lire la réponse entière
              </summary>
              <p className="mt-3 max-w-[70ch] whitespace-pre-line text-[13.5px] leading-[1.6] text-ink-2">
                <TexteMoteur texte={m.texte} />
              </p>
            </details>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- sources */

export function SourcesVue({ sources }: { sources: SourcesDocument }) {
  if (!sources.totalLectures)
    return (
      <Vide>
        Les moteurs interrogés n'ont pas exposé leurs sources sur cet échantillon.
      </Vide>
    );
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-x-12 gap-y-4 border-t border-rule pt-4">
        {[
          ["sites lus", String(sources.totalDomaines)],
          ["lectures", String(sources.totalLectures)],
          ["moteurs avec sources", sources.moteursAvecSources.join(", ") || "aucun"],
          [
            "votre site",
            sources.lecturesVotreSite === 0 ? "jamais lu" : `${sources.lecturesVotreSite} lecture${sources.lecturesVotreSite > 1 ? "s" : ""}`,
          ],
        ].map(([k, v]) => (
          <div key={k}>
            <Label>{k}</Label>
            <div
              className={cn(
                "num text-[22px] leading-tight",
                k === "votre site" && sources.lecturesVotreSite === 0 && "text-signal",
              )}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
      <ol className="grid gap-x-10 md:grid-cols-2">
        {sources.domaines.map((d, i) => (
          <li key={d.hote} className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
            <span className="flex min-w-0 items-baseline gap-3">
              <span className="num shrink-0 text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <span className={cn("truncate text-[14px]", d.votreSite && "font-semibold text-signal")}>
                {d.hote}
              </span>
              {d.votreSite ? <Etiquette ton="signal">votre site</Etiquette> : null}
            </span>
            <span className="num shrink-0 text-[12px] text-ink-3">
              {d.lectures} lecture{d.lectures > 1 ? "s" : ""}
              <span className="hidden sm:inline"> · {d.moteurs.join(", ")}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ----------------------------------------------------------------- plan */

const EFFORTS: Record<string, string> = { faible: "effort faible", moyen: "effort moyen", fort: "effort fort" };

export function Plan90({ phases }: { phases: PhasePlan[] }) {
  return (
    <ol className="space-y-14">
      {phases.map((p, i) => (
        <li key={p.nom} className="avoid-break grid gap-5 lg:grid-cols-[150px_1fr] lg:gap-10">
          <div className="border-t-2 border-ink pt-3 lg:sticky lg:top-10 lg:h-max">
            <div className="num text-[11px] text-ink-3">phase {i + 1}</div>
            <div className="num mt-1 text-[26px] leading-none">{p.periode}</div>
          </div>
          <div className="border-t border-rule-strong pt-3">
            <h3 className="text-[26px] leading-tight md:text-[30px]">{p.nom}</h3>
            <p className="mt-3 max-w-[62ch] border-l-2 border-signal pl-4 text-[14.5px] leading-relaxed text-ink-2">
              {p.constat}
            </p>

            {p.actions.length ? (
              <div className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2">
                {/* Clé composée : les titres sortent d'un modèle, rien ne
                    garantit leur unicité. */}
                {p.actions.map((a, j) => (
                  <div key={`${j}-${a.titre}`} className="border-b border-rule pb-3">
                    <div className="text-[14.5px] font-medium leading-snug">{a.titre}</div>
                    <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{a.pourquoi}</p>
                    <div className="num mt-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-3">
                      {EFFORTS[a.effort] ?? a.effort}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {p.cibles.length ? (
              <div className="mt-6">
                <Label className="pb-2">
                  {i === 1 ? "les questions à prendre en premier" : "où être cité en premier"}
                </Label>
                <ol className="border-t border-rule-strong">
                  {p.cibles.map((c, j) => (
                    <li key={`${j}-${c.titre}`} className="flex items-baseline gap-4 border-b border-rule py-2.5">
                      <span className="num shrink-0 text-[11px] text-ink-3">{String(j + 1).padStart(2, "0")}</span>
                      <span className="min-w-0">
                        <span className="block text-[14px] leading-snug">{c.titre}</span>
                        <span className="block text-[12px] leading-snug text-ink-3">{c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------------------------------------------------------- composantes */

export function ComposantesScore({
  composantes,
  reponsesLues,
  reponsesEnErreur,
}: {
  composantes: { presence: number; rang: number | null; recommandation: number; tonalite: number };
  reponsesLues: number;
  reponsesEnErreur: number;
}) {
  const blocs: { nom: string; valeur: string; ratio: number | null; poids: string }[] = [
    { nom: "présence", valeur: pourcent(composantes.presence * 100), ratio: composantes.presence, poids: "50 %" },
    {
      nom: "position moyenne",
      valeur: composantes.rang === null ? "—" : composantes.rang.toFixed(1).replace(".", ","),
      ratio: null,
      poids: "20 %",
    },
    {
      nom: "recommandation",
      valeur: pourcent(composantes.recommandation * 100),
      ratio: composantes.recommandation,
      poids: "20 %",
    },
    { nom: "tonalité", valeur: pourcent(composantes.tonalite * 100), ratio: composantes.tonalite, poids: "10 %" },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4">
        {blocs.map((b) => (
          <div key={b.nom}>
            <Label>
              {b.nom} <span className="text-ink-3">· {b.poids}</span>
            </Label>
            <div className="num mt-1 text-[30px] leading-tight">{b.valeur}</div>
            {b.ratio !== null ? (
              <div className="mt-2 h-1 w-full bg-paper-3">
                <div
                  className="h-1 bg-ink"
                  style={{ width: `${Math.min(100, Math.max(1, b.ratio * 100))}%` }}
                  aria-hidden
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <p className="num mt-4 text-[11px] text-ink-3">
        calculé sur {reponsesLues} réponses lues
        {reponsesEnErreur
          ? ` · ${reponsesEnErreur} réponse${reponsesEnErreur > 1 ? "s" : ""} en erreur, hors mesure`
          : ""}
      </p>
    </div>
  );
}
