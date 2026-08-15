import { MoteurLogo } from "@/components/moteur-logo";
import { TexteMoteur, type Mention, type Question, type Reponse } from "@/components/rapport";
import { MOTEURS } from "@/lib/typo";

import { BODY, CARD, HAIR, INK, MONO, MUTED, PANEL, RED, TEXT, labelStyle } from "../theme";

/**
 * L'échantillon complet, DANS la séquence.
 *
 * Il vivait en annexe sous la séquence, avec deux liens pour y descendre :
 * personne ne descendait, c'était pourtant la pièce qui prouve la mesure.
 * Étape depuis le 14/08/2026, l'annexe est supprimée. Ne jamais la rétablir :
 * la même pièce à deux endroits est le piège déjà payé avec les deux
 * comparatifs.
 *
 * Restylée le 15/08/2026 sur retour de Luigi (« on ne comprend même pas que
 * les questions sont cliquables ») : chaque question est une RANGÉE-BOUTON
 * (bordure, chevron, libellé « lire »), une consigne dit le geste en toutes
 * lettres, et les cases de la grille OUVRENT la question correspondante.
 * `<details>` natif : l'ouverture marche sans JavaScript, le saut depuis la
 * grille est un plus, pas une condition.
 */
export function CarteQuestions({
  questions,
  reponses,
  mentions,
  marque,
  wide,
  part,
}: {
  questions: Question[];
  reponses: Reponse[];
  mentions: Mention[];
  marque: string;
  wide: boolean;
  part: "recit" | "preuve";
}) {
  // Une réponse en panne ne prouve rien et ne compte nulle part : c'est la
  // même règle que le dénominateur du score.
  const valides = reponses.filter((r) => !r.error && r.raw_text);
  const moteursPresents = MOTEURS.filter((m) => valides.some((r) => r.engine === m));

  const lignes = questions
    .map((q) => {
      const desReponses = valides.filter((r) => r.query_id === q.id);
      const moteursCitants = moteursPresents.filter((m) =>
        mentions.some((x) => x.query_id === q.id && x.engine === m && x.is_target),
      );
      return { q, desReponses, moteursCitants, citee: moteursCitants.length > 0 };
    })
    .filter((l) => l.desReponses.length > 0);

  const citees = lignes.filter((l) => l.citee).length;

  /**
   * Ouvre une question depuis la grille. Les deux colonnes de la carte sont
   * deux instances du composant : pas d'état partagé possible, on passe par
   * le DOM, ce que `<details>` permet proprement.
   */
  const ouvrir = (rank: number) => {
    const d = document.getElementById(`carteq-${rank}`);
    if (d instanceof HTMLDetailsElement) {
      d.open = true;
      // Défilement instantané : le `behavior: "smooth"` se faisait annuler
      // par le reflow de l'ouverture et la liste ne bougeait pas.
      d.scrollIntoView({ block: "nearest" });
    }
  };

  if (part === "preuve") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: wide ? 34 : 30,
              fontWeight: 700,
              color: citees === 0 ? RED : INK,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {citees} / {lignes.length}
          </div>
          <p style={{ fontSize: wide ? 14 : 13.5, color: BODY, lineHeight: 1.4, margin: "8px 0 0" }}>
            {citees === 0
              ? `${marque} n'apparaît dans aucune des ${lignes.length} questions posées.`
              : `Questions où ${marque} apparaît au moins une fois.`}
          </p>
        </div>

        {/* Une case par question : la donnée fait le graphique, et chaque
            case ouvre sa question dans la colonne d'à côté. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {lignes.map((l) => (
            <button
              key={l.q.id}
              type="button"
              onClick={() => ouvrir(l.q.rank)}
              title={`${String(l.q.rank).padStart(2, "0")} · ${l.q.text} · ${
                l.citee ? `cité par ${l.moteursCitants.join(", ")}` : "absent partout"
              }`}
              style={{
                width: wide ? 27 : 25,
                height: wide ? 27 : 25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: l.citee ? INK : RED,
                color: "#FFFDF9",
                border: "none",
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: 10.5,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(l.q.rank).padStart(2, "0")}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
          <Legende couleur={INK} texte="Vous êtes cité" />
          <Legende couleur={RED} texte="Absent de toutes les réponses" />
        </div>

        <p
          style={{
            fontFamily: MONO,
            fontSize: 11.5,
            color: MUTED,
            lineHeight: 1.5,
            margin: 0,
            borderTop: `1px solid ${HAIR}`,
            paddingTop: 12,
          }}
        >
          {valides.length} réponses lues · {moteursPresents.join(", ")}
        </p>
      </div>
    );
  }

  return (
    <>
      <span style={labelStyle}>LA MESURE, MOT POUR MOT</span>

      <p
        style={{
          fontSize: wide ? 28 : 22,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        Les {lignes.length} questions, et ce que chaque IA a répondu.
      </p>

      <p style={{ fontSize: wide ? 15.5 : 14.5, color: BODY, lineHeight: 1.5, margin: 0 }}>
        Aucune ne contient votre nom, volontairement : on mesure si les IA vous citent
        d'elles-mêmes.
      </p>

      {/* La consigne, en toutes lettres : l'affordance seule ne suffisait pas. */}
      <p
        style={{
          fontFamily: MONO,
          fontSize: 11.5,
          letterSpacing: "0.08em",
          color: RED,
          margin: 0,
        }}
      >
        ▸ CLIQUEZ SUR UNE QUESTION POUR LIRE LES RÉPONSES
      </p>

      {/* La liste défile dans la carte ; le voile en bas dit qu'il y a une
          suite sans qu'on ait à l'écrire. */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            maxHeight: wide ? 244 : 224,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingBottom: 18,
          }}
        >
          {lignes.map((l) => (
            <details
              key={l.q.id}
              id={`carteq-${l.q.rank}`}
              style={{
                border: `1px solid ${HAIR}`,
                borderRadius: 3,
                background: CARD,
                flex: "none",
              }}
            >
              <summary
                className="list-none carteq-ligne"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  padding: wide ? "10px 12px" : "9px 10px",
                }}
              >
                <span
                  aria-hidden
                  className="carteq-chevron"
                  style={{ fontFamily: MONO, fontSize: 11, color: RED, flex: "none" }}
                >
                  ▸
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10.5,
                    color: MUTED,
                    flex: "none",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(l.q.rank).padStart(2, "0")}
                </span>
                <span style={{ flex: 1, fontSize: wide ? 13.5 : 13, lineHeight: 1.4, color: TEXT }}>
                  {l.q.text}
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10.5,
                    flex: "none",
                    color: l.citee ? MUTED : RED,
                  }}
                >
                  {l.citee ? "cité" : "absent"}
                </span>
              </summary>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: wide ? "4px 12px 14px 33px" : "2px 10px 12px 29px",
                  borderTop: `1px solid ${HAIR}`,
                  background: PANEL,
                }}
              >
                {moteursPresents.map((m) => {
                  const rep = l.desReponses.find((r) => r.engine === m);
                  if (!rep) return null;
                  const citations = mentions.filter((x) => x.response_id === rep.id);
                  const cible = citations.find((x) => x.is_target);
                  const concurrents = citations.filter((x) => !x.is_target).map((x) => x.brand);
                  return (
                    <div key={m} style={{ paddingTop: 10 }}>
                      <p
                        style={{
                          fontFamily: MONO,
                          fontSize: 10.5,
                          color: MUTED,
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "baseline",
                          gap: "2px 10px",
                          margin: 0,
                        }}
                      >
                        <span style={{ color: INK, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <MoteurLogo moteur={m} className="text-[12px]" />
                          {m}
                        </span>
                        {cible ? (
                          <span>
                            {marque} en position {cible.position ?? "?"}
                            {cible.recommended ? " · recommandé" : ""}
                          </span>
                        ) : (
                          <span style={{ color: RED }}>{marque} absent</span>
                        )}
                        {concurrents.length ? <span>cités : {concurrents.join(", ")}</span> : null}
                      </p>
                      <p
                        style={{
                          fontSize: 12.5,
                          lineHeight: 1.55,
                          color: BODY,
                          whiteSpace: "pre-line",
                          margin: "6px 0 0",
                        }}
                      >
                        <TexteMoteur texte={rep.raw_text ?? ""} />
                      </p>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>

        {/* Voile de défilement : signale la suite de la liste. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 26,
            background: `linear-gradient(to bottom, transparent, ${CARD})`,
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}

function Legende({ couleur, texte }: { couleur: string; texte: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, background: couleur, flex: "none" }} />
      <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{texte}</span>
    </span>
  );
}
