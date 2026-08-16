import { useCallback, useEffect, useRef, useState } from "react";

import { GrilleFond } from "@/components/jeremie/rapport/GrilleFond";
import {
  CARD,
  HAIR,
  INK,
  MONO,
  MUTED,
  ON_DEEP,
  ON_DEEP_MUTED,
  PAPER,
  SANS,
} from "@/components/jeremie/rapport/theme";
import {
  BandeauMoteurs,
  BandeIntentions,
  ComposantesScore,
  Duel,
  FaceAFace,
  Frise90,
  Legende,
  MatriceReponses,
  MiroirDocument,
  PiecesDocument,
  Plan90,
  RegleScore,
  ReleveRobots,
  SourcesVue,
  TitreChiffre,
  TonaliteDepliee,
  VoixDocument,
} from "@/components/rapport-complet";
import type { DonneesDocument } from "@/lib/rapport-complet";
import type { LigneMention, LigneReponse } from "@/lib/rapport-apercu";
import { fr, frTitre, verdict as motVerdict, NBSP } from "@/lib/typo";
import { CONTACT_EMAIL } from "@/lib/site";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * LA PROJECTION : le scan complet en séquence guidée, 16/08/2026.
 *
 * Trois passes de document défilant, et le même verdict de Luigi à chaque
 * fois : « pas lisible, pas intuitif, pas clair ». Le diagnostic final : on
 * avait construit un document d'expert, alors que le seul format validé de
 * ce produit est la SÉQUENCE de l'aperçu — un écran, un message, un bouton
 * « Suivant », testée sur le père de Luigi. Quatorze mille pixels de
 * défilement en partage d'écran, c'est le consultant qui fait tout le
 * travail de guidage ; une carte à la fois, c'est le document qui le fait.
 *
 * La projection reprend donc la grammaire EXACTE de l'aperçu (fond encre
 * quadrillé, carte claire centrée, « Suivant : {l'étape qui suit
 * RÉELLEMENT} », flèches du clavier, points de progression) et y verse
 * toute la profondeur du complet : les visuels du cadastre vivent DANS les
 * cartes, l'assemblage (`construireDocument`) est strictement le même, pas
 * un comptage ne bouge. Une carte sans donnée sort de la séquence.
 *
 * Le document défilant n'est pas jeté : il devient la VERSION IMPRIMABLE,
 * ce pour quoi sa forme est bonne. Écran = projection, papier = document,
 * une seule source de chiffres.
 */

const minuscule = (titre: string) => titre.charAt(0).toLowerCase() + titre.slice(1);

type Carte = {
  clef: string;
  /** Titre court, pour l'en-tête de carte, le bouton Suivant et les points. */
  titre: string;
  /** Le chiffre clé, affiché sur la carte sommaire. */
  cle: string;
};

