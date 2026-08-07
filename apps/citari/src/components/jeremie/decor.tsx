/**
 * Couches décoratives du site : fond de page, barre de lecture, halo de
 * curseur, nappe de vagues, étincelles au clic.
 *
 * Portées du projet Lovable de Jérémie le 07/08/2026. Regroupées dans un
 * seul fichier parce qu'elles partagent la même nature : purement visuelles,
 * jamais interactives, toutes désactivées quand l'utilisateur demande à
 * réduire les animations.
 */
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────── fond de page ─────────────────────────── */

/**
 * Couche de fond globale, montée une fois dans la racine.
 * Halo papier en haut de page, trame de grille qui s'estompe, grain léger.
 */
export function PageCanvas() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="canvas-halo absolute inset-0" />
      <div className="canvas-grid absolute inset-0" />
      <div className="canvas-grain absolute inset-0" />
    </div>
  );
}

/* ────────────────────────── barre de lecture ────────────────────────── */

/**
 * 2 px en haut de page, mesure réelle du défilement.
 * Aucune animation scriptée : la largeur suit strictement la position.
 */
export function ScrollProgress() {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    let frame = 0;
    const compute = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setRatio(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="read-bar w-full"
      style={{ transform: `scaleX(${ratio})`, opacity: ratio > 0.005 ? 1 : 0 }}
    />
  );
}

/* ─────────────────────────── halo de curseur ─────────────────────────── */

/**
 * Halo discret cantonné à la section parente, qui doit être
 * `relative overflow-hidden`. Désactivé au tactile.
 */
export function CursorHalo() {
  const host = useRef<HTMLDivElement | null>(null);
  const halo = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = host.current;
    const dot = halo.current;
    if (!el || !dot) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const parent = el.parentElement ?? el;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0, init: false };
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      if (!current.init) {
        current.x = target.x;
        current.y = target.y;
        current.init = true;
      }
      setActive(true);
    };
    const onLeave = () => setActive(false);

    const loop = () => {
      current.x += (target.x - current.x) * 0.09;
      current.y += (target.y - current.y) * 0.09;
      dot.style.transform = `translate3d(${current.x - 230}px, ${current.y - 230}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <div ref={halo} className="cursor-halo left-0 top-0" style={{ opacity: active ? 1 : 0 }} />
    </div>
  );
}

/* ──────────────────────────── nappe de vagues ──────────────────────────── */

const FADE =
  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)";
const LINES = 26;

/**
 * Fond de vagues filaires, cantonné à la section qui le contient.
 * Le parent doit être `relative overflow-hidden`. La souris infléchit
 * l'amplitude localement, sans à-coup.
 */
export function WaveField() {
  const host = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const r = el.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const pointer = { x: -1, y: -1, sx: -1, sy: -1, on: false };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      if (!pointer.on) {
        pointer.on = true;
        pointer.sx = pointer.x;
        pointer.sy = pointer.y;
      }
    };
    const onLeave = () => {
      pointer.on = false;
    };
    const parent = el.parentElement ?? el;
    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      if (pointer.on) {
        pointer.sx += (pointer.x - pointer.sx) * 0.12;
        pointer.sy += (pointer.y - pointer.sy) * 0.12;
      }

      const base = h * 0.62;
      const step = 5;

      for (let i = 0; i < LINES; i++) {
        const k = i / (LINES - 1);
        const yShift = (k - 0.5) * h * 0.34;
        // Une seule ligne d'accent, très discrète.
        const accent = i === Math.floor(LINES * 0.62);
        ctx.strokeStyle = accent
          ? "rgba(192, 55, 29, 0.75)"
          : `rgba(23, 22, 15, ${0.13 + 0.2 * (1 - Math.abs(k - 0.5) * 1.6)})`;
        ctx.lineWidth = accent ? 1.5 : 1.1;
        ctx.beginPath();

        for (let x = -20; x <= w + 20; x += step) {
          const nx = x / w;
          const phase = t * 0.00007 + i * 0.11;
          let y =
            base +
            yShift +
            Math.sin(nx * 3.1 + phase) * (h * 0.075) +
            Math.sin(nx * 6.4 - phase * 1.7 + i * 0.05) * (h * 0.03) +
            Math.sin(nx * 1.4 + phase * 0.6) * (h * 0.05);

          if (pointer.on) {
            const d = Math.hypot(x - pointer.sx, y - pointer.sy);
            const infl = Math.exp(-(d * d) / (2 * 210 * 210));
            y += (y - pointer.sy) * 0.95 * infl;
            ctx.lineWidth = accent ? 1.5 + infl * 1.2 : 1.1 + infl * 1.1;
          }

          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <canvas ref={canvas} className="h-full w-full" />
    </div>
  );
}

/* ────────────────────────── étincelles au clic ────────────────────────── */

type Spark = { x: number; y: number; angle: number; start: number };

/** Étincelles au clic, dessinées sur un canvas plein écran non interactif. */
export function ClickSpark({
  sparkSize = 9,
  sparkRadius = 16,
  sparkCount = 8,
  duration = 400,
}: {
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const easing = (t: number) => 1 - Math.pow(1 - t, 3);
    const color =
      getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#17160f";

    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparksRef.current = sparksRef.current.filter((s) => {
        const elapsed = now - s.start;
        if (elapsed >= duration) return false;
        const p = easing(elapsed / duration);
        const distance = p * sparkRadius;
        const lineLength = sparkSize * (1 - p);

        const x1 = s.x + distance * Math.cos(s.angle);
        const y1 = s.y + distance * Math.sin(s.angle);
        const x2 = s.x + (distance + lineLength) * Math.cos(s.angle);
        const y2 = s.y + (distance + lineLength) * Math.sin(s.angle);

        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onClick = (e: MouseEvent) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i += 1) {
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          angle: (2 * Math.PI * i) / sparkCount,
          start: now,
        });
      }
    };
    window.addEventListener("pointerdown", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [sparkSize, sparkRadius, sparkCount, duration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100]"
    />
  );
}
