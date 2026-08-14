import { useEffect } from "react";

import { CARD, HAIR, INK, MONO, MUTED, PANEL, PAPER, RED, SANS } from "./theme";

/**
 * Pop-up : le tableau comparatif aperçu / diagnostic complet, puis le bouton
 * de réservation collé en bas. Portée le 14/08/2026.
 *
 * Deux lignes corrigées par rapport à sa maquette : l'aperçu VÉRIFIE déjà les
 * robots (l'audit flash tourne pendant le scan gratuit), affirmer l'inverse
 * serait démenti par le rapport lui-même. La ligne devient celle des sources,
 * qui n'existent réellement qu'au diagnostic : la recherche web des moteurs
 * n'est activée qu'en mode complet.
 */
const LIGNES = [
  {
    label: "Ce que ChatGPT et Gemini répondent quand un client cherche votre métier",
    apercu: "40 réponses",
    diagnostic: "48 réponses",
  },
  {
    label: "Ce que répondent Claude, Perplexity, Grok et Le Chat",
    apercu: "aucune",
    diagnostic: "96 réponses",
  },
  {
    label: "Les sites exacts où les IA vont chercher le nom de vos concurrents",
    apercu: "non",
    diagnostic: "oui",
  },
  {
    label: "Ce qu'une IA raconte sur vous quand on lui donne votre nom",
    apercu: "1 moteur",
    diagnostic: "6 moteurs",
  },
  {
    label: "Pourquoi vos concurrents sortent et pas vous, la cause question par question",
    apercu: "non",
    diagnostic: "oui",
  },
  {
    label: "Lesquelles des corrections vous pouvez faire seul, lesquelles demandent un dev",
    apercu: "non",
    diagnostic: "oui",
  },
];

export function ModalePoints({
  open,
  onClose,
  onBook,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  onBook: () => void;
  wide: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cols = wide ? "minmax(0,1fr) 96px 116px" : "minmax(0,1fr) 62px 74px";

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ce que l'aperçu ne peut pas vous montrer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(23,22,15,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: wide ? "40px 32px" : "14px 12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: wide ? 780 : 620,
          background: CARD,
          border: `1px solid ${HAIR}`,
          borderRadius: 4,
          maxHeight: "calc(100vh - 60px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* en-tête */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: CARD,
            borderBottom: `1px solid ${HAIR}`,
            padding: wide ? "16px 26px" : "12px 14px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* L'accroche ne répète pas l'en-tête du tableau juste dessous. */}
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.13em", color: MUTED }}>
              LE DIAGNOSTIC COMPLET
            </span>
            <p
              style={{
                margin: 0,
                fontSize: wide ? 24 : 19,
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
                color: INK,
              }}
            >
              Approfondissez votre diagnostic avec notre équipe.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "transparent",
              border: `1px solid ${HAIR}`,
              borderRadius: 4,
              color: MUTED,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "4px 10px",
              flex: "none",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: wide ? "20px 26px 22px" : "14px 14px 18px" }}>
          {/* en-tête de colonnes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              alignItems: "end",
              gap: "0 8px",
              paddingBottom: 8,
              borderBottom: `1px solid ${HAIR}`,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: MUTED }}>
              CE QUE VOUS APPRENEZ
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.12em",
                color: MUTED,
                textAlign: "center",
              }}
            >
              APERÇU
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.12em",
                color: RED,
                textAlign: "center",
                background: PANEL,
                padding: "6px 0",
              }}
            >
              DIAGNOSTIC
            </span>
          </div>

          {LIGNES.map((ligne) => (
            <div
              key={ligne.label}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                alignItems: "center",
                gap: "0 8px",
                borderBottom: `1px solid ${HAIR}`,
              }}
            >
              <span
                style={{
                  fontSize: wide ? 15 : 13,
                  color: INK,
                  lineHeight: 1.4,
                  padding: wide ? "13px 0" : "11px 0",
                }}
              >
                {ligne.label}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: wide ? 12.5 : 11,
                  letterSpacing: "0.04em",
                  color: MUTED,
                  textAlign: "center",
                  padding: wide ? "13px 0" : "11px 0",
                }}
              >
                {ligne.apercu}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: wide ? 12.5 : 11,
                  letterSpacing: "0.04em",
                  color: RED,
                  fontWeight: 600,
                  textAlign: "center",
                  alignSelf: "stretch",
                  background: PANEL,
                  padding: wide ? "13px 0" : "11px 0",
                }}
              >
                {ligne.diagnostic}
              </span>
            </div>
          ))}

          <p
            style={{
              margin: wide ? "16px 0 0" : "12px 0 0",
              fontSize: wide ? 14.5 : 13,
              color: MUTED,
              lineHeight: 1.5,
            }}
          >
            Le diagnostic se lit ensemble, en visio, 30 minutes. C'est gratuit et sans engagement :
            si votre score est bon, on vous le dit et on ne vous vend rien.
          </p>
        </div>

        {/* pied collé */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: CARD,
            borderTop: `1px solid ${HAIR}`,
            padding: wide ? "14px 26px" : "12px 14px",
          }}
        >
          <button
            type="button"
            onClick={onBook}
            style={{
              background: INK,
              color: PAPER,
              border: "none",
              borderRadius: 4,
              padding: wide ? "16px 26px" : "15px 20px",
              fontSize: wide ? 17 : 16,
              fontWeight: 800,
              fontFamily: SANS,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Réserver mon diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}
