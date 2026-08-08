/**
 * Le coût de l'absence : trois chiffres publics sourcés, puis un simulateur.
 *
 * Porté du projet Lovable de Jérémie le 07/08/2026. Styles en ligne, sans
 * dépendance à la configuration Tailwind : le bloc est autonome et se déplace
 * d'une page à l'autre sans rien casser.
 *
 * Calcul : panier moyen × nouveaux clients par mois × part passant par une IA.
 * Les trois sources affichées (McKinsey, Pew, Arcom) sont datées et nommées —
 * la doctrine interdit d'avancer un chiffre sans sa provenance.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { ScrollFloat } from "@/components/jeremie/ScrollFloat";

const INK = "#17160F";
const PAPER = "#FBFAF7";
const CARD = "#FFFDF9";
const PANEL = "#F2F0EA";
const TRACK = "#EDEBE4";
const HAIR = "#E4E1D9";
const LINE_INK = "#34322D";
const MUTED = "#7A756B";
const FAINT = "#A8A296";
const BODY = "#55514A";
const BODY_STRONG = "#3A3733";
const RED = "#C0371D";
const RED_DARK = "#9E2C17";
const RED_TINT = "#F6DFD8";
const CORAL = "#E0553A";
const ON_INK_MUTED = "#8B857A";
const ON_INK_BODY = "#C9C4B8";

const SANS = "'Archivo', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n: number) => nf.format(Math.round(n)).replace(/ | /g, " ");

const RANGE = {
  basket: [50, 20000, 10] as const,
  clients: [1, 60, 1] as const,
  share: [0, 100, 1] as const,
};

export type CostCalculatorProps = {
  defaults?: { basket?: number; clients?: number; share?: number };
  sprintPrice?: number;
  onCta?: () => void;
  ctaLabel?: string;
};

function useWide(px = 1100) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [px]);
  return wide;
}

/** Chiffre qui se compose à l'entrée dans le champ de vision. */
function CountUp({ value, style }: { value: string; style?: CSSProperties }) {
  const negatif = value.trim().startsWith("−") || value.trim().startsWith("-");
  const brut = value.replace("−", "").replace("-", "").replace(",", ".");
  const cible = Number.parseFloat(brut);
  const decimales = brut.includes(".") ? brut.split(".")[1]!.length : 0;
  const ref = useRef<HTMLSpanElement | null>(null);
  const [affiche, setAffiche] = useState(Number.isFinite(cible) ? 0 : cible);

  useEffect(() => {
    const el = ref.current;
    if (!el || !Number.isFinite(cible)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAffiche(cible);
      return;
    }
    let frame = 0;
    const io = new IntersectionObserver(
      (entrees) => {
        if (!entrees[0]?.isIntersecting) return;
        io.disconnect();
        const debut = performance.now();
        const duree = 1100;
        const tick = (now: number) => {
          const t = Math.min(1, (now - debut) / duree);
          setAffiche(cible * (1 - Math.pow(1 - t, 3)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.9, rootMargin: "0px -25% 0px -25%" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [cible]);

  const texte = Number.isFinite(cible)
    ? `${negatif ? "−" : ""}${affiche.toFixed(decimales).replace(".", ",")}`
    : value;

  return (
    <span ref={ref} className="stat-num" style={style}>
      {texte}
    </span>
  );
}

function StatCard({
  logo,
  logoAlt,
  value,
  unit,
  line,
  chart,
  source,
  wide,
}: {
  logo?: string;
  logoAlt: string;
  value: string;
  unit: string;
  line: string;
  chart: React.ReactNode;
  source: string;
  wide: boolean;
}) {
  return (
    <div
      className="stat-card"
      style={{
        border: `1px solid ${HAIR}`,
        borderRadius: 4,
        background: CARD,
        padding: wide ? "22px 22px 18px" : "18px 18px 15px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <CountUp
          value={value}
          style={{
            fontSize: wide ? 64 : 52,
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 0.88,
            fontVariantNumeric: "tabular-nums",
          }}
        />
        <span
          style={{ fontSize: wide ? 30 : 25, fontWeight: 800, letterSpacing: "-0.03em", color: FAINT }}
        >
          {unit}
        </span>
      </div>

      <span style={{ fontSize: 15.5, lineHeight: 1.4, color: BODY_STRONG }}>{line}</span>
      {chart}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: ON_INK_MUTED }}>{source}</span>
        {logo ? (
          <img
            src={logo}
            alt={logoAlt}
            style={{ height: 22, width: "auto", maxWidth: 104, objectFit: "contain", display: "block", flexShrink: 0 }}
          />
        ) : null}
      </div>
    </div>
  );
}

function Bar({ pct, color = INK }: { pct: number; color?: string }) {
  return (
    <div style={{ position: "relative", height: 8, background: TRACK, borderRadius: 99, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color, borderRadius: 99 }} />
    </div>
  );
}

function CompareBar({
  label,
  pct,
  value,
  color,
  dim,
}: { label: string; pct: number; value: string; color: string; dim?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, color: dim ? FAINT : BODY, width: 74, flex: "none" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 8, background: TRACK, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
      </div>
      <span
        style={{ fontFamily: MONO, fontSize: 10, color: dim ? FAINT : BODY, width: 26, flex: "none", textAlign: "right" }}
      >
        {value}
      </span>
    </div>
  );
}

/** 25 barrettes, dont 9 pleines : 38 % lisible d'un coup d'œil. */
function DotScale({ filled = 9, total = 25 }: { filled?: number; total?: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 22 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ flex: 1, height: i < filled ? 22 : 10, background: i < filled ? INK : HAIR, borderRadius: 1 }} />
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  marker,
  markerLabel,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  marker?: number;
  markerLabel?: string;
  onChange: (v: number) => void;
}) {
  const track = useRef<HTMLDivElement | null>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const setFromX = (clientX: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    onChange(Math.round((min + t * (max - min)) / step) * step);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setFromX(e.clientX);
    const move = (ev: PointerEvent) => setFromX(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const d =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? step
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -step
          : 0;
    if (!d) return;
    e.preventDefault();
    onChange(Math.max(min, Math.min(max, value + d)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 16, color: BODY_STRONG }}>{label}</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 19,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            background: PANEL,
            border: `1px solid ${HAIR}`,
            borderRadius: 3,
            padding: "6px 11px",
            whiteSpace: "nowrap",
          }}
        >
          {display}
        </span>
      </div>

      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        style={{
          position: "relative",
          height: 34,
          display: "flex",
          alignItems: "center",
          cursor: "ew-resize",
          touchAction: "none",
          outline: "none",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, height: 6, background: TRACK, borderRadius: 99 }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 6, background: INK, borderRadius: 99 }} />
        {marker !== undefined ? (
          <div style={{ position: "absolute", left: `${marker}%`, top: 3, bottom: 3, width: 2, background: RED, borderRadius: 99 }} />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            width: 22,
            height: 22,
            background: CARD,
            border: `2px solid ${INK}`,
            borderRadius: 99,
            transform: "translateX(-11px)",
            boxShadow: "0 1px 3px rgba(23,22,15,0.18)",
          }}
        />
      </div>

      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: MONO, fontSize: 10.5, color: FAINT }}
      >
        <span>{minLabel}</span>
        {markerLabel ? <span style={{ color: RED_DARK }}>{markerLabel}</span> : null}
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export function CostCalculator({
  defaults,
  sprintPrice = 2900,
  onCta,
  ctaLabel = "Lancer mon scan gratuit",
}: CostCalculatorProps) {
  const wide = useWide(1100);
  const [basket, setBasket] = useState(defaults?.basket ?? 200);
  const [clients, setClients] = useState(defaults?.clients ?? 5);
  const [share, setShare] = useState(defaults?.share ?? 38);
  const [period, setPeriod] = useState<"month" | "year">("month");

  const { monthly, yearly, aiClients } = useMemo(() => {
    const ai = (clients * share) / 100;
    const m = Math.round(basket * ai);
    return { monthly: m, yearly: m * 12, aiClients: ai };
  }, [basket, clients, share]);

  const isYear = period === "year";
  const result = isYear ? yearly : monthly;
  void sprintPrice;

  const segment = (active: boolean) => ({
    fontFamily: MONO,
    fontSize: 10.5,
    padding: "5px 11px",
    borderRadius: 99,
    cursor: "pointer",
    border: "none",
    background: active ? PAPER : "transparent",
    color: active ? INK : ON_INK_MUTED,
  });

  return (
    <section
      style={{
        background: "var(--surface-hollow)",
        color: INK,
        fontFamily: SANS,
        padding: wide ? "56px 40px 88px" : "36px 20px 64px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 960, display: "flex", flexDirection: "column", gap: wide ? 52 : 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: 600,
              alignItems: wide ? "flex-start" : "center",
              textAlign: wide ? "left" : "center",
              margin: wide ? undefined : "0 auto",
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: ON_INK_MUTED,
              }}
            >
              Ce qui a changé
            </span>

            <ScrollFloat
              style={{
                margin: 0,
                fontSize: wide ? 52 : 34,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                textWrap: "pretty" as never,
              }}
            >
              Le trafic baisse. La demande, non.
            </ScrollFloat>

            <p
              style={{
                margin: 0,
                fontSize: wide ? 17 : 15.5,
                lineHeight: 1.55,
                color: BODY,
                textWrap: "pretty" as never,
              }}
            >
              Votre marché n'a pas disparu. C'est{" "}
              <strong style={{ color: BODY_STRONG }}>l'endroit où il se décide</strong> qui a
              changé de place, et personne ne vous a prévenu.
            </p>

            <div
              style={{
                height: 1,
                width: "100%",
                maxWidth: 420,
                background: LINE_INK,
                margin: wide ? "14px 0 4px" : "10px 0 2px",
              }}
            />

            <p
              style={{
                margin: 0,
                fontSize: wide ? 26 : 21,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: INK,
                textWrap: "pretty" as never,
              }}
            >
              La décision se prend désormais dans la réponse, pas sur votre site.
            </p>

            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5, color: BODY }}>
              Et dans cette réponse, il n'y a que{" "}
              <span style={{ color: RED_DARK }}>trois noms</span>.
            </p>
          </div>

          <div
            style={
              wide
                ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }
                : {
                    display: "flex",
                    gap: 0,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    margin: "0 -20px",
                    padding: "0 0 6px",
                    scrollbarWidth: "none",
                  }
            }
          >
            {[
              <StatCard
                key="mck"
                wide={wide}
                logo="/img/mckinsey.png"
                logoAlt="McKinsey"
                value="38"
                unit="%"
                line="de vos acheteurs interrogent une IA avant de décider. Trois noms sortent. Le vôtre, ou trois concurrents."
                chart={<DotScale />}
                source="McKinsey · mars 2026"
              />,
              <StatCard
                key="pew"
                wide={wide}
                logo="/img/pew.jpg"
                logoAlt="Pew Research Center"
                value="1"
                unit="sur 2"
                line="C'est la part des clics qui disparaît dès qu'une réponse d'IA s'affiche."
                chart={
                  // Les deux valeurs brutes de l'étude sont sous le titre : 15 % de
                  // clics sans réponse d'IA, 8 % avec. Le « 1 sur 2 » les résume,
                  // il ne les remplace pas.
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <CompareBar label="sans rép. d'IA" pct={100} value="15 %" color={ON_INK_BODY} dim />
                    <CompareBar label="avec rép. d'IA" pct={53} value="8 %" color={RED} />
                  </div>
                }
                source="Pew Research Center · juill. 2025 · n = 900"
              />,
              <StatCard
                key="arcom"
                wide={wide}
                logo="/img/arcom.jpg"
                logoAlt="Arcom / Médiamétrie"
                value="56,6"
                unit="%"
                line="des Français utilisent déjà l'IA. Vous n'êtes pas devenu invisible, le marché a changé de fenêtre."
                chart={<Bar pct={56.6} />}
                source="Arcom / Médiamétrie · avr. 2026"
              />,
            ].map((card, i) =>
              wide ? (
                card
              ) : (
                <div
                  key={i}
                  style={{
                    flex: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0 20px",
                    display: "flex",
                    flexDirection: "column",
                    scrollSnapAlign: "center",
                  }}
                >
                  {card}
                </div>
              ),
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 11,
              maxWidth: 660,
              alignItems: wide ? "flex-start" : "center",
              textAlign: wide ? "left" : "center",
              margin: wide ? undefined : "0 auto",
            }}
          >
            <h3 style={{ margin: 0, fontSize: wide ? 28 : 24, fontWeight: 800, letterSpacing: "-0.032em", lineHeight: 1.2 }}>
              Calculez le chiffre d'affaires que vous exposez aux recherches IA.
            </h3>
            <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.55, color: BODY }}>
              Trois chiffres que vous connaissez déjà, et vous voyez ce qui se joue chaque mois dans
              les réponses des IA.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: wide ? "row" : "column", gap: 24, alignItems: "stretch" }}>
            <div
              style={{
                flex: 1,
                border: `1px solid ${HAIR}`,
                borderRadius: 4,
                background: CARD,
                padding: wide ? "30px 30px 32px" : "24px 20px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 34,
              }}
            >
              <span
                style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}
              >
                vos chiffres
              </span>

              <Slider
                label="Panier moyen de vos nouveaux clients"
                value={basket}
                display={`${fmt(basket)} €`}
                min={RANGE.basket[0]}
                max={RANGE.basket[1]}
                step={RANGE.basket[2]}
                minLabel="50 €"
                maxLabel="20 000 €"
                onChange={setBasket}
              />
              <Slider
                label="Vos nouveaux clients par mois"
                value={clients}
                display={String(clients)}
                min={RANGE.clients[0]}
                max={RANGE.clients[1]}
                step={RANGE.clients[2]}
                minLabel="1"
                maxLabel="60"
                onChange={setClients}
              />
              <Slider
                label="Vos prospects qui passent par une IA avant de choisir"
                value={share}
                display={`${share} %`}
                min={RANGE.share[0]}
                max={RANGE.share[1]}
                step={RANGE.share[2]}
                minLabel="0 %"
                maxLabel="100 %"
                marker={38}
                markerLabel="repère McKinsey 38 %"
                onChange={setShare}
              />
            </div>

            <div
              style={{
                width: wide ? 392 : "auto",
                flex: "none",
                borderRadius: 4,
                background: INK,
                color: PAPER,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "26px 26px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  borderBottom: `1px solid ${LINE_INK}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                  <span
                    style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: ON_INK_MUTED }}
                  >
                    Coût de l'absence
                  </span>
                  <div style={{ display: "flex", background: "#26241F", borderRadius: 99, padding: 2 }}>
                    <button type="button" onClick={() => setPeriod("month")} style={segment(!isYear)}>
                      mois
                    </button>
                    <button type="button" onClick={() => setPeriod("year")} style={segment(isYear)}>
                      an
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                  <span
                    style={{
                      fontSize: 66,
                      fontWeight: 800,
                      letterSpacing: "-0.05em",
                      lineHeight: 0.86,
                      fontVariantNumeric: "tabular-nums",
                      color: CORAL,
                    }}
                  >
                    {fmt(result)}
                  </span>
                  <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: CORAL }}>€</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.35 }}>
                  d'affaires {isYear ? "par an" : "par mois"} se décident dans une réponse d'IA.
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: ON_INK_MUTED }}>
                  soit {isYear ? `${fmt(monthly)} € par mois` : `${fmt(yearly)} € par an`}
                </span>
              </div>

              <div
                style={{
                  padding: "20px 26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 11,
                  borderBottom: `1px solid ${LINE_INK}`,
                }}
              >
                <span
                  style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: ON_INK_MUTED }}
                >
                  Le calcul
                </span>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "baseline", fontSize: 14.5 }}>
                  <span style={{ color: ON_INK_BODY }}>
                    {isYear ? "clients par an passés par une IA" : "clients par mois passés par une IA"}
                  </span>
                  <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
                    {isYear ? fmt(aiClients * 12) : aiClients.toFixed(1).replace(".", ",")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "baseline", fontSize: 14.5 }}>
                  <span style={{ color: ON_INK_BODY }}>× panier moyen</span>
                  <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>{fmt(basket)} €</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "baseline",
                    fontSize: 14.5,
                    borderTop: `1px solid ${LINE_INK}`,
                    paddingTop: 11,
                  }}
                >
                  <span style={{ color: PAPER, fontWeight: 600 }}>chiffre d'affaires exposé</span>
                  <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: CORAL }}>
                    {fmt(result)} €
                  </span>
                </div>
              </div>

              <div style={{ padding: "20px 26px 24px", display: "flex", flexDirection: "column", gap: 13, marginTop: "auto" }}>
                <span style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.5, color: ON_INK_MUTED }}>
                  Une estimation à partir de vos chiffres, pas une mesure. La mesure, c'est le scan.
                </span>
                <button
                  type="button"
                  onClick={onCta}
                  style={{
                    background: RED,
                    color: PAPER,
                    padding: 14,
                    border: "none",
                    borderRadius: 3,
                    fontFamily: SANS,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {ctaLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CostCalculator;
