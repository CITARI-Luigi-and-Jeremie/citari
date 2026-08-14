import { useCallback, useEffect, useRef, useState } from "react";

import type { DonneesSequence } from "@/lib/rapport-sequence";

import { CarteSplit } from "./CarteSplit";
import { GrilleFond } from "./GrilleFond";
import { CarteDiagnostic } from "./etapes/CarteDiagnostic";
import { CarteReservation } from "./etapes/CarteReservation";
import { CarteConcurrent } from "./etapes/CarteConcurrent";
import { CartePartDeVoix } from "./etapes/CartePartDeVoix";
import { CarteScore } from "./etapes/CarteScore";
import { CarteVerbatim } from "./etapes/CarteVerbatim";
import { INK, ON_DEEP, ON_DEEP_HAIR, ON_DEEP_MUTED, ORANGE, ORANGE_HOVER, PAPER, SANS } from "./theme";

/**
 * La vue résultat en séquence de pop-ups, portée le 14/08/2026.
 *
 * La page ne se scrolle plus : une carte à la fois, l'utilisateur avance à
 * son rythme, et la dernière carte ouvre la réservation du diagnostic.
 * Les étapes dont la donnée n'existe pas (pas d'adversaire, pas de verbatim)
 * sont simplement retirées de la séquence : jamais de carte vide.
 */
export function SequenceResultat({
  data,
  wide,
  onBook,
}: {
  data: DonneesSequence;
  wide: boolean;
  onBook: () => void;
}) {
  type Etape = {
    clef: string;
    titre: string;
    preuve: string;
    cta: string | null;
  };

  const etapes: Etape[] = [
    { clef: "score", titre: "Votre score", preuve: "Le chiffre mesuré", cta: "Voir qui prend ma place" },
    ...(data.adversaire
      ? [{
          clef: "concurrent",
          titre: data.vosReponses >= data.adversaire.reponses ? "Qui vise votre place" : "Qui prend votre place",
          preuve: "Les réponses comptées",
          cta: "Lire ce que l'IA répond",
        }]
      : []),
    ...(data.laPlusDure
      ? [{ clef: "verbatim", titre: "La phrase exacte", preuve: "", cta: "Voir la part de voix" }]
      : []),
    ...(data.voix.length > 0
      ? [{ clef: "voix", titre: "La part de voix", preuve: "Les réponses par nom", cta: "Ce que cet aperçu ne peut pas dire" }]
      : []),
    // La modale « ce que vous apprenez » a été supprimée le 14/08/2026 : la
    // séquence portait deux comparatifs qui se répétaient. Son tableau vit
    // désormais DANS la carte diagnostic, et le CTA avance simplement.
    { clef: "diagnostic", titre: "Le diagnostic complet", preuve: "", cta: "Voir le cadre de l'appel" },
    { clef: "reservation", titre: "Réserver", preuve: "Le cadre de l'appel", cta: null },
  ];

  const [index, setIndex] = useState(0);
  const [vues, setVues] = useState(0);
  const [visible, setVisible] = useState(true);
  const timer = useRef<number | null>(null);

  const aller = useCallback(
    (cible: number) => {
      if (cible === index || cible < 0 || cible >= etapes.length) return;
      setVisible(false);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setIndex(cible);
        setVues((v) => Math.max(v, cible));
        setVisible(true);
      }, 170);
    },
    [index, etapes.length],
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

  const etape = etapes[index]!;

  const rendu = (part: "recit" | "preuve") => {
    switch (etape.clef) {
      case "score":
        return (
          <CarteScore
            score={data.score}
            domaine={data.domaine}
            date={data.date}
            moteurs={data.moteurs}
            wide={wide}
            part={part}
          />
        );
      case "concurrent":
        return (
          <CarteConcurrent
            adversaire={data.adversaire!}
            vosReponses={data.vosReponses}
            wide={wide}
            part={part}
          />
        );
      case "verbatim":
        return (
          <CarteVerbatim
            question={data.laPlusDure!.question}
            rangQuestion={data.laPlusDure!.rangQuestion}
            totalQuestions={data.laPlusDure!.totalQuestions}
            moteur={data.laPlusDure!.moteur}
            date={data.date}
            texte={data.laPlusDure!.texte}
            concurrent={data.laPlusDure!.concurrent}
            rangConcurrent={data.laPlusDure!.rangConcurrent}
            votreStatut={data.laPlusDure!.votreStatut}
            wide={wide}
            part={part}
          />
        );
      case "voix":
        return (
          <CartePartDeVoix
            voix={data.voix}
            meta={data.voixMeta}
            date={data.date}
            numero={index + 1}
            total={etapes.length}
            wide={wide}
            part={part}
          />
        );
      case "diagnostic":
        return <CarteDiagnostic wide={wide} part={part} score={data.score} />;
      default:
        return <CarteReservation wide={wide} part={part} />;
    }
  };

  const pied = etape.cta ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
      <button
        type="button"
        onClick={() => aller(index + 1)}
        style={{
          background: INK,
          color: PAPER,
          border: `1px solid ${PAPER}`,
          borderRadius: 4,
          padding: wide ? "15px 24px" : "15px 18px",
          fontSize: wide ? 17 : 16,
          fontWeight: 800,
          fontFamily: SANS,
          cursor: "pointer",
          width: wide ? "fit-content" : "100%",
        }}
      >
        {etape.cta} →
      </button>
      <button
        type="button"
        onClick={onBook}
        style={{
          background: "transparent",
          border: "none",
          color: INK,
          cursor: "pointer",
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 700,
          padding: 0,
          textAlign: wide ? "left" : "center",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Passer directement à la réservation
      </button>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
      <button
        type="button"
        onClick={onBook}
        style={{
          background: ORANGE,
          color: PAPER,
          border: "none",
          borderRadius: 4,
          padding: wide ? "16px 26px" : "16px 20px",
          fontSize: wide ? 17 : 16,
          fontWeight: 800,
          fontFamily: SANS,
          cursor: "pointer",
          width: "100%",
          marginTop: 4,
          transition: "background 200ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = ORANGE_HOVER)}
        onMouseLeave={(e) => (e.currentTarget.style.background = ORANGE)}
      >
        Réserver mon diagnostic
      </button>
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: wide ? "calc(100vh - 70px)" : "calc(100vh - 62px)",
        background: "var(--ink)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: wide ? "44px 32px" : "20px 14px 26px",
        gap: 20,
      }}
    >
      <GrilleFond />

      <CarteSplit
        key={index}
        numero={index + 1}
        total={etapes.length}
        titre={etape.titre}
        preuveLabel={etape.preuve}
        preuveAlign={index === etapes.length - 1 ? "start" : "center"}
        wide={wide}
        visible={visible}
        onBack={index > 0 ? () => aller(index - 1) : null}
        recit={rendu("recit")}
        preuve={rendu("preuve")}
        pied={pied}
      />

      {/* points de progression, version sombre */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
        {etapes.map((e, i) => {
          const accessible = i <= vues;
          const actif = i === index;
          return (
            <button
              key={e.clef}
              type="button"
              disabled={!accessible}
              onClick={() => aller(i)}
              aria-label={`Étape ${i + 1} : ${e.titre}`}
              aria-current={actif ? "step" : undefined}
              style={{
                width: actif ? 26 : 9,
                height: 9,
                padding: 0,
                border: "none",
                borderRadius: 999,
                background: actif ? ON_DEEP : accessible ? ON_DEEP_MUTED : ON_DEEP_HAIR,
                cursor: accessible ? "pointer" : "default",
                transition: "width 260ms ease, background 260ms ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
