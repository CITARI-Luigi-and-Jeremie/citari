/**
 * Le coût de l'absence : deux chiffres publics sourcés, puis un simulateur.
 *
 * Version v3 de Jérémie, portée le 14/08/2026 : la carte Pew a été retirée
 * (deux cartes au lieu de trois), le simulateur est compacté sur un rang et
 * le curseur « part IA » a disparu — la part est fixée au repère McKinsey
 * 38 %, affiché comme base de calcul. Styles en ligne, bloc autonome.
 *
 * Les couleurs sont alignées sur NOS jetons : encre #17160F et signal
 * #C0371D, pas la palette historique de sa maquette. Les sources affichées
 * (McKinsey, Arcom) restent datées et nommées — la doctrine interdit
 * d'avancer un chiffre sans sa provenance.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { ScrollFloat } from "@/components/jeremie/ScrollFloat";
import { Quadrillage } from "@/components/jeremie/Quadrillage";
import { useScanFormFocus } from "@/lib/scan-form-focus";

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
const ON_INK_MUTED = "#8B857A";
const ON_INK_BODY = "#C9C4B8";

const SANS = "'Archivo', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n: number) => nf.format(Math.round(n)).replace(/ | |\s/g, " ");
const eur = (n: number) => `${fmt(n)} €`;

/** Bornes des curseurs : [min, max, pas]. */
const RANGE = {
  basket: [50, 20000, 50] as const,
  clients: [1, 60, 1] as const,
};

/** Part des acheteurs qui interrogent une IA avant de décider, repère McKinsey 2026. */
const PART_IA = 38;

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

/* ---------------------------------------------------------------- chiffres */

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
          const eased = 1 - Math.pow(1 - t, 3);
          setAffiche(cible * eased);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      // Sa maquette exigeait 90 % de visibilité dans une fenêtre rognée de
      // 25 % de chaque côté (le centrage du carrousel mobile) : selon la
      // largeur d'écran, le chiffre de GAUCHE tombait dans la zone exclue et
      // restait à 0 pour toujours. Un seuil simple suffit : les deux cartes
      // démarrent dès qu'elles entrent à l'écran, de la même manière.
      { threshold: 0.6 },
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

/**
 * La jauge des deux chiffres publics.
 *
 * UNE SEULE forme pour les deux cartes, à la même échelle 0-100 et avec le
 * même repère à mi-course : ils portaient jusqu'au 15/08/2026 deux langages
 * différents (barrettes segmentées d'un côté, barre pleine de l'autre), donc
 * deux pourcentages qu'on ne pouvait pas comparer d'un coup d'œil. Le repère
 * à 50 % fait le travail tout seul : un chiffre le dépasse, l'autre non.
 */
function Jauge({ pct, couleur, wide }: { pct: number; couleur: string; wide: boolean }) {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0]?.isIntersecting) return;
        io.disconnect();
        setOn(true);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative", height: wide ? 12 : 10, background: TRACK, borderRadius: 2 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: on ? `${pct}%` : "0%",
            background: couleur,
            borderRadius: 2,
            transition: "width 1100ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        {/* Le repère de mi-course, en fusion « difference » : il ressort
            clair sur le remplissage sombre et sombre sur le rail clair. En
            encre pleine, il disparaissait purement et simplement dans la
            jauge des 56,6 % (noir sur noir). */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -3,
            bottom: -3,
            width: 2,
            background: "#FFFFFF",
            mixBlendMode: "difference",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, color: FAINT }}>
        <span>0</span>
        <span>la moitié</span>
        <span>100 %</span>
      </div>
    </div>
  );
}

/**
 * Une carte de chiffre public. Les deux sont strictement parallèles :
 * légende de ce que le chiffre MESURE, le chiffre, la même jauge, puis ce
 * que ça change pour le lecteur. Avant, l'une répétait en toutes lettres le
 * pourcentage déjà géant au-dessus et l'autre s'y accrochait
 * grammaticalement (« des Français utilisent… ») : deux cartes qui ne se
 * lisaient pas de la même façon.
 */
