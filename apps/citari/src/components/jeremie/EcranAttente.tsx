import { useEffect, useMemo, useRef, useState } from "react";

import type { EtatScan } from "@/lib/orchestrateur.server";
import { LogoMoteur } from "@/components/jeremie/LogosMoteurs";
import { cleCellule, formaterDuree, formaterLatence } from "@/lib/scan-attente";

/**
 * L'écran d'attente : le split-screen « Analyse Citari / Flux de données »
 * de Jérémie (`CitariScanScreen`), porté le 14/08/2026 à la demande de Luigi.
 *
 * Sa version tournait sur une horloge simulée (compte à rebours inventé,
 * verdicts tirés d'un modulo) : c'est la partie restée bannie. Ici, TOUT est
 * réel : les étapes suivent `etat.phase`, les compteurs par moteur comptent
 * les lignes écrites dans `responses`, le ticker affiche la latence mesurée
 * de la dernière réponse (ou « indisponible » si elle a échoué), le temps est
 * le temps ÉCOULÉ depuis `started_at` (jamais un « temps restant » deviné) et
 * la progression est celle du serveur. Une étape sans mesure interne montre
 * un reflet qui balaie, pas une fausse fraction.
 */

type Props = {
  /** Nul avant le premier battement du serveur : l'écran s'affiche en coquille. */
  etat: EtatScan | null;
  /** Mesure terminée : tout passe à 100 %, le rapport s'ouvre juste après. */
  scelle?: boolean;
  instable: boolean;
};

const INK = "#17160F";
const MUTED = "#7C7A72";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

/**
 * Les 5 étapes affichées, alignées sur les phases réelles de l'orchestrateur.
 *
 * Réécrites le 14/08/2026 (demande Luigi : « plus pertinent, plus
 * impressionnant ») : chaque sous-partie est une PREUVE, pas une promesse —
 * le domaine réel du prospect, le compteur de questions qui monte, les noms
 * des moteurs, la formule chiffrée. Construites au rendu parce qu'elles
 * s'appuient sur l'état réel ; aucune valeur inventée.
 */
function construireEtapes(etat: EtatScan | null): [string, string][] {
  const domaine = etat?.domaine ?? null;
  const nbQuestions = etat?.questions.length ?? 0;
  const moteurs = etat?.moteurs ?? [];
  const nomsMoteurs =
    moteurs.length === 2 ? `${moteurs[0]} et ${moteurs[1]}` : `les ${moteurs.length || 6} moteurs`;
  const total = etat?.total ?? 0;

  // Le métier est DÉDUIT du site (le formulaire ne le demande plus) : dès que
  // l'orchestrateur l'a écrit en base, l'étape 01 affiche ce qu'on a compris.
  // C'est la seule preuve que la lecture a bien eu lieu.
  const metier = etat?.secteur?.trim() ?? "";
  const zone = etat?.ville?.trim() ?? "";

  return [
    [
      "On lit votre site",
      metier
        ? `Compris : ${metier}${zone ? `, clientèle locale à ${zone}` : ", clientèle nationale"}. C'est ce que ${domaine ?? "votre site"} dit de vous, et c'est ce qui dicte les questions.`
        : `${domaine ?? "Votre site"} est lu comme le ferait un nouveau client : votre métier, vos services, votre zone. C'est lui qui dicte les questions.`,
    ],
    [
      "On écrit les questions de vos acheteurs",
      nbQuestions > 0
        ? `${nbQuestions} questions d'intention d'achat, scellées pour être rejouées à l'identique dans 90 jours. Votre nom n'y figure jamais.`
        : "Comparaisons, douleurs d'avant-achat, recherches locales, confiance. Votre nom n'y figure jamais : on mesure si les IA le sortent d'elles-mêmes.",
    ],
    [
      "On pose vos questions aux moteurs",
      `Chaque question part vers ${nomsMoteurs}, par leurs API officielles. Chaque réponse est enregistrée telle quelle, mot pour mot.`,
    ],
    [
      "On lit chaque réponse",
      `${total > 0 ? `${total} réponses` : "Chaque réponse"} relues une à une : quelles marques sortent, à quelle place, lesquelles sont recommandées. Votre nom est cherché partout, jamais soufflé.`,
    ],
    [
      "On calcule votre score",
      "Présence 50 %, rang 20 %, recommandation 20 %, tonalité 10 %. La formule est publiée : vous pourrez recalculer chaque point à la main.",
    ],
  ];
}

