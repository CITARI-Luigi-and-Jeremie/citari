import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import { MoteurLogo } from "@/components/moteur-logo";
import { TexteMoteur, Vide } from "@/components/rapport";
import { MOTEURS, NBSP } from "@/lib/typo";
import type {
  FaceMoteur,
  Matrice,
  PhasePlan,
  Piece,
  SourcesDocument,
  TechniqueDocument,
} from "@/lib/rapport-complet";
import type { LigneMention, LigneReponse } from "@/lib/rapport-apercu";

/**
 * Les visuels du DOCUMENT DE MESURE — direction « cadastre », 16/08/2026.
 *
 * UNE SEULE CONVENTION DE SURFACE, déclarée en tête du document et tenue sur
 * tous les chapitres. Elle dit qui tient quoi :
 *
 *   encre pleine             → tenu par vous
 *   hachure montante         → tenu par une autre marque
 *   papier nu                → personne, ou vous êtes absent
 *   hachure fine descendante → non relevé, hors mesure
 *
 * Le lecteur apprend la légende en dix secondes, puis lit le territoire sans
 * qu'on lui explique. Conséquence directe sur la matrice : une absence n'est
 * plus une case rose décorée d'une croix, c'est un TROU. Les 124 absences
 * d'un scan à 13/100 cessent de remplir l'écran et se mettent à manquer.
 *
 * LE ROUGE EST RATIONNÉ. `--signal` ne dit qu'une chose, la PERTE, et il ne
 * couvre jamais plus de 2 % de la surface encrée. On ne crée pas la tension
 * en ajoutant du rouge : la version précédente en avait 124 cases plus 24
 * chevrons, et à ce régime le rouge était un motif de fond qui n'alarmait
 * plus nulle part. `--verdict` (bleu encre) porte l'acquis mesuré, ce qui
 * rend les chapitres rouges crédibles.
 *
 * Aucun comptage ici : tout est assemblé par `rapport-complet.ts`.
 */

/* ------------------------------------------------------- typographie */

/**
 * Les nombres d'un titre passent en monospace : c'est la signature du
 * document, et elle distribue la tension sur les neuf chapitres au lieu de
 * la concentrer dans un cadran. `alerte` liste les nombres exacts à rendre
 * en signal — le chiffre en défaut, jamais le chiffre de contexte.
 *
 * Découpage déterministe (aucun aléa, rendu serveur sûr) : un nombre peut
 * porter une décimale française et des espaces insécables de groupement,
 * mais ne capture jamais la ponctuation qui le suit.
 */
const NOMBRE = /(\d(?:[\d\u00a0\u202f.,]*\d)?)/g;

export function TitreChiffre({ texte, alerte = [] }: { texte: string; alerte?: string[] }) {
  const morceaux = texte.split(NOMBRE);
  return (
    <>
      {morceaux.map((bout, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className={cn(
              "num text-[0.86em] font-medium tracking-[-0.02em]",
              alerte.includes(bout) && "text-signal",
            )}
          >
            {bout}
          </span>
        ) : (
          <Fragment key={i}>{bout}</Fragment>
        ),
      )}
    </>
  );
}

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

/* ----------------------------------------------------------- légende */