function StatCard({
  logo,
  logoAlt,
  mesure,
  value,
  unit,
  implication,
  couleur,
  source,
  wide,
}: {
  logo?: string | undefined;
  logoAlt: string;
  mesure: string;
  value: string;
  unit: string;
  implication: React.ReactNode;
  couleur: string;
  source: string;
  wide: boolean;
}) {
  return (
    <div
      className="stat-card"
      style={{
        border: `1px solid ${HAIR}`,
        borderTop: `3px solid ${couleur}`,
        borderRadius: 4,
        background: CARD,
        padding: wide ? "20px 22px 18px" : "18px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10.5,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: MUTED,
          lineHeight: 1.4,
          minHeight: wide ? 30 : undefined,
        }}
      >
        {mesure}
      </span>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <CountUp
          value={value}
          style={{
            fontSize: wide ? 68 : 54,
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 0.85,
            color: couleur,
            fontVariantNumeric: "tabular-nums",
          }}
        />
        <span style={{ fontSize: wide ? 30 : 25, fontWeight: 800, letterSpacing: "-0.03em", color: couleur }}>
          {unit}
        </span>
      </div>

      <Jauge pct={Number(value.replace(",", "."))} couleur={couleur} wide={wide} />

      <span style={{ fontSize: wide ? 15.5 : 14.5, lineHeight: 1.45, color: BODY_STRONG, textWrap: "pretty" as never }}>
        {implication}
      </span>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 12,
          borderTop: `1px solid ${HAIR}`,
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

/* --------------------------------------------------------------- curseurs */

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  minLabel,
  maxLabel,
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
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontFamily: MONO,
          fontSize: 10.5,
          color: FAINT,
        }}
      >
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ écran */