const CSS = `
@keyframes citRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes citFade{from{opacity:0}to{opacity:1}}
@keyframes citPulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes citBarShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
@keyframes citTicker{0%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes citLive{0%{box-shadow:0 0 0 0 rgba(192,55,29,.35)}70%{box-shadow:0 0 0 8px rgba(192,55,29,0)}100%{box-shadow:0 0 0 0 rgba(192,55,29,0)}}
@keyframes citGrid{0%{transform:translateY(0)}100%{transform:translateY(40px)}}

.cit-viewport{position:fixed;inset:0;z-index:50;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;background:#F2F0EA}
.cit-frame{width:100%;min-height:100%;margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
@media (min-width:600px){.cit-frame{padding:32px}}
@media (min-width:1024px){.cit-frame{padding:48px}}

.cit-card{width:100%;max-width:1200px;background:#FBFAF7;border:1px solid rgba(23,22,15,0.05);box-shadow:0 40px 100px -20px rgba(23,22,15,0.15);display:flex;flex-direction:column;overflow:hidden;min-height:640px}
@media (min-width:900px){.cit-card{flex-direction:row;min-height:680px}}

.cit-left{padding:32px;display:flex;flex-direction:column;justify-content:space-between;border-bottom:1px solid rgba(23,22,15,0.08)}
@media (min-width:900px){.cit-left{width:40%;padding:48px;border-bottom:none;border-right:1px solid rgba(23,22,15,0.08)}}
@media (min-width:1200px){.cit-left{padding:64px}}

.cit-right{flex:1;background:#17160F;position:relative;overflow:hidden;padding:32px;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:360px}
@media (min-width:900px){.cit-right{padding:48px;min-height:auto}}
@media (min-width:1200px){.cit-right{padding:64px}}

.cit-grid{position:absolute;inset:0;pointer-events:none;opacity:0.08;background-image:linear-gradient(#F2F0EA 1px, transparent 1px), linear-gradient(90deg, #F2F0EA 1px, transparent 1px);background-size:40px 40px;animation:citGrid 1.5s linear infinite}

.cit-step{display:flex;align-items:flex-start;gap:12px;transition:opacity 240ms ease-out}
.cit-step-num{font-family:${MONO};font-size:11px;min-width:20px;margin-top:2px}

.cit-progress-track{position:relative;height:2px;background:rgba(23,22,15,0.08);overflow:hidden;border-radius:1px}
.cit-progress-fill{position:absolute;inset:0;background:#C0371D;transition:width 900ms cubic-bezier(0.22,1,0.36,1)}
.cit-progress-sheen{position:absolute;top:0;bottom:0;width:30%;background:#C0371D;opacity:.8;animation:citBarShimmer 1.6s cubic-bezier(0.4,0,0.2,1) infinite}

.cit-right-track{position:relative;height:2px;background:rgba(242,240,234,0.12);overflow:hidden;border-radius:1px}
.cit-right-fill{position:absolute;inset:0;background:#C0371D;transition:width 900ms cubic-bezier(0.22,1,0.36,1)}
.cit-right-knob{position:absolute;top:50%;width:8px;height:8px;border-radius:50%;background:#C0371D;transform:translate(-50%,-50%);box-shadow:0 0 12px rgba(192,55,29,0.6);transition:left 900ms cubic-bezier(0.22,1,0.36,1)}

.cit-log-line{display:flex;align-items:center;gap:12px;height:48px;padding:0 16px;border:1px solid rgba(242,240,234,0.1);background:rgba(242,240,234,0.05);overflow:hidden}
.cit-log-bars{display:flex;gap:3px;align-items:flex-end;height:18px}
.cit-log-bar{width:3px;border-radius:1px;background:#F2F0EA}

.cit-rise{animation:citRise 360ms cubic-bezier(0.22,1,0.36,1) both}
.cit-fade{animation:citFade 280ms cubic-bezier(0.22,1,0.36,1) both}
.cit-ticker{animation:citTicker 320ms cubic-bezier(0.22,1,0.36,1) both}
.cit-live{width:8px;height:8px;border-radius:50%;background:#C0371D;animation:citLive 1.8s ease-out infinite}

@media (prefers-reduced-motion:reduce){
  .cit-rise,.cit-fade,.cit-ticker,.cit-live{animation:none}
  .cit-grid{animation:none}
  .cit-progress-sheen{animation:none;width:100%;opacity:.35}
}
`;

