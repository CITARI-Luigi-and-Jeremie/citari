import { useCallback, useEffect, useRef, useState } from "react";

import type { DonneesSequence } from "@/lib/rapport-sequence";
import type { Mention, Question, Reponse } from "@/components/rapport";

import { CarteSplit } from "./CarteSplit";
import { GrilleFond } from "./GrilleFond";
import { CarteDiagnostic } from "./etapes/CarteDiagnostic";
import { CarteReservation } from "./etapes/CarteReservation";
import { CarteConcurrent } from "./etapes/CarteConcurrent";
import { CarteMiroir } from "./etapes/CarteMiroir";
import { CarteQuestions } from "./etapes/CarteQuestions";
import { CartePartDeVoix } from "./etapes/CartePartDeVoix";
import { CarteScore } from "./etapes/CarteScore";
import { CarteTechnique } from "./etapes/CarteTechnique";
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
/**
 * « Ce qu'une IA dit de vous » → « ce qu'une IA dit de vous » : seule la
 * première lettre baisse. `toLowerCase()` entier écrasait le sigle IA.
 */
const minuscule = (titre: string) => titre.charAt(0).toLowerCase() + titre.slice(1);

export function SequenceResultat({
  data,
  questions,
  reponses,
  mentions,
  wide,
  onBook,
  sautVersQuestions = 0,
}: {
  data: DonneesSequence;
  /** Les lignes brutes : l'étape « questions » les rend mot pour mot. */
  questions: Question[];
  reponses: Reponse[];
  mentions: Mention[];
  wide: boolean;
  onBook: () => void;
  /**
   * Compteur d'appels du lien « les N questions » de la barre haute. Il
   * change de valeur à chaque clic, ce qui suffit à rejouer le saut même
   * quand on est déjà passé par l'étape.
   */
  sautVersQuestions?: number;
}) {
  /**
   * Le bouton principal dit « Suivant : {titre de l'étape suivante} » : le
   * mot que tout le monde connaît d'abord, la destination ensuite. Les
   * libellés inventifs (« Voir qui prend ma place ») se lisaient comme des
   * actions optionnelles, pas comme LE chemin — le père de Luigi n'a pas
   * compris comment avancer (15/08/2026). Et comme le bouton reprend le
   * titre de l'étape qui suit RÉELLEMENT, il ne promet jamais une carte
   * absente quand une donnée manque.
   */
  type Etape = {
    clef: string;
    titre: string;
    preuve: string;
  };

  const etapes: Etape[] = [
    { clef: "score", titre: "Votre score", preuve: "Le chiffre mesuré" },
    ...(data.adversaire
      ? [{
          clef: "concurrent",
          titre: data.vosReponses >= data.adversaire.reponses ? "Qui vise votre place" : "Qui prend votre place",
          preuve: "Les réponses comptées",
        }]
      : []),
    ...(data.laPlusDure
      ? [{ clef: "verbatim", titre: "La phrase exacte", preuve: "" }]
      : []),
    ...(data.voix.length > 0
      ? [{ clef: "voix", titre: "La part de voix", preuve: "Les réponses par nom" }]
      : []),
    // Le miroir puis la cause technique : après le constat (score, rival,
    // phrase, part de voix), on montre au prospect sa fiche d'identité dans
    // l'IA, puis la porte d'entrée de son site. Les deux données existaient
    // déjà en base et n'étaient montrées nulle part.
    ...(data.miroir
      ? [{ clef: "miroir", titre: "Ce qu'une IA dit de vous", preuve: "La réponse, mot pour mot" }]
      : []),
    ...(data.technique
      ? [{
          clef: "technique",
          titre: data.technique.bloques.length > 0 ? "La porte est fermée" : "L'accès à votre site",
          preuve: "Les robots d'IA testés",
        }]
      : []),
    // L'échantillon complet, remonté de l'annexe le 14/08/2026 : dernière
    // preuve avant l'offre, et impossible à manquer.
    {
      clef: "questions",
      titre: `Les ${data.totalQuestions} questions`,
      preuve: "Où vous apparaissez",
    },
    // La modale « ce que vous apprenez » a été supprimée le 14/08/2026 : la
    // séquence portait deux comparatifs qui se répétaient. Son tableau vit
    // désormais DANS la carte diagnostic, et le CTA avance simplement.
    { clef: "diagnostic", titre: "Le scan complet", preuve: "" },
    { clef: "reservation", titre: "Réserver", preuve: "Le cadre de l'appel" },
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

  /**
   * Le lien « les N questions » de la barre haute mène à l'étape, plus à une
   * annexe. L'effet se garde sur une ref plutôt que sur un tableau de
   * dépendances : `aller` et `etapes` changent d'identité à chaque rendu, et
   * les lister ferait rejouer le saut en boucle.
   */
  const dernierSaut = useRef(0);
  useEffect(() => {
    if (sautVersQuestions === dernierSaut.current) return;
    dernierSaut.current = sautVersQuestions;
    if (!sautVersQuestions) return;
    const cible = etapes.findIndex((e) => e.clef === "questions");
    if (cible >= 0) aller(cible);
  });

  const etape = etapes[index]!;
  const suivante = etapes[index + 1] ?? null;

  const rendu = (part: "recit" | "preuve") => {
    switch (etape.clef) {
      case "score":
        return (
          <CarteScore
            score={data.score}
            domaine={data.domaine}
            date={data.date}
            moteurs={data.moteurs}
            composantes={data.composantes}
            socle={data.socle}
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
            wide={wide}
            part={part}
          />
        );
      case "miroir":
        return (
          <CarteMiroir
            marque={data.marque}
            moteur={data.miroir!.moteur}
            texte={data.miroir!.texte}
            date={data.date}
            totalQuestions={data.totalQuestions}
            wide={wide}
            part={part}
          />
        );
      case "technique":
        return (
          <CarteTechnique
            bloques={data.technique!.bloques}
            autorises={data.technique!.autorises}
            llmstxt={data.technique!.llmstxt}
            domaine={data.domaine}
            wide={wide}
            part={part}
          />
        );
      case "questions":
        return (
          <CarteQuestions
            questions={questions}
            reponses={reponses}
            mentions={mentions}
            marque={data.marque}
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

  const pied = suivante ? (
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
        Suivant : {minuscule(suivante.titre)} →
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
        Réserver mon scan complet
      </button>
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        // `flex: 1` remplace un `minHeight: calc(100vh - 70px)` : la barre
        // haute fait 79px, pas 70, et la page défilait donc de 9px sous
        // chaque carte. Le parent est déjà `flex min-h-screen flex-col`.
        flex: "1 0 auto",
        background: "var(--ink)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: wide ? "34px 32px" : "18px 14px 22px",
        gap: 16,
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
