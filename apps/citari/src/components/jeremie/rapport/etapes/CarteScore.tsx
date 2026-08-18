import { useEffect, useState } from "react";
import { motSocle, type Socle } from "@/lib/socle";

import { BODY, HAIR, INK, MONO, RED, SUFFIX, labelStyle } from "../theme";

/** 01 — Le score. Récit à gauche, jauge chiffrée à droite. */
export function CarteScore({
  score,
  domaine,
  date,
  moteurs,
  composantes,
  socle,
  wide,
  part,
}: {
  score: number;
  domaine: string;
  date: string;
  moteurs: number;
  /**
   * Les quatre composantes du score, montrées depuis le 14/08/2026 : elles
   * étaient calculées et enregistrées à chaque scan gratuit sans jamais être
   * affichées. Elles transforment un chiffre opaque en diagnostic lisible —
   * « cité dans 45 % des réponses, en position 3,2 » dit où agir — sans rien
   * livrer de ce que le rendez-vous apporte.
   */
  composantes: {
    presence: number;
    rang: number | null;
    recommandation: number;
    tonalite: number;
    reponsesRetenues: number;
    reponsesEnErreur: number;
  } | null;
  /**
   * LE SOCLE : le second axe. À zéro de visibilité, il départage l'entreprise
   * lisible par les machines de celle qui ne l'est pas — c'est ce que le
   * score, figé et honnête, ne peut pas dire.
   */
  socle?: Socle | null;
  wide: boolean;
  part: "recit" | "preuve";
}) {
  const [shown, setShown] = useState(score);

  useEffect(() => {
    if (part !== "preuve") return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(score);
      return;
    }
    setShown(0);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShown(Math.round(score * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, part]);

  if (part === "recit") {
    return (
      <>
        <span style={labelStyle}>VOTRE SCORE DE VISIBILITÉ{date ? ` · ${date.toUpperCase()}` : ""}</span>
        <p
          style={{
            fontSize: wide ? 30 : 23,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Voilà la place que {domaine} occupe aujourd'hui dans les réponses des IA.
        </p>
        <p style={{ fontSize: wide ? 17 : 15.5, color: BODY, lineHeight: 1.55, margin: 0 }}>
          Ce score mesure une seule chose : quand un acheteur pose la question de votre métier à
          une IA, votre nom sort-il, et à quelle place. En dessous de 50, vous existez à peine dans
          la conversation.
        </p>
      </>
    );
  }

  const hauteur = Math.max(2, Math.min(100, shown));
  const pct = (v: number) => `${Math.round(v * 100)} %`;
  const lignes = composantes
    ? [
        { label: "Présence", poids: "50 %", valeur: pct(composantes.presence) },
        {
          label: "Rang moyen",
          poids: "20 %",
          valeur:
            composantes.rang === null
              ? "—"
              : `${composantes.rang.toFixed(1).replace(".", ",")}e`,
        },
        { label: "Recommandation", poids: "20 %", valeur: pct(composantes.recommandation) },
        { label: "Tonalité", poids: "10 %", valeur: pct(composantes.tonalite) },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: wide ? 22 : 16 }}>
    <div style={{ display: "flex", alignItems: "flex-end", gap: wide ? 26 : 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontSize: wide ? 116 : 84,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              lineHeight: 0.8,
              color: INK,
            }}
          >
            {shown}
          </span>
          <span
            style={{
              fontSize: wide ? 32 : 26,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: SUFFIX,
            }}
          >
            /100
          </span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: SUFFIX }}>
          MESURE RÉELLE · {moteurs} MOTEUR{moteurs > 1 ? "S" : ""}
        </span>
      </div>

      {/* jauge verticale, repère à 50 */}
      <div style={{ position: "relative", flexShrink: 0, paddingRight: 34 }}>
        <div
          style={{
            position: "relative",
            width: 14,
            height: wide ? 132 : 104,
            background: HAIR,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${hauteur}%`,
              background: score < 50 ? RED : INK,
              transition: "height 240ms linear",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: "50%",
            width: 26,
            height: 1,
            background: INK,
            opacity: 0.5,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 30,
            bottom: "50%",
            transform: "translateY(50%)",
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.1em",
            color: SUFFIX,
            whiteSpace: "nowrap",
          }}
        >
          50
        </span>
      </div>
    </div>

      {/* Le détail du calcul : la formule est publiée sur /methode, autant
          montrer ses quatre termes mesurés. */}
      {lignes.length ? (
        <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${HAIR}` }}>
          {lignes.map((l) => (
            <div
              key={l.label}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto auto",
                alignItems: "baseline",
                gap: "0 10px",
                padding: "7px 0",
                borderBottom: `1px solid ${HAIR}`,
              }}
            >
              <span style={{ fontSize: wide ? 14 : 13, color: BODY }}>{l.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: SUFFIX, minWidth: 34, textAlign: "right" }}>
                {l.poids}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: wide ? 14 : 13,
                  fontWeight: 600,
                  color: INK,
                  minWidth: 52,
                  textAlign: "right",
                }}
              >
                {l.valeur}
              </span>
            </div>
          ))}
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              lineHeight: 1.5,
              color: SUFFIX,
              paddingTop: 8,
            }}
          >
            Calculé sur {composantes!.reponsesRetenues} réponses obtenues
            {composantes!.reponsesEnErreur > 0
              ? ` · ${composantes!.reponsesEnErreur} en panne, exclue${composantes!.reponsesEnErreur > 1 ? "s" : ""} du calcul`
              : ""}
            {" · "}
            {/* Le moment où la question se pose vraiment : le prospect
                découvre son chiffre et veut savoir d'où il sort. La méthode
                s'ouvre dans un onglet pour ne pas le sortir de sa séquence. */}
            <a
              href="/methode"
              target="_blank"
              rel="noopener"
              style={{ color: INK, textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              la formule
            </a>
          </span>
        </div>
      ) : null}

      {/* Le socle, en une ligne : il ne s'additionne jamais au score et ne
          se présente jamais comme une note. À 0 de visibilité, c'est lui qui
          dit s'il y a un chantier technique ou seulement un chantier de
          contenu. */}
      {socle && socle.rang !== null ? (
        <div style={{ marginTop: 14, borderTop: `1px solid ${HAIR}`, paddingTop: 12 }}>
          <span style={{ fontSize: 12, color: INK, opacity: 0.62, letterSpacing: "0.02em" }}>
            Votre socle technique : {socle.points} critère{socle.points > 1 ? "s" : ""} sur{" "}
            {socle.mesures} en place · {motSocle(socle)}
          </span>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {socle.criteres
              .filter((c) => c.mesure)
              .map((c) => (
                <span key={c.cle} style={{ fontSize: 12, color: INK, opacity: 0.62 }}>
                  <span style={{ color: c.atteint ? INK : RED, fontWeight: 600 }}>
                    {c.atteint ? "en place" : "manquant"}
                  </span>
                  {" · "}
                  {c.libelle} ({c.detail})
                </span>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