/** Chronomètre réel depuis started_at. */
function useChrono(demarreA: string | null) {
  const depart = useMemo(() => {
    const valeur = demarreA ? new Date(demarreA).getTime() : NaN;
    return Number.isNaN(valeur) ? Date.now() : valeur;
  }, [demarreA]);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, maintenant - depart);
}

/** Lisse l'affichage du pourcentage réel, sans jamais dépasser la cible. */
function usePourcentLisse(cible: number, duree = 900): number {
  const [valeur, setValeur] = useState(cible);
  const depart = useRef({ valeur: cible, cible, temps: 0 });
  useEffect(() => {
    if (valeur === cible) return;
    depart.current = { valeur, cible, temps: performance.now() };
    let raf = 0;
    const ease = (t: number) => t * (2 - t);
    const tick = (now: number) => {
      const t = Math.min(1, (now - depart.current.temps) / duree);
      setValeur(Math.round(depart.current.valeur + (depart.current.cible - depart.current.valeur) * ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cible, duree]);
  return valeur;
}

export function EcranAttente({ etat, scelle = false, instable }: Props) {
  const questions = etat?.questions ?? [];
  const cellules = etat?.cellules ?? [];
  const moteurs = etat?.moteurs ?? [];
  const verrouilles = etat?.verrouilles ?? [];
  const collectees = etat?.collectees ?? 0;
  const total = etat?.total ?? 0;
  const ecoule = useChrono(etat?.demarreA ?? null);
  const pourcent = usePourcentLisse(scelle ? 100 : (etat?.progression ?? 0));

  // Étape réelle : la phase du serveur décide, l'analyse se déroule en deux
  // temps d'affichage (lecture puis score) après un court délai.
  const [finAnalyse, setFinAnalyse] = useState(false);
  const analyse = etat?.phase === "analyse";
  useEffect(() => {
    if (!analyse) {
      setFinAnalyse(false);
      return;
    }
    const id = window.setTimeout(() => setFinAnalyse(true), 1600);
    return () => window.clearTimeout(id);
  }, [analyse]);

  const etape = scelle
    ? 5
    : !etat || etat.phase === "init" ? 0
    : etat.phase === "questions" ? 1
    : etat.phase === "interrogation" ? 2
    : finAnalyse ? 4
    : 3;

  // Compteurs par moteur, comptés sur les lignes réellement écrites.
  const parMoteur = questions.length || Math.ceil(total / Math.max(1, moteurs.length));
  const recusParMoteur = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cellules) m.set(c.moteur, (m.get(c.moteur) ?? 0) + 1);
    return m;
  }, [cellules]);

  // Moteurs qui ont répondu dans les 4 dernières secondes : leur égaliseur pulse.
  const moteursActifs = useMemo(() => {
    const seuil = Date.now() - 4000;
    const s = new Set<string>();
    for (const c of cellules) if (c.creeA && new Date(c.creeA).getTime() > seuil) s.add(c.moteur);
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellules, ecoule]);

  const derniere = cellules.length > 0 ? cellules[cellules.length - 1]! : null;

  // Titre d'onglet : le compteur réel, pour l'onglet laissé en arrière-plan.
  useEffect(() => {
    if (total === 0 || collectees === 0) return;
    const precedent = document.title;
    document.title = `${collectees}/${total} · Citari`;
    return () => {
      document.title = precedent;
    };
  }, [collectees, total]);

  // Fraction réelle de l'étape en cours quand elle se mesure ; sinon reflet.
  const fractionInterrogation = total > 0 ? collectees / total : 0;

  return (
    <div className="cit-viewport">
      <div className="cit-frame">
        <style>{CSS}</style>
        <div className="cit-card">
          {/* ------------------------------------------------ panneau clair */}
          <div className="cit-left">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
                <span className="cit-live" aria-hidden="true" />
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase" }}>
                  {scelle ? "Mesure scellée" : "Scan en cours"}
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(38px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.95, margin: 0, marginBottom: 12 }}>
                Analyse
                <br />
                Citari
              </h1>
              <div style={{ margin: "0 0 36px" }}>
                <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, margin: 0 }}>
                {etat ? `${etat.brand}${etat.domaine ? ` · ${etat.domaine}` : ""}` : " "}
                </p>
                {/* Le métier déduit du site, dès qu'il est écrit en base : la
                    preuve visible que la lecture a eu lieu. L'étape 01 ne peut
                    pas le porter, elle n'est plus active à ce moment-là. */}
                {etat?.secteur?.trim() ? (
                  <p
                    className="cit-fade"
                    style={{ fontFamily: MONO, fontSize: 12, color: "#C0371D", margin: "6px 0 0" }}
                  >
                    Compris : {etat.secteur.trim()}
                    {etat.ville?.trim() ? ` · ${etat.ville.trim()}` : " · clientèle nationale"}
                  </p>
                ) : null}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {construireEtapes(etat).map(([libelle, description], i) => {
                  const statut = i < etape ? "faite" : i === etape ? "active" : "attente";
                  const active = statut === "active";
                  return (
                    <div key={libelle} className="cit-step" style={{ opacity: statut === "attente" ? 0.35 : 1 }}>
                      <span className="cit-step-num" style={{ color: active ? "#C0371D" : statut === "faite" ? INK : MUTED }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div
                          className={active ? "cit-rise" : undefined}
                          style={{ fontSize: 15.5, fontWeight: active ? 600 : 500, letterSpacing: "-0.01em", color: active ? "#C0371D" : INK, lineHeight: 1.35 }}
                        >
                          {libelle}
                        </div>
                        {active ? (
                          <div className="cit-fade" style={{ marginTop: 6 }}>
                            <div className="cit-progress-track">
                              {i === 2 ? (
                                <span className="cit-progress-fill" style={{ width: `${Math.round(fractionInterrogation * 100)}%` }} />
                              ) : (
                                /* Pas de mesure interne pour cette étape : un
                                   reflet balaie, aucune fraction inventée. */
                                <span className="cit-progress-sheen" />
                              )}
                            </div>
                            <p style={{ fontSize: 12.5, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>{description}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: MUTED, marginTop: 40 }}>
              <div>
                <div style={{ textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>Temps écoulé</div>
                <div style={{ fontSize: 18, color: INK, letterSpacing: "-0.02em" }}>{formaterDuree(ecoule)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>Progression</div>
                <div style={{ fontSize: 18, color: INK, letterSpacing: "-0.02em" }}>
                  {pourcent}
                  <span style={{ opacity: 0.5 }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------ panneau sombre */}
          <div className="cit-right">
            <div className="cit-grid" aria-hidden="true" />
            <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                <span style={{ color: "#F2F0EA", opacity: 0.4 }}>Flux de données</span>
                <span style={{ color: "#C0371D" }}>Lien actif</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {moteurs.map((moteur) => {
                  const recus = recusParMoteur.get(moteur) ?? 0;
                  const statut =
                    recus >= parMoteur && parMoteur > 0
                      ? "fini"
                      : moteursActifs.has(moteur)
                        ? "encours"
                        : recus > 0
                          ? "calme"
                          : "attente";
                  const opacite = statut === "attente" ? 0.25 : statut === "encours" ? 1 : 0.55;
                  return (
                    <div key={moteur} className="cit-log-line" style={{ opacity: opacite }}>
                      <div className="cit-log-bars">
                        {statut === "encours" ? (
                          <>
                            <span className="cit-log-bar" style={{ height: 14, background: "#C0371D", animation: "citPulse 1.2s ease-in-out infinite" }} />
                            <span className="cit-log-bar" style={{ height: 10, opacity: 0.5, animation: "citPulse 1.2s ease-in-out 0.2s infinite" }} />
                            <span className="cit-log-bar" style={{ height: 6, opacity: 0.25, animation: "citPulse 1.2s ease-in-out 0.4s infinite" }} />
                          </>
                        ) : statut === "fini" ? (
                          <>
                            <span className="cit-log-bar" style={{ height: 12, opacity: 0.8 }} />
                            <span className="cit-log-bar" style={{ height: 12, opacity: 0.8 }} />
                            <span className="cit-log-bar" style={{ height: 12, opacity: 0.8 }} />
                          </>
                        ) : (
                          <>
                            <span className="cit-log-bar" style={{ height: 4, opacity: 0.2 }} />
                            <span className="cit-log-bar" style={{ height: 4, opacity: 0.2 }} />
                          </>
                        )}
                      </div>
                      <LogoMoteur nom={moteur} size={16} />
                      <span style={{ fontFamily: MONO, fontSize: 11, color: "#F2F0EA", opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {moteur}
                      </span>
                      <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: statut === "encours" ? "#C0371D" : "#F2F0EA", opacity: 0.7 }}>
                        {statut === "fini" ? `${recus}/${parMoteur} OK` : statut === "attente" ? "en attente" : `${recus}/${parMoteur}`}
                      </span>
                    </div>
                  );
                })}

                {verrouilles.length > 0 ? (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(242,240,234,0.12)" }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#F2F0EA", opacity: 0.35, marginBottom: 12 }}>
                      Réservé au scan premium
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      {verrouilles.map((moteur) => (
                        <div key={moteur} style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.32 }}>
                          <span style={{ display: "flex", filter: "grayscale(1)" }}>
                            <LogoMoteur nom={moteur} size={15} />
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 10, color: "#F2F0EA", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {moteur}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 40, minHeight: 56, overflow: "hidden" }}>
                {scelle ? (
                  <span className="cit-fade" style={{ display: "block", fontFamily: MONO, fontSize: 12, color: "#C0371D", lineHeight: 1.5 }}>
                    Mesure scellée · ouverture de votre rapport…
                  </span>
                ) : derniere ? (
                  <span key={collectees} className="cit-ticker" style={{ display: "block" }}>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: 12, color: "#F2F0EA", opacity: 0.7, lineHeight: 1.5 }}>
                      {derniere.moteur} ·{" "}
                      {derniere.erreur ? "indisponible sur cette question" : formaterLatence(derniere.latence)}
                    </span>
                    {(() => {
                      const q = questions.find((x) => x.id === derniere.queryId);
                      if (!q) return null;
                      const texte = q.text.length > 96 ? `${q.text.slice(0, 95)}…` : q.text;
                      return (
                        <span style={{ display: "block", fontFamily: MONO, fontSize: 11, color: "#F2F0EA", opacity: 0.42, lineHeight: 1.5, marginTop: 3 }}>
                          « {texte} »
                        </span>
                      );
                    })()}
                  </span>
                ) : questions.length > 0 ? (
                  // Les questions RÉELLES, montrées au moment où elles
                  // s'écrivent en base : la preuve vivante que l'échantillon
                  // parle du métier du prospect. Aucun texte inventé.
                  <span
                    key={questions.length}
                    className="cit-ticker"
                    style={{ display: "block", fontFamily: MONO, fontSize: 12, color: "#F2F0EA", opacity: 0.8, lineHeight: 1.55 }}
                  >
                    <span style={{ color: "#C0371D" }}>
                      Q{String(questions.length).padStart(2, "0")}
                    </span>{" "}
                    · « {questions[questions.length - 1]!.text} »
                  </span>
                ) : (
                  <span className="cit-fade" style={{ display: "block", fontFamily: MONO, fontSize: 12, color: "#F2F0EA", opacity: 0.4 }}>
                    {etat?.phase === "questions"
                      ? "Les questions de vos acheteurs s'écrivent…"
                      : "Initialisation du flux de mesure…"}
                  </span>
                )}
                {instable ? (
                  <span style={{ display: "block", marginTop: 6, fontFamily: MONO, fontSize: 11, color: "#F2F0EA", opacity: 0.4 }}>
                    connexion instable, nouvelle tentative
                  </span>
                ) : null}
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="cit-right-track">
                  <span className="cit-right-fill" style={{ width: `${pourcent}%` }} />
                  <span className="cit-right-knob" style={{ left: `${pourcent}%` }} />
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", bottom: 24, right: 24, fontSize: 13, color: "#F2F0EA", opacity: 0.08, fontWeight: 800, letterSpacing: "-0.02em", userSelect: "none" }}>
              {etat?.domaine ?? etat?.brand ?? ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