export function ProjectionComplet({
  donnees,
  reponses,
  mentions,
  score,
  precedent,
  parMoteur,
  wide,
  onImprimer,
}: {
  donnees: DonneesDocument;
  reponses: LigneReponse[];
  mentions: LigneMention[];
  score: number;
  precedent: { score: number; parMoteur: Record<string, number | null> } | null;
  parMoteur: Record<string, number | null>;
  wide: boolean;
  /** Bascule vers la version imprimable (le document défilant). */
  onImprimer: () => void;
}) {
  const lues = donnees.echantillon.reponsesLues;
  const bloques = donnees.technique?.bloques.length ?? 0;

  const cartes: Carte[] = [
    { clef: "essentiel", titre: "L'essentiel", cle: "" },
    { clef: "verdict", titre: "Le verdict", cle: `${score}/100` },
    {
      clef: "carte",
      titre: "La carte des réponses",
      cle: `${donnees.matrice.questionsCitees}/${donnees.matrice.questionsMesurees} questions`,
    },
    { clef: "forces", titre: "Le rapport de forces", cle: `${donnees.voix.marquesTotal} marques` },
    ...(donnees.pieces.length
      ? [{
          clef: "pieces",
          titre: "Les phrases exactes",
          cle: `${donnees.pieces.length} pièce${donnees.pieces.length > 1 ? "s" : ""}`,
        }]
      : []),
    ...(donnees.questionCle
      ? [{
          clef: "decisive",
          titre: "La question décisive",
          cle: `question ${String(donnees.questionCle.rang).padStart(2, "0")}`,
        }]
      : []),
    ...(donnees.miroir.length
      ? [{
          clef: "miroir",
          titre: "Ce que les IA racontent",
          cle: `${donnees.miroir.length} moteur${donnees.miroir.length > 1 ? "s" : ""}`,
        }]
      : []),
    {
      clef: "portes",
      titre: "L'accès des robots",
      cle: bloques === 0 ? "toutes ouvertes" : `${bloques} refusé${bloques > 1 ? "s" : ""}`,
    },
    ...(donnees.sources.totalLectures
      ? [{
          clef: "lectures",
          titre: "Où les IA lisent",
          cle: `${donnees.sources.totalLectures} lectures`,
        }]
      : []),
    {
      clef: "plan",
      titre: "Le plan des 90 jours",
      cle: `${donnees.plan.reduce((n, p) => n + p.actions.length, 0)} actions`,
    },
    { clef: "engagement", titre: "La suite", cle: "" },
  ];

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timer = useRef<number | null>(null);

  const aller = useCallback(
    (cible: number) => {
      if (cible === index || cible < 0 || cible >= cartes.length) return;
      setVisible(false);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setIndex(cible);
        setVisible(true);
      }, 170);
    },
    [index, cartes.length],
  );

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") aller(index + 1);
      if (e.key === "ArrowLeft") aller(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aller, index]);

  const carte = cartes[index]!;
  const suivante = cartes[index + 1] ?? null;
  const ease = "cubic-bezier(0.22,1,0.36,1)";

  /* ------------------------------------------------------- les contenus */

  const titreCarte = (texte: string, alerte: string[] = []) => (
    <h2
      className="serif-roman"
      style={{
        fontSize: wide ? 34 : 24,
        lineHeight: 1.08,
        letterSpacing: "-0.012em",
        margin: 0,
        maxWidth: "28ch",
      }}
    >
      <TitreChiffre texte={texte} alerte={alerte} />
    </h2>
  );

  const chapeau = (texte: string) => (
    <p style={{ fontSize: wide ? 16 : 14.5, lineHeight: 1.6, color: "var(--ink-2)", margin: 0, maxWidth: "68ch" }}>
      {texte}
    </p>
  );

  const contenu = () => {
    switch (carte.clef) {
      case "essentiel":
        return (
          <div>
            <p className="kicker" style={{ margin: 0 }}>
              document de mesure · scan complet · {donnees.marque}
            </p>
            {titreCarte(
              fr(
                `${cartes.length - 2} constats, mesurés sur ${lues} réponses réelles. On les prend un par un.`,
              ),
            )}
            <div style={{ marginTop: 18 }}>
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {cartes.slice(1, -1).map((c, i) => (
                  <li key={c.clef}>
                    <button
                      type="button"
                      onClick={() => aller(i + 1)}
                      className="row-hover"
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 12,
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        borderBottom: `1px solid ${HAIR}`,
                        padding: "9px 2px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: SANS,
                      }}
                    >
                      <span className="num" style={{ fontSize: 11, color: MUTED, flex: "none" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: wide ? 16 : 14.5, fontWeight: 600, flex: "none" }}>
                        {c.titre}
                      </span>
                      <span className="conduite" aria-hidden />
                      <span className="num" style={{ fontSize: wide ? 14 : 12.5, flex: "none" }}>
                        {c.cle}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <p className="num" style={{ fontSize: 11, color: MUTED, margin: "14px 0 0" }}>
              {donnees.echantillon.questions} questions × {donnees.echantillon.moteurs} moteurs ·{" "}
              {lues} réponses lues
              {donnees.echantillon.reponsesEnErreur
                ? ` · ${donnees.echantillon.reponsesEnErreur} en erreur, hors mesure`
                : ""}{" "}
              · {frTitre("mesure par API officielles, sans scraping")}
            </p>
          </div>
        );

      case "verdict":
        return (
          <div>
            {titreCarte(
              fr(
                `Sur ${lues} réponses lues, votre marque apparaît dans ${donnees.voix.vosReponses}.`,
              ),
              [String(donnees.voix.vosReponses)],
            )}
            <div style={{ marginTop: 22 }}>
              <RegleScore
                score={score}
                verdict={motVerdict(score)}
                precedent={precedent ? Math.round(precedent.score) : null}
              />
            </div>
            {donnees.composantes ? (
              <div style={{ marginTop: 26 }}>
                <ComposantesScore
                  composantes={donnees.composantes}
                  reponsesLues={lues}
                  reponsesEnErreur={donnees.echantillon.reponsesEnErreur}
                />
              </div>
            ) : null}
            <div
              style={{
                marginTop: 22,
                display: "grid",
                gap: 24,
                gridTemplateColumns: wide && donnees.tonalite ? "1fr 1fr" : "1fr",
                alignItems: "start",
              }}
            >
              {donnees.tonalite ? <TonaliteDepliee tonalite={donnees.tonalite} /> : null}
              {chapeau(
                fr(
                  "La formule est publiée et ne bouge jamais : présence 50 %, position 20 %, recommandation explicite 20 %, tonalité 10 %. Une réponse en erreur ne compte pas au dénominateur.",
                ),
              )}
            </div>
            <div style={{ marginTop: 26 }}>
              <p className="label-xs" style={{ paddingBottom: 8 }}>moteur par moteur</p>
              <BandeauMoteurs scores={parMoteur} avant={precedent?.parMoteur ?? null} />
            </div>
          </div>
        );

      case "carte":
        return (
          <div>
            {titreCarte(frTitre(donnees.titreMatrice), [String(donnees.matrice.questionsCitees)])}
            <div style={{ margin: "14px 0 18px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "baseline" }}>
              {chapeau(
                fr(
                  "Chaque case est une réponse réelle, conservée mot pour mot. Cliquez une ligne pour la lire en entier.",
                ),
              )}
              <Legende />
            </div>
            <BandeIntentions groupes={donnees.intentions} portee={donnees.portee} />
            <MatriceReponses
              matrice={donnees.matrice}
              reponses={reponses}
              mentions={mentions}
              marque={donnees.marque}
            />
          </div>
        );

      case "forces":
        return (
          <div>
            {titreCarte(frTitre(donnees.duel ? donnees.duel.titre : "Le rapport de forces."))}
            <div
              style={{
                marginTop: 20,
                display: "grid",
                gap: wide ? 40 : 24,
                gridTemplateColumns: wide ? "minmax(0,7fr) minmax(0,5fr)" : "1fr",
                alignItems: "start",
              }}
            >
              <div>
                {donnees.duel ? (
                  <Duel
                    marque={donnees.marque}
                    vous={donnees.duel.vous}
                    adversaire={donnees.duel.adversaire}
                    lues={lues}
                    recoVous={donnees.duel.recoVous}
                    recoAdversaire={donnees.duel.recoAdversaire}
                  />
                ) : null}
              </div>
              <div>
                <p className="num" style={{ fontSize: wide ? 56 : 40, lineHeight: 1, color: "var(--signal)", margin: 0 }}>
                  {donnees.voix.reponsesPerdues}
                </p>
                {chapeau(
                  fr(
                    `réponses où un concurrent est nommé et vous ne l'êtes pas. ${donnees.voix.marquesTotal} marques distinctes se partagent votre marché.`,
                  ),
                )}
              </div>
            </div>
            <div style={{ marginTop: 26 }}>
              <p className="label-xs" style={{ paddingBottom: 8 }}>les marques les plus présentes</p>
              <VoixDocument lignes={donnees.voix.lignes} lues={lues} />
            </div>
          </div>
        );

      case "pieces":
        return (
          <div>
            {titreCarte(frTitre("Les phrases qui envoient vos prospects ailleurs."))}
            {chapeau(
              fr(
                "Extraits mot pour mot des réponses collectées, concurrent surligné. Le texte intégral reste lisible dans la carte des réponses.",
              ),
            )}
            <PiecesDocument pieces={donnees.pieces} />
          </div>
        );

      case "decisive":
        return (
          <div>
            {titreCarte(frTitre(`« ${donnees.questionCle!.texte} »`))}
            <div style={{ margin: "10px 0 18px" }}>{chapeau(fr(donnees.questionCle!.enjeu))}</div>
            <FaceAFace faces={donnees.questionCle!.faces} />
          </div>
        );

      case "miroir":
        return (
          <div>
            {titreCarte(frTitre("Ce que chaque IA raconte quand on lui donne votre nom."))}
            <div style={{ margin: "10px 0 20px" }}>
              {chapeau(
                fr(
                  "La seule question du scan qui prononce votre nom. Elle ne compte pas dans le score : les autres mesurent la découverte spontanée, celle-ci mesure ce que les IA récitent sur vous.",
                ),
              )}
            </div>
            <MiroirDocument miroir={donnees.miroir} />
          </div>
        );

      case "portes":
        return (
          <div>
            {titreCarte(
              frTitre(
                donnees.technique === null
                  ? "Le robots.txt du site n'a pas pu être lu."
                  : bloques === 0
                    ? "Toutes les portes sont ouvertes. Ce qui manque, c'est la matière."
                    : bloques === 1
                      ? "Un robot d'IA est refusé à votre porte."
                      : `${bloques} robots d'IA sont refusés à votre porte.`,
              ),
            )}
            <div style={{ margin: "10px 0 20px" }}>
              {chapeau(
                fr(
                  "Relevé sur le fichier public robots.txt de votre site, le jour de la mesure. Un robot refusé ne lira jamais ce que vous publiez, quel que soit le contenu.",
                ),
              )}
            </div>
            <ReleveRobots technique={donnees.technique} domaine={donnees.domaine} />
          </div>
        );

      case "lectures":
        return (
          <div>
            {titreCarte(frTitre(donnees.titreSources ?? "Où les IA vont lire."))}
            <div style={{ margin: "10px 0 20px" }}>
              {chapeau(
                fr(
                  "Les sites que les moteurs ont consultés pendant la mesure, relevés dans les réponses elles-mêmes. Être cité là, c'est entrer dans la matière première des réponses.",
                ),
              )}
            </div>
            <SourcesVue sources={donnees.sources} />
          </div>
        );

      case "plan":
        return (
          <div>
            {titreCarte(frTitre("Le plan, phase par phase."))}
            <div style={{ margin: "10px 0 20px" }}>
              {chapeau(
                fr(
                  "Construit sur cette mesure, pas sur un gabarit : chaque phase part d'un constat relevé plus haut. Les trois chantiers se chevauchent.",
                ),
              )}
            </div>
            <Frise90 phases={donnees.plan} questions={donnees.echantillon.questions} />
            <Plan90 phases={donnees.plan} />
          </div>
        );

      default:
        return (
          <div>
            {titreCarte(frTitre("Ce plan est exactement ce que le Sprint GEO exécute."))}
            <div style={{ margin: "12px 0 0" }}>
              {chapeau(
                fr(
                  `Les trois phases, livrées en 90 jours, puis le re-scan qui rejoue ces ${donnees.echantillon.questions} questions à l'identique pour mesurer l'écart.`,
                ),
              )}
            </div>
            <dl
              style={{
                margin: "20px 0 0",
                maxWidth: 420,
                borderTop: "1px solid var(--rule-strong)",
              }}
            >
              {[
                ["contenus écrits", "5"],
                ["cibles de citation", "8"],
                ["re-scan", "J+90"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "baseline",
                    borderBottom: "1px solid var(--rule)",
                    padding: "8px 0",
                  }}
                >
                  <dt style={{ fontSize: 14, color: "var(--ink-2)" }}>{k}</dt>
                  <dd className="num" style={{ fontSize: 15, margin: 0 }}>{v}</dd>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "baseline",
                  padding: "12px 0 0",
                }}
              >
                <dt style={{ fontSize: 14, color: "var(--ink-2)" }}>une fois, sans abonnement</dt>
                <dd className="num" style={{ fontSize: 28, margin: 0 }}>
                  2{NBSP}900{NBSP}€
                </dd>
              </div>
            </dl>
            <p style={{ fontSize: 14, fontWeight: 600, margin: "18px 0 0", borderTop: "1px solid var(--rule-strong)", paddingTop: 10, maxWidth: 420 }}>
              {fr("Nous garantissons les actions livrées, jamais un score.")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", marginTop: 20 }}>
              <Link to="/sprint" className="cta cta-sweep">
                {fr("Le programme des 90 jours, étape par étape")}
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="ink-link num" style={{ fontSize: 14 }}>
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        );
    }
  };

  /* --------------------------------------------------------- la coque */

  return (
    <div
      className="print:hidden"
      style={{
        position: "relative",
        flex: "1 0 auto",
        background: "var(--ink)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: wide ? "30px 32px" : "16px 12px 20px",
        gap: 14,
      }}
    >
      <GrilleFond />

      <div
        key={index}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: wide ? 1180 : 780,
          background: CARD,
          border: `1px solid ${HAIR}`,
          borderRadius: 4,
          maxHeight: wide ? "calc(100vh - 170px)" : "calc(100vh - 140px)",
          display: "flex",
          flexDirection: "column",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-10px)",
          transition: `opacity 320ms ${ease}, transform 320ms ${ease}`,
        }}
      >
        {/* en-tête de carte */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: wide ? "12px 30px" : "10px 16px",
            borderBottom: `1px solid ${HAIR}`,
            flex: "none",
          }}
        >
          {index > 0 ? (
            <button
              type="button"
              onClick={() => aller(index - 1)}
              aria-label="Carte précédente"
              style={{
                background: "transparent",
                border: `1px solid ${HAIR}`,
                borderRadius: 4,
                color: MUTED,
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: "0.08em",
                padding: "6px 12px",
                flex: "none",
              }}
            >
              ← PRÉCÉDENT
            </button>
          ) : (
            <button
              type="button"
              onClick={onImprimer}
              className="ink-link"
              style={{
                background: "transparent",
                border: "none",
                color: MUTED,
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.1em",
                padding: 0,
              }}
            >
              VERSION IMPRIMABLE
            </button>
          )}
          <span
            style={{
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.13em",
              color: MUTED,
              textAlign: "right",
            }}
          >
            {String(index + 1).padStart(2, "0")} / {String(cartes.length).padStart(2, "0")} ·{" "}
            {carte.titre.toUpperCase()}
          </span>
        </div>

        {/* contenu, défilant à l'intérieur de la carte */}
        <div
          style={{
            overflowY: "auto",
            padding: wide ? "26px 30px" : "18px 16px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transition: `opacity 340ms ${ease} 90ms, transform 340ms ${ease} 90ms`,
          }}
        >
          {contenu()}
        </div>

        {/* pied : le chemin. Toujours visible, jamais sous le pli. */}
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: wide ? "12px 30px" : "10px 16px",
            borderTop: `1px solid ${HAIR}`,
          }}
        >
          <span className="num" style={{ fontSize: 11, color: MUTED }}>
            {donnees.marque} · {carte.cle || `${lues} réponses lues`}
          </span>
          {suivante ? (
            <button
              type="button"
              onClick={() => aller(index + 1)}
              style={{
                background: INK,
                color: PAPER,
                border: `1px solid ${PAPER}`,
                borderRadius: 4,
                padding: wide ? "12px 22px" : "12px 16px",
                fontSize: wide ? 16 : 15,
                fontWeight: 800,
                fontFamily: SANS,
                cursor: "pointer",
              }}
            >
              Suivant : {minuscule(suivante.titre)} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => aller(0)}
              style={{
                background: "transparent",
                border: `1px solid ${HAIR}`,
                borderRadius: 4,
                color: "var(--ink-2)",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 16px",
              }}
            >
              Revenir à l'essentiel
            </button>
          )}
        </div>
      </div>

      {/* points de progression, mêmes codes que l'aperçu */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 9 }}>
        {cartes.map((c, i) => {
          const actif = i === index;
          return (
            <button
              key={c.clef}
              type="button"
              onClick={() => aller(i)}
              aria-label={`Carte ${i + 1} : ${c.titre}`}
              aria-current={actif ? "step" : undefined}
              style={{
                width: actif ? 24 : 8,
                height: 8,
                padding: 0,
                border: "none",
                borderRadius: 999,
                background: actif ? ON_DEEP : ON_DEEP_MUTED,
                cursor: "pointer",
                transition: "width 260ms ease, background 260ms ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Utilisé par la route pour marquer la vue document quand elle est à l'écran. */
export function classesVueDocument(vue: "projection" | "document"): string {
  // En projection, le document reste monté mais caché à l'écran : Cmd+P
  // imprime donc TOUJOURS le document, jamais une carte de projection.
  return cn(vue === "projection" && "hidden print:block");
}
