import type { ReactNode } from "react";

import { CARD, HAIR, MONO, MUTED, PANEL } from "./theme";

/**
 * Coque de carte à deux colonnes : le récit à gauche, la preuve à droite.
 * Sur écran étroit, la preuve passe au-dessus pour que le chiffre soit vu
 * d'abord. Portée du projet Lovable de Jérémie le 14/08/2026.
 */
export function CarteSplit({
  numero,
  total,
  titre,
  wide,
  visible,
  onBack,
  recit,
  preuve,
  preuveLabel,
  preuveAlign = "center",
  pied,
}: {
  numero: number;
  total: number;
  titre: string;
  wide: boolean;
  visible: boolean;
  onBack: (() => void) | null;
  recit: ReactNode;
  preuve: ReactNode;
  preuveLabel: string;
  preuveAlign?: "center" | "start";
  pied: ReactNode;
}) {
  const ease = "cubic-bezier(0.22,1,0.36,1)";

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: wide ? 1060 : 760,
        background: CARD,
        border: `1px solid ${HAIR}`,
        borderRadius: 4,
        maxHeight: wide ? "calc(100vh - 190px)" : "calc(100vh - 140px)",
        overflowY: "auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
        transition: `opacity 320ms ${ease}, transform 320ms ${ease}`,
      }}
    >
      {/* en-tête */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 3,
          background: CARD,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: wide ? "14px 34px" : "12px 18px",
          borderBottom: `1px solid ${HAIR}`,
        }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Étape précédente"
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
          <span style={{ flex: "none" }} />
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
          {String(numero).padStart(2, "0")} / {String(total).padStart(2, "0")} · {titre.toUpperCase()}
        </span>
      </div>

      <div
        style={{
          display: wide ? "grid" : "flex",
          gridTemplateColumns: wide ? "minmax(0,55fr) minmax(0,45fr)" : undefined,
          flexDirection: wide ? undefined : "column",
        }}
      >
        {/* preuve : en second sur bureau, en premier sur mobile */}
        <div
          style={{
            order: wide ? 2 : 1,
            background: PANEL,
            borderLeft: wide ? `1px solid ${HAIR}` : undefined,
            borderBottom: wide ? undefined : `1px solid ${HAIR}`,
            padding: wide ? "34px 30px" : "20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            justifyContent: preuveAlign === "start" ? "flex-start" : "center",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transition: `opacity 340ms ${ease} 90ms, transform 340ms ${ease} 90ms`,
          }}
        >
          {preuveLabel ? (
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", color: MUTED }}>
              {preuveLabel.toUpperCase()}
            </span>
          ) : null}
          {preuve}
        </div>

        {/* récit */}
        <div
          style={{
            order: wide ? 1 : 2,
            padding: wide ? "34px 34px 30px" : "20px 18px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {recit}
          {pied}
        </div>
      </div>
    </div>
  );
}