/** La convention de surface, déclarée UNE FOIS pour tout le document. */
export function Legende() {
  const items: { classe: string; texte: string }[] = [
    { classe: "bg-ink", texte: "tenu par vous" },
    { classe: "tenue border border-rule-strong", texte: "tenu par une autre marque" },
    { classe: "border border-rule-strong", texte: "personne, ou vous êtes absent" },
    { classe: "non-relevee border border-rule", texte: "non relevé, hors mesure" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((it) => (
        <li key={it.texte} className="flex items-center gap-2">
          <span className={cn("block h-3 w-3 shrink-0", it.classe)} aria-hidden />
          <span className="num text-[10.5px] text-ink-3">{it.texte}</span>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------- 01 · le verdict */

/** Les six bandes de verdict, seuils repris de `verdict()` dans typo.ts. */
const BANDES = [
  { min: 0, max: 15, nom: "invisible" },
  { min: 15, max: 30, nom: "quasi invisible" },
  { min: 30, max: 50, nom: "marginal" },
  { min: 50, max: 70, nom: "présent" },
  { min: 70, max: 85, nom: "bien établi" },
  { min: 85, max: 100, nom: "référence" },
];

/** Sous 30 la perte, au-delà de 70 l'acquis, entre les deux l'encre neutre. */
export function tonDuScore(score: number): string {
  if (score < 30) return "text-signal";
  if (score >= 70) return "text-verdict";
  return "text-ink";
}

/**
 * Le score n'est plus un nombre posé à côté d'un mot : c'est un POINT SUR
 * UNE RÈGLE GRADUÉE DE 0 À 100, tracée à l'échelle. À 13/100, le trait tombe
 * à 13 % et 87 % de la règle reste vide : le territoire manquant est dessiné
 * à l'échelle, sans un mot et sans rien inventer.
 */
export function RegleScore({
  score,
  verdict,
  precedent,
}: {
  score: number;
  verdict: string;
  /** Le scan initial, en mode comparaison : un second trait, creux. */
  precedent: number | null;
}) {
  const aGauche = score >= 50;
  return (
    <div className="w-full">
      <div className="relative h-[168px] w-full">
        {/* La bande du verdict atteint, hachurée : le territoire tenu. */}
        {BANDES.map((b) => {
          const dedans = score >= b.min && (score < b.max || (b.max === 100 && score >= 100));
          return (
            <span
              key={b.nom}
              aria-hidden
              className={cn("absolute bottom-[46px] h-[26px]", dedans && "tenue")}
              style={{ left: `${b.min}%`, width: `${b.max - b.min}%` }}
            />
          );
        })}

        {/* Ligne de base et graduations tous les 10. */}
        <span className="absolute bottom-[46px] left-0 h-px w-full bg-rule-strong" aria-hidden />
        {Array.from({ length: 11 }, (_, i) => i * 10).map((g) => (
          <span
            key={g}
            aria-hidden
            className={cn(
              "absolute w-px bg-rule-strong",
              g === 0 || g === 50 || g === 100 ? "bottom-[38px] h-[8px]" : "bottom-[42px] h-[4px]",
            )}
            style={{ left: `${g}%` }}
          />
        ))}
        {[0, 50, 100].map((g) => (
          <span
            key={g}
            className="num absolute bottom-[22px] text-[10px] text-ink-3"
            style={{ left: `${g}%`, transform: g === 100 ? "translateX(-100%)" : g === 50 ? "translateX(-50%)" : "none" }}
          >
            {g}
          </span>
        ))}

        {/* Les six bandes légendées : l'échelle de lecture du score. */}
        {BANDES.map((b) => (
          <span
            key={b.nom}
            className={cn(
              "num absolute bottom-0 hidden text-[9.5px] uppercase tracking-[0.08em] sm:block",
              score >= b.min && score < b.max ? "text-ink" : "text-ink-3",
            )}
            style={{ left: `${b.min}%`, width: `${b.max - b.min}%`, paddingLeft: "3px" }}
          >
            {b.nom}
          </span>
        ))}

        {/* Le scan initial, en comparaison : un trait creux et sa valeur. */}
        {precedent !== null ? (
          <span
            aria-hidden
            className="absolute bottom-[46px] h-[52px] w-px bg-ink-2"
            style={{ left: `${Math.min(100, Math.max(0, precedent))}%` }}
          />
        ) : null}

        {/* Le trait du score : la seule surface rouge du chapitre. */}
        <span
          aria-hidden
          className="absolute bottom-[46px] w-[3px] bg-signal"
          style={{ left: `${Math.min(100, Math.max(0, score))}%`, height: "72px" }}
        />

        {/* Le chiffre, posé du côté du trait où il reste de la place. */}
        <span
          className="num absolute bottom-[104px] flex items-baseline gap-2 whitespace-nowrap text-[64px] leading-[0.78] tracking-[-0.06em] sm:text-[128px]"
          style={{
            left: `${Math.min(100, Math.max(0, score))}%`,
            transform: aGauche ? "translateX(calc(-100% - 14px))" : "translateX(14px)",
          }}
        >
          {score}
          <span className="text-[13px] tracking-normal text-ink-3">sur 100</span>
        </span>
      </div>

      <p className={cn("mt-4 text-[24px] font-bold sm:text-[30px]", tonDuScore(score))}>{verdict}</p>
      {precedent !== null ? (
        <p className="num mt-1 text-[11px] text-ink-2">
          scan initial {precedent}
          {NBSP}·{NBSP}écart {score - precedent >= 0 ? "+" : "−"}
          {Math.abs(score - precedent)} pt
        </p>
      ) : null}
    </div>
  );
}

/**
 * Les quatre composantes, disposées en `50fr 20fr 20fr 10fr` : la largeur de
 * chaque colonne EST son poids dans la formule. La mise en page démontre la
 * formule au lieu de la réciter, et la colonne étroite du bout est un
 * argument visuel.
 */
export function ComposantesScore({
  composantes,
  reponsesLues,
  reponsesEnErreur,
}: {
  composantes: { presence: number; rang: number | null; recommandation: number; tonalite: number };
  reponsesLues: number;
  reponsesEnErreur: number;
}) {
  const blocs = [
    { nom: "présence", poids: "50 %", valeur: pourcentCourt(composantes.presence), ratio: composantes.presence },
    {
      nom: "position",
      poids: "20 %",
      valeur: composantes.rang === null ? "—" : composantes.rang.toFixed(1).replace(".", ","),
      ratio: null,
    },
    { nom: "recommandation", poids: "20 %", valeur: pourcentCourt(composantes.recommandation), ratio: composantes.recommandation },
    { nom: "tonalité", poids: "10 %", valeur: pourcentCourt(composantes.tonalite), ratio: composantes.tonalite },
  ];
  return (
    <div>
      {/* Les colonnes de droite reçoivent un plancher : à 10fr sur une page
          étroite, « tonalité · 10 % » n'a plus la place de s'écrire, et un
          label tronqué ruine la démonstration. */}
      <div
        className="grid border-t border-rule-strong"
        style={{
          gridTemplateColumns: "minmax(0,50fr) minmax(0,20fr) minmax(0,20fr) minmax(104px,10fr)",
        }}
      >
        {blocs.map((b, i) => (
          <div key={b.nom} className={cn("min-w-0 py-4 pr-4", i > 0 && "border-l border-rule pl-4")}>
            <div className="label-xs leading-tight">
              {b.nom} <span className="text-ink-3">· {b.poids}</span>
            </div>
            <div className="num mt-1 text-[22px] leading-tight sm:text-[34px]">{b.valeur}</div>
            {b.ratio !== null ? (
              <div className="mt-2 h-1 w-full bg-paper-2">
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
      <p className="num mt-3 text-[10.5px] text-ink-3">
        calculé sur {reponsesLues} réponses lues
        {reponsesEnErreur ? ` · ${reponsesEnErreur} en erreur, hors mesure` : ""}
      </p>
    </div>
  );
}

function pourcentCourt(v: number) {
  return `${Math.round(v * 100)}${NBSP}%`;
}

/** Les six moteurs en bandeau : une note par moteur, sur le même axe. */
export function BandeauMoteurs({
  scores,
  avant,
}: {
  scores: Record<string, number | null>;
  avant?: Record<string, number | null> | null;
}) {
  return (
    <div className="grid grid-cols-3 border-t border-rule-strong lg:grid-cols-6">
      {MOTEURS.map((m, i) => {
        const v = scores[m];
        const a = avant?.[m];
        const nul = v === null || v === undefined;
        return (
          <div
            key={m}
            className={cn("min-w-0 py-4 pr-3", i > 0 && "lg:border-l lg:border-rule lg:pl-4")}
          >
            <div className="label-xs flex items-center gap-1.5 truncate">
              <MoteurLogo moteur={m} className="shrink-0 text-[13px] text-ink" />
              <span className="truncate">{m}</span>
            </div>
            <div
              className={cn(
                "num mt-1 text-[30px] leading-none sm:text-[44px]",
                !nul && Number(v) === 0 && "text-signal",
                !nul && Number(v) >= 70 && "text-verdict",
              )}
            >
              {nul ? "—" : v}
            </div>
            <div className="mt-2.5 h-[3px] w-full bg-paper-2">
              <div
                className={cn("h-[3px]", !nul && Number(v) >= 70 ? "bg-verdict" : "bg-ink")}
                style={{ width: `${Math.max(1, Number(v ?? 0))}%` }}
                aria-hidden
              />
            </div>
            {typeof a === "number" && typeof v === "number" ? (
              <div className="num mt-1.5 text-[10px] text-ink-3">
                avant {a} → après {v}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------- 02 · carte des réponses */

/**
 * La carte : questions en lignes, moteurs en segments JOINTIFS, et la bande
 * du tenant le long du bord droit. Sur 24 lignes, cette bande produit un mur
 * hachuré continu face à six colonnes presque vides : l'œil lit « tout est
 * tenu, sauf par vous » avant de lire un seul chiffre.
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

  const colonnes = `34px minmax(220px, 1fr) repeat(${matrice.moteurs.length}, 46px) minmax(140px, 220px)`;

  return (
    <div>
      {/* En-tête de colonnes */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div
            className="grid items-end gap-0 border-b border-rule-strong pb-2"
            style={{ gridTemplateColumns: colonnes }}
          >
            <span className="label-xs">nº</span>
            <span className="label-xs">question</span>
            {matrice.moteurs.map((m) => (
              <span key={m} className="flex flex-col items-center gap-1 px-1">
                <MoteurLogo moteur={m} className="text-[14px] text-ink" />
                <span className="num text-[9px] text-ink-3">{m.slice(0, 4)}</span>
              </span>
            ))}
            <span className="label-xs pl-4">qui tient la question</span>
          </div>

          {matrice.lignes.map((l) => {
            const deplie = ouverte === l.id;
            const valides = reponses.filter((r) => r.query_id === l.id && !r.error && r.raw_text);
            return (
              <Fragment key={l.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOuverte(deplie ? null : l.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOuverte(deplie ? null : l.id);
                    }
                  }}
                  className={cn(
                    "grid cursor-pointer items-stretch border-b border-rule transition-colors hover:bg-paper-2",
                    deplie && "bg-paper-2",
                  )}
                  style={{ gridTemplateColumns: colonnes }}
                >
                  <span className="num flex items-center py-2 text-[10px] text-ink-3">
                    <span
                      aria-hidden
                      className={cn("mr-1 inline-block transition-transform", deplie && "rotate-90")}
                    >
                      ▸
                    </span>
                    {String(l.rang).padStart(2, "0")}
                  </span>
                  <span className="flex items-center py-2 pr-4 text-[13px] leading-snug">
                    {l.texte}
                  </span>
                  {matrice.moteurs.map((m) => {
                    const c = l.cellules[m];
                    if (!c) return <span key={m} />;
                    if (c.etat === "erreur")
                      return (
                        <span
                          key={m}
                          title="Réponse indisponible, hors mesure"
                          className="non-relevee num flex items-center justify-center border-l border-paper text-[10px] text-ink-3"
                        >
                          –
                        </span>
                      );
                    if (c.etat === "absent")
                      return (
                        <span
                          key={m}
                          title={`${marque} n'apparaît pas dans cette réponse`}
                          className="border-l border-rule"
                        />
                      );
                    return (
                      <span
                        key={m}
                        title={`${marque} cité${c.position ? ` en position ${c.position}` : ""}${c.recommande ? ", et recommandé" : ""}`}
                        className="num relative flex items-center justify-center border-l border-paper bg-ink text-[11px] font-medium text-paper"
                        style={c.recommande ? { boxShadow: "inset 0 -3px 0 var(--signal)" } : undefined}
                      >
                        {c.position ?? "✓"}
                      </span>
                    );
                  })}
                  <span
                    className={cn(
                      "flex flex-col justify-center border-l border-rule py-2 pl-4",
                      l.tenant && "tenue",
                    )}
                  >
                    {l.tenant ? (
                      <>
                        <span className="truncate text-[12.5px] font-medium text-ink-2">
                          {l.tenant.nom}
                        </span>
                        <span className="num text-[10px] text-ink-3">
                          {l.tenant.reponses} rép.
                          {l.tenant.classe === "geant" ? " · géant" : ""}
                          {l.tenant.classe === "outil" ? " · plateforme" : ""}
                        </span>
                      </>
                    ) : (
                      <span className="num text-[10px] text-ink-3">personne</span>
                    )}
                  </span>
                </div>

                {deplie ? (
                  <div className="border-b border-rule-strong bg-paper-2 py-6">
                    {valides.length ? (
                      <div className="space-y-6">
                        {matrice.moteurs.map((m) => {
                          const rep = valides.find((r) => r.engine === m);
                          if (!rep) return null;
                          const citations = mentions.filter((x) => x.response_id === rep.id);
                          const cible = citations.find((x) => x.is_target);
                          const concurrents = citations.filter((x) => !x.is_target).map((x) => x.brand);
                          return (
                            <div
                              key={m}
                              className="grid gap-x-6 gap-y-2 border-l-2 border-ink pl-4 md:grid-cols-[96px_1fr]"
                            >
                              <div className="num text-[11px] leading-relaxed text-ink-3">
                                <span className="flex items-center gap-1.5 text-ink">
                                  <MoteurLogo moteur={m} className="text-[12px]" />
                                  {m}
                                </span>
                                {cible ? (
                                  <span className="block">position {cible.position ?? "?"}</span>
                                ) : (
                                  <span className="block text-signal">absent</span>
                                )}
                                {concurrents.length ? (
                                  <span className="mt-1 block">{concurrents.slice(0, 5).join(", ")}</span>
                                ) : null}
                              </div>
                              <p className="serif-roman max-w-[78ch] whitespace-pre-line text-[16px] leading-[1.6] text-ink">
                                <TexteMoteur texte={rep.raw_text ?? ""} />
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Vide>Aucune réponse conservée pour cette question.</Vide>
                    )}
                  </div>
                ) : null}
              </Fragment>
            );
          })}

          {/* Pied : le compte par moteur, sur le même axe que les segments. */}
          <div
            className="grid items-center border-t-2 border-ink pt-2"
            style={{ gridTemplateColumns: colonnes }}
          >
            <span />
            <span className="label-xs">cité sur</span>
            {matrice.moteurs.map((m) => {
              const t = matrice.totaux[m];
              return (
                <span key={m} className="num flex flex-col items-center text-[13px]">
                  <span className={cn(t && t.citees === 0 && "text-signal")}>{t?.citees ?? 0}</span>
                  <span className="text-[10px] text-ink-3">/{t?.mesurees ?? 0}</span>
                </span>
              );
            })}
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------- 03 · le rapport de forces */

/**
 * Le duel sur UN AXE UNIQUE dont le maximum est le nombre de réponses lues.
 * L'ancien axe (le maximum des deux barres) donnait au rival une barre
 * pleine largeur quelle que soit sa domination : l'écart réel disparaissait,
 * et le tiers de terrain que personne ne tient restait invisible.
 */
export function Duel({
  marque,
  vous,
  adversaire,
  lues,
}: {
  marque: string;
  vous: number;
  adversaire: { nom: string; reponses: number };
  lues: number;
}) {
  const axe = Math.max(lues, adversaire.reponses, vous, 1);
  const ecart = adversaire.reponses - vous;
  const barres = [
    { nom: adversaire.nom, valeur: adversaire.reponses, vous: false },
    { nom: marque, valeur: vous, vous: true },
  ];
  return (
    <div>
      {barres.map((b) => (
        <div key={b.nom} className="border-b border-rule py-3.5">
          <div className="flex items-baseline justify-between gap-4">
            <span className={cn("text-[15px]", b.vous ? "font-semibold" : "text-ink-2")}>
              {b.nom}
              {b.vous ? " ◂ vous" : ""}
            </span>
            <span className="num text-[22px] leading-none">
              {b.valeur}
              <span className="text-[11px] text-ink-3">
                {NBSP}rép.
              </span>
            </span>
          </div>
          <div className="mt-2 h-[18px] w-full">
            <div
              className={cn("h-[18px]", b.vous ? "bg-ink" : "tenue border border-ink")}
              style={{ width: `${Math.max(0.8, (b.valeur / axe) * 100)}%` }}
              aria-hidden
            />
          </div>
        </div>
      ))}

      {/* Le trait d'écart : un seul trait rouge, mesuré, qui dit le chapitre. */}
      {ecart > 0 ? (
        <div className="mt-4">
          <div className="relative h-3" aria-hidden>
            <span
              className="absolute top-1/2 h-[2px] bg-signal"
              style={{
                left: `${(vous / axe) * 100}%`,
                width: `${((adversaire.reponses - vous) / axe) * 100}%`,
              }}
            />
            <span
              className="absolute top-0 h-3 w-px bg-signal"
              style={{ left: `${(vous / axe) * 100}%` }}
            />
            <span
              className="absolute top-0 h-3 w-px bg-signal"
              style={{ left: `${(adversaire.reponses / axe) * 100}%` }}
            />
          </div>
          <p className="num mt-1 text-[11px] text-signal">
            {ecart} réponse{ecart > 1 ? "s" : ""} d'écart
          </p>
        </div>
      ) : null}

      <p className="num mt-3 text-[10.5px] text-ink-3">
        axe commun : {lues} réponses lues · comptées en réponses distinctes
      </p>
    </div>
  );
}

const CLASSES_AFFICHEES: Record<string, string> = {
  geant: "géant",
  outil: "plateforme",
  institution: "institution",
};

/** La part de voix devient un classement de parcelles, sur le même axe. */
export function VoixDocument({
  lignes,
  lues,
}: {
  lignes: { nom: string; reponses: number; cible: boolean; classe: string | null }[];
  lues: number;
}) {
  if (!lignes.length) return <Vide>Aucune marque détectée dans les réponses collectées.</Vide>;
  const axe = Math.max(lues, ...lignes.map((l) => l.reponses), 1);
  return (
    <div>
      {lignes.map((l, i) => (
        <div
          key={l.nom}
          className={cn(
            "grid items-center gap-x-4 py-2.5",
            l.cible ? "border-y border-ink" : "border-b border-rule",
          )}
          style={{ gridTemplateColumns: "28px minmax(120px, 200px) 1fr 72px 56px" }}
        >
          <span className="num text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
          <span className={cn("truncate text-[14px]", l.cible ? "font-semibold" : "text-ink-2")}>
            {l.nom}
            {l.cible ? " ◂" : ""}
          </span>
          <span className="h-[14px] w-full">
            <span
              className={cn("block h-[14px]", l.cible ? "bg-ink" : "tenue")}
              style={{ width: `${Math.max(0.8, (l.reponses / axe) * 100)}%` }}
            />
          </span>
          <span className="num text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
            {l.classe && CLASSES_AFFICHEES[l.classe] ? CLASSES_AFFICHEES[l.classe] : ""}
          </span>
          <span className="num text-right text-[13px] tabular-nums text-ink-2">{l.reponses}</span>
        </div>
      ))}
      <p className="num mt-3 text-[10.5px] text-ink-3">
        réponses distinctes où la marque apparaît, sur {lues} lues · variantes regroupées
      </p>
    </div>
  );
}

/* ------------------------------------------- 04 · les phrases exactes */

/**
 * Trois colonnes de citations seraient une grille de cartes déguisée. Les
 * pièces deviennent des bandes pleine largeur en grammaire de marginalia :
 * la référence à gauche, la parole à droite, beaucoup d'air. C'est le seul
 * endroit du document où l'on entend une voix humaine, ce que la serif
 * italique rend audible.
 */
export function PiecesDocument({ pieces }: { pieces: Piece[] }) {
  if (!pieces.length)
    return <Vide>Aucune phrase de recommandation d'un concurrent crédible sur cet échantillon.</Vide>;
  return (
    <div>
      {pieces.map((p, i) => (
        <figure
          key={`${i}-${p.rang}-${p.moteur}`}
          className="avoid-break grid gap-x-8 gap-y-3 border-t border-rule py-8 md:grid-cols-[148px_1fr]"
        >
          <figcaption className="num text-[11px] leading-relaxed text-ink-3">
            <span className="block text-ink">pièce {String(i + 1).padStart(2, "0")}</span>
            <span className="block">question {String(p.rang).padStart(2, "0")}</span>
            <span className="mt-1 flex items-center gap-1.5 text-ink">
              <MoteurLogo moteur={p.moteur} className="text-[12px]" />
              {p.moteur}
            </span>
            <span className="mt-2 block text-signal">{p.statut}</span>
            {p.coupe ? <span className="block">extrait</span> : null}
            <span className="mt-3 block max-w-[24ch] text-[13.5px] font-medium leading-snug text-ink-2 [font-family:var(--font-sans)]">
              {p.question}
            </span>
          </figcaption>
          <blockquote className="serif-ital max-w-[60ch] text-[19px] leading-[1.45] sm:text-[22px]">
            <span className="text-ink-3">«{NBSP}</span>
            <TexteMarque texte={p.texte} />
            <span className="text-ink-3">{NBSP}»</span>
          </blockquote>
        </figure>
      ))}
    </div>
  );
}

/* ---------------------------------------- 05 · la question décisive */

/**
 * Six colonnes de journal, pas six cartes. Le moment de tension est
 * structurel et gratuit : les lignes d'état sont alignées sur la même ligne
 * de base, et les « absent » en signal forment une règle rouge horizontale
 * qui traverse la page. Personne ne l'a dessinée, c'est la donnée.
 */
export function FaceAFace({ faces }: { faces: FaceMoteur[] }) {
  return (
    <div
      className="grid gap-0 border-t border-rule-strong sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {faces.map((f, i) => (
        <div
          key={f.moteur}
          className={cn(
            "avoid-break flex min-w-0 flex-col gap-2 px-0 py-4 sm:px-4",
            i > 0 && "border-t border-rule sm:border-t-0 sm:border-l sm:border-rule",
            i === 0 && "sm:pl-0",
          )}
        >
          <span className="label-xs flex items-center gap-1.5 truncate">
            <MoteurLogo moteur={f.moteur} className="shrink-0 text-[13px] text-ink" />
            <span className="truncate">{f.moteur}</span>
          </span>
          <span
            className={cn(
              "num text-[10.5px]",
              f.erreur ? "non-relevee px-1 text-ink-3" : f.statut.includes("absent") ? "text-signal" : "text-ink",
            )}
          >
            {f.erreur ? "hors mesure" : f.statut}
          </span>
          {f.erreur ? (
            <p className="text-[13px] leading-[1.55] text-ink-3">
              Réponse indisponible pendant la mesure.
            </p>
          ) : (
            <>
              <p className="text-[13px] leading-[1.55] text-ink-2">{f.extrait}</p>
              {f.marques.length ? (
                <p className="mt-auto flex flex-wrap gap-1 pt-2">
                  {f.marques.map((m) => (
                    <span key={m} className="tenue num px-1.5 py-0.5 text-[10px] text-ink-2">
                      {m}
                    </span>
                  ))}
                </p>
              ) : null}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------- 06 · la question miroir */

/**
 * Le seul chapitre où le nom du client a été prononcé : il doit se sentir
 * différent. Serif ROMAN et non italique — au chapitre des phrases,
 * l'italique signalait une parole prélevée comme pièce ; ici c'est un texte
 * rendu tel quel. La mention hors score court en marge, à la verticale : du
 * vocabulaire de document administratif, pas une décoration, et elle règle
 * l'avertissement méthodologique que personne ne lit en texte courant.
 */
export function MiroirDocument({
  miroir,
}: {
  miroir: { moteur: string; extrait: string; coupe: boolean; texte: string }[];
}) {
  if (!miroir.length)
    return <Vide>Aucune réponse exploitable n'a été obtenue sur la question miroir.</Vide>;
  return (
    <div className="relative">
      <span
        aria-hidden
        className="num absolute -left-8 top-0 hidden text-[10px] uppercase tracking-[0.2em] text-ink-3 xl:block"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        hors score · hors méthodologie
      </span>
      <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
        {miroir.map((m, i) => (
          <figure key={`${i}-${m.moteur}`} className="avoid-break">
            <figcaption className="num mb-2 flex items-center gap-1.5 text-[10.5px] text-ink-3">
              <MoteurLogo moteur={m.moteur} className="text-[12px] text-ink" />
              {m.moteur}
            </figcaption>
            <blockquote className="serif-roman max-w-[46ch] text-[16px] leading-[1.6] sm:text-[17px]">
              {m.extrait}
            </blockquote>
            {m.coupe ? (
              <details className="mt-2">
                <summary className="num cursor-pointer list-none text-[11px] text-ink-3 underline underline-offset-2 hover:text-ink">
                  lire la réponse entière
                </summary>
                <p className="serif-roman mt-3 max-w-[46ch] whitespace-pre-line text-[16px] leading-[1.6]">
                  <TexteMoteur texte={m.texte} />
                </p>
              </details>
            ) : null}
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------ 07 · l'accès des robots */

/**
 * Le plus petit chapitre du document, et c'est délibéré : sa brièveté après
 * deux grosses planches est un événement de rythme. Les points de conduite
 * relient l'objet à sa valeur, comme un bordereau français.
 *
 * Une porte ouverte est un ACQUIS et se lit en `--verdict`. Conséquence
 * assumée : sur un site ouvert, ce chapitre est entièrement bleu, sans une
 * trace de rouge. Un document rouge de bout en bout n'alarme plus nulle
 * part ; c'est ce chapitre bleu qui rend les autres crédibles.
 */
export function ReleveRobots({
  technique,
  domaine,
}: {
  technique: TechniqueDocument;
  domaine: string | null;
}) {
  if (!technique)
    return <Vide>Le fichier robots.txt du site n'a pas pu être lu pendant la mesure.</Vide>;

  const lignes: { nom: string; ouverte: boolean; note: string }[] = [
    ...technique.bloques.map((r) => ({ nom: r, ouverte: false, note: "REFUSÉE" })),
    ...technique.autorises.map((r) => ({
      nom: r.nom,
      ouverte: true,
      note: r.explicite ? "OUVERTE" : "OUVERTE PAR DÉFAUT",
    })),
  ].sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <div className="max-w-[720px]">
      {lignes.map((l) => (
        <div
          key={l.nom}
          className={cn(
            "flex items-baseline gap-3 border-b border-rule py-2.5",
            !l.ouverte && "bg-signal-tint px-2",
          )}
        >
          <span className="num shrink-0 text-[13px]">{l.nom}</span>
          <span className="conduite" aria-hidden />
          <span
            className={cn(
              "num shrink-0 text-[12px] font-medium",
              l.ouverte ? "text-verdict" : "font-semibold text-signal",
            )}
          >
            {l.note}
          </span>
        </div>
      ))}
      <div className="flex items-baseline gap-3 border-b border-rule py-2.5">
        <span className="num shrink-0 text-[13px]">llms.txt</span>
        <span className="conduite" aria-hidden />
        <span
          className={cn(
            "num shrink-0 text-[12px] font-medium",
            technique.llmstxt ? "text-verdict" : "text-ink-3",
          )}
        >
          {technique.llmstxt ? "PRÉSENT" : "ABSENT"}
        </span>
      </div>
      {domaine ? (
        <p className="num mt-4 text-[11px] text-ink-3">
          relevé public, vérifiable sur {domaine.replace(/^https?:\/\//, "")}/robots.txt
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------- 08 · où les IA lisent */

/**
 * Les six pastilles par ligne sont l'apport principal : pour chacun des six
 * moteurs, un carré plein si CE moteur a lu ce domaine. La donnée existait
 * déjà et était diluée en une liste de noms séparés par des virgules. Vingt
 * lignes de six carrés forment une trame qui montre d'un coup d'œil les
 * vraies places fortes, celles que tous les moteurs lisent.
 *
 * Unité : ce chapitre compte des LECTURES, jamais des réponses. Son axe ne
 * partage donc aucune échelle avec les chapitres précédents.
 */
export function SourcesVue({ sources }: { sources: SourcesDocument }) {
  if (!sources.totalLectures)
    return <Vide>Les moteurs interrogés n'ont pas exposé leurs sources sur cet échantillon.</Vide>;

  const axe = Math.max(...sources.domaines.map((d) => d.lectures), 1);
  const stats = [
    { nom: "sites lus", valeur: String(sources.totalDomaines), alerte: false },
    { nom: "lectures", valeur: String(sources.totalLectures), alerte: false },
    { nom: "moteurs citant des sources", valeur: String(sources.moteursAvecSources.length), alerte: false },
    {
      nom: "votre site",
      valeur:
        sources.lecturesVotreSite === 0
          ? "jamais lu"
          : `${sources.lecturesVotreSite} lecture${sources.lecturesVotreSite > 1 ? "s" : ""}`,
      alerte: sources.lecturesVotreSite === 0,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 border-y border-rule-strong sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.nom} className={cn("min-w-0 py-4 pr-4", i > 0 && "sm:border-l sm:border-rule sm:pl-4")}>
            <div className="label-xs truncate">{s.nom}</div>
            <div className={cn("num mt-1 text-[22px] leading-tight sm:text-[30px]", s.alerte && "text-signal")}>
              {s.valeur}
            </div>
          </div>
        ))}
      </div>

      <ol className="mt-8">
        {sources.domaines.map((d, i) => (
          <li
            key={d.hote}
            className={cn(
              "grid items-center gap-x-4 py-2",
              d.votreSite ? "border-y border-ink" : "border-b border-rule",
            )}
            style={{ gridTemplateColumns: "28px minmax(140px, 260px) 1fr auto 64px" }}
          >
            <span className="num text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <span className={cn("truncate text-[15px]", d.votreSite ? "font-semibold" : "text-ink-2")}>
              {d.hote}
              {d.votreSite ? <span className="num ml-2 text-[10px] text-signal">votre site</span> : null}
            </span>
            <span className="hidden h-[12px] w-full sm:block">
              <span
                className={cn("block h-[12px]", d.votreSite ? "border border-ink bg-ink" : "tenue")}
                style={{ width: `${Math.max(1, (d.lectures / axe) * 100)}%` }}
              />
            </span>
            <span className="hidden gap-[3px] sm:flex" title={`Lu par : ${d.moteurs.join(", ")}`}>
              {MOTEURS.map((m) => (
                <span
                  key={m}
                  aria-hidden
                  className={cn(
                    "block h-2 w-2",
                    d.moteurs.includes(m) ? "bg-ink" : "border border-rule",
                  )}
                />
              ))}
            </span>
            <span className="num text-right text-[13px] text-ink-2">{d.lectures}</span>
          </li>
        ))}
      </ol>
      <p className="num mt-3 text-[10.5px] text-ink-3">
        lectures relevées dans les réponses · les six carrés disent quels moteurs lisent ce site
      </p>
    </div>
  );
}

/* --------------------------------------------- 09 · le plan des 90 jours */

const EFFORTS: Record<string, string> = { faible: "EFFORT FAIBLE", moyen: "EFFORT MOYEN", fort: "EFFORT FORT" };

/**
 * La frise : les trois phases positionnées à l'échelle réelle. Elles SE
 * CHEVAUCHENT, et c'est exactement l'argument commercial que trois blocs
 * empilés dissimulent : les chantiers sont concurrents, pas séquentiels.
 */
export function Frise90({ phases, questions }: { phases: PhasePlan[]; questions: number }) {
  const reperes = [1, 15, 30, 45, 60, 75, 90];
  const pos = (j: number) => ((j - 1) / 89) * 100;
  return (
    <div className="avoid-break">
      <div className="relative" style={{ height: `${28 + phases.length * 26}px` }}>
        {reperes.map((j) => (
          <Fragment key={j}>
            <span
              aria-hidden
              className="absolute top-0 w-px bg-rule"
              style={{ left: `${pos(j)}%`, height: `${phases.length * 26}px` }}
            />
            <span
              className="num absolute text-[10px] text-ink-3"
              style={{
                left: `${pos(j)}%`,
                bottom: 0,
                transform: j === 90 ? "translateX(-100%)" : "none",
              }}
            >
              J{j}
            </span>
          </Fragment>
        ))}
        {phases.map((p, i) => (
          <span
            key={p.nom}
            className="absolute flex h-[18px] items-center bg-paper-2"
            style={{
              left: `${pos(p.debut)}%`,
              width: `${Math.max(4, pos(p.fin) - pos(p.debut))}%`,
              top: `${i * 26}px`,
              borderLeft: "2px solid var(--ink)",
            }}
          >
            <span className="truncate px-2 text-[12px] font-semibold">{p.nom}</span>
          </span>
        ))}
      </div>
      <p className="num mt-2 text-[10.5px] text-ink-3">
        re-scan à J+90, les mêmes {questions} questions
      </p>
    </div>
  );
}

export function Plan90({ phases }: { phases: PhasePlan[] }) {
  return (
    <ol className="mt-16 space-y-24">
      {phases.map((p, i) => (
        <li key={p.nom} className="grid gap-6 lg:grid-cols-[200px_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-10 lg:h-max">
            <div className="num text-[12px] text-ink-3">phase {i + 1}</div>
            <div className="num mt-1 text-[24px] leading-none sm:text-[30px]">
              J{p.debut} → J{p.fin}
            </div>
          </div>
          <div className="border-l-2 border-ink pl-6">
            <h3 className="serif-roman text-[28px] leading-tight sm:text-[34px]">{p.nom}</h3>
            <p className="mt-3 max-w-[60ch] border-l-2 border-signal pl-4 text-[15.5px] leading-relaxed text-ink-2">
              {p.constat}
            </p>

            {p.actions.length ? (
              <div className="mt-8 border-t border-rule-strong">
                {p.actions.map((a, j) => (
                  <div
                    key={`${j}-${a.titre}`}
                    className="row-hover grid items-baseline gap-x-4 border-b border-rule py-3.5 sm:grid-cols-[28px_1fr_auto]"
                  >
                    <span className="num text-[10px] text-ink-3">{String(j + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium leading-snug">{a.titre}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{a.pourquoi}</span>
                    </span>
                    <span className="num whitespace-nowrap text-[10px] tracking-[0.1em] text-ink-3">
                      {EFFORTS[a.effort] ?? a.effort}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {p.cibles.length ? (
              <div className="mt-10">
                <div className="label-xs pb-3">
                  {i === 1 ? "les questions à prendre en premier" : "où être cité en premier"}
                </div>
                <ol className="border-t border-rule-strong">
                  {p.cibles.map((c, j) => (
                    <li
                      key={`${j}-${c.titre}`}
                      className="flex items-baseline gap-4 border-b border-rule py-3"
                    >
                      <span className="tenue mt-1 block h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="min-w-0">
                        <span className="serif-ital block text-[16px] leading-snug">{c.titre}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">
                          {c.detail}
                        </span>
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