export function CostCalculator({ sprintPrice = 2900 }: { sprintPrice?: number } = {}) {
  const wide = useWide(1100);
  const { focusAndScroll } = useScanFormFocus();
  const [basket, setBasket] = useState(3000);
  const [clients, setClients] = useState(8);
  const [period, setPeriod] = useState<"month" | "year">("month");

  const { monthly, yearly } = useMemo(() => {
    const ai = (clients * PART_IA) / 100;
    const m = Math.round(basket * ai);
    return { monthly: m, yearly: m * 12 };
  }, [basket, clients]);

  const isYear = period === "year";
  const result = isYear ? yearly : monthly;
  const payClients = Math.ceil(sprintPrice / Math.max(1, basket));

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
      id="cout"
      style={{
        position: "relative",
        background: "var(--surface-hollow)",
        color: INK,
        fontFamily: SANS,
        padding: wide ? "56px 40px 88px" : "36px 20px 64px",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Quadrillage variante="clair" />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 960,
          display: "flex",
          flexDirection: "column",
          gap: wide ? 52 : 40,
        }}
      >
        {/* les deux chiffres publics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
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
              {/* Une seule phrase de corps depuis le 15/08/2026. Il y en avait
                  quatre, dont un bloc de 26px qui concurrençait le titre, et
                  toutes disaient la même chose : le marché existe, il se
                  décide ailleurs, dans une réponse qui ne cite personne. */}
              <p
                style={{
                  margin: 0,
                  fontSize: wide ? 19 : 16.5,
                  lineHeight: 1.5,
                  color: BODY,
                  textWrap: "pretty" as never,
                }}
              >
                Vos clients ne sont pas partis, ils demandent à une IA avant de choisir.{" "}
                <strong style={{ color: INK, fontWeight: 700 }}>
                  Et sa réponse ne cite que trois noms.
                </strong>
              </p>
            </div>
          </div>

          {/* Empilées hors grand écran depuis le 15/08/2026. C'était un
              carrousel horizontal sans indicateur : sous 1100px, la seconde
              carte était purement et simplement hors de l'écran, et rien ne
              disait qu'elle existait. Deux cartes ne valent pas un
              carrousel. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: wide ? "repeat(2, 1fr)" : "1fr",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            {/* L'ordre raconte : d'abord l'usage général, ensuite l'usage qui
                décide d'un achat — c'est ce dernier chiffre qui sert de base
                au simulateur juste en dessous. Le rouge est réservé à la
                carte qui parle de SES clients. */}
            {[
              <StatCard
                key="arcom"
                wide={wide}
                logo="/img/arcom.jpg"
                logoAlt="Arcom / Médiamétrie"
                mesure="Des Français utilisent l'IA"
                value="56,6"
                unit="%"
                couleur={INK}
                implication="Plus d'un sur deux. Vos clients y posent déjà leurs questions."
                source="Arcom / Médiamétrie · avr. 2026"
              />,
              <StatCard
                key="mck"
                wide={wide}
                logo="/img/mckinsey.png"
                logoAlt="McKinsey"
                mesure="Des acheteurs interrogent une IA avant de choisir"
                value="38"
                unit="%"
                couleur={RED}
                implication={
                  <>
                    Près de <strong style={{ fontWeight: 700 }}>quatre acheteurs sur dix</strong>{" "}
                    arrivent avec une liste déjà faite. Vous y êtes, ou vous n'existez pas.
                  </>
                }
                source="McKinsey · mars 2026"
              />,
            ]}
          </div>
        </div>

        {/* le simulateur, compacté sur un rang */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 660,
              alignItems: wide ? "flex-start" : "center",
              textAlign: wide ? "left" : "center",
              margin: wide ? undefined : "0 auto",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: wide ? 25 : 21,
                fontWeight: 800,
                letterSpacing: "-0.032em",
                lineHeight: 1.18,
                textWrap: "pretty" as never,
              }}
            >
              Combien de vos clients passent par une IA avant de vous appeler ?
            </h3>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5, color: BODY, textWrap: "pretty" as never }}>
              Ça ne laisse aucune trace dans vos statistiques, mais vous pouvez l'estimer ci-dessous.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: wide ? "1fr 1fr" : "1fr",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                border: `1px solid ${HAIR}`,
                borderRadius: 4,
                background: CARD,
                padding: wide ? "22px 24px 24px" : "20px 18px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: MUTED,
                }}
              >
                Vos chiffres
              </span>

              <Slider
                label="Ce que vous rapporte un nouveau client"
                value={basket}
                display={eur(basket)}
                min={RANGE.basket[0]}
                max={RANGE.basket[1]}
                step={RANGE.basket[2]}
                minLabel={eur(50)}
                maxLabel={eur(20000)}
                onChange={setBasket}
              />
              <Slider
                label="Nombre de nouveaux clients par mois"
                value={clients}
                display={String(clients)}
                min={RANGE.clients[0]}
                max={RANGE.clients[1]}
                step={RANGE.clients[2]}
                minLabel="1"
                maxLabel="60"
                onChange={setClients}
              />

              <span style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.45, color: MUTED, marginTop: "auto" }}>
                Base : {PART_IA} % des acheteurs interrogent une IA avant de décider, repère
                McKinsey 2026.
              </span>
            </div>

            <div
              style={{
                borderRadius: 4,
                background: INK,
                color: PAPER,
                padding: wide ? "22px 24px 24px" : "20px 18px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 13,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: ON_INK_MUTED,
                  }}
                >
                  Ce que vous ne voyez pas
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

              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: wide ? 46 : 40,
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.92,
                    fontVariantNumeric: "tabular-nums",
                    color: RED,
                  }}
                >
                  {fmt(result)}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: RED }}>€</span>
              </div>

              <span style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.32 }}>
                d'affaires {isYear ? "par an" : "par mois"} se décident dans une conversation d'un
                moteur IA dans lequel vous n'êtes peut-être pas.
              </span>

              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: ON_INK_BODY,
                  borderTop: `1px solid ${LINE_INK}`,
                  paddingTop: 11,
                }}
              >
                {isYear ? fmt(clients * 12) : String(clients)} clients × {PART_IA} % (McKinsey) ×{" "}
                {eur(basket)} = {eur(result)} {isYear ? "/ an" : "/ mois"}
              </span>

              <button
                type="button"
                onClick={focusAndScroll}
                style={{
                  marginTop: "auto",
                  background: PAPER,
                  color: INK,
                  padding: 13,
                  border: "none",
                  borderRadius: 3,
                  fontFamily: SANS,
                  fontSize: 15.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Voir si je suis cité
              </button>

              <span style={{ fontSize: 11.5, lineHeight: 1.45, color: ON_INK_MUTED }}>
                {basket >= sprintPrice
                  ? `Notre prix Sprint GEO à ${eur(sprintPrice)} : un seul client récupéré le rembourse.`
                  : `Notre prix Sprint GEO à ${eur(sprintPrice)} : remboursé au ${payClients}e client récupéré sur l'année.`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
