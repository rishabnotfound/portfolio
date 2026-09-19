import React, { useEffect, useRef, type ReactNode } from "react";

type Point = { x: number; y: number };

function createRandom(seed: number) {
  let state = seed >>> 0;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const shake = (r: () => number, amt: number) => (r() - 0.5) * 2 * amt;
const round = (v: number) => Math.round(v * 100) / 100;

function trace(points: Point[], close = false) {
  const [first, ...rest] = points;
  if (!first) return "";
  let d = `M${round(first.x)},${round(first.y)}`;
  rest.forEach((a, i) => {
    const n = rest[i + 1];
    if (!n) { d += ` L${round(a.x)},${round(a.y)}`; return; }
    d += ` Q${round(a.x)},${round(a.y)} ${round((a.x + n.x) / 2)},${round((a.y + n.y) / 2)}`;
  });
  return close ? `${d} Z` : d;
}

function stroke(from: Point, to: Point, opts: { sag?: number; wobble?: number; steps?: number }, r: () => number) {
  const { sag = 0, wobble = 0.55, steps = 12 } = opts;
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const loose = i === 0 || i === steps ? 0 : 1;
    pts.push({
      x: from.x + (to.x - from.x) * t + shake(r, wobble) * loose,
      y: from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * sag + shake(r, wobble) * loose,
    });
  }
  return pts;
}

function wave(from: Point, to: Point, opts: { amplitude: number; cycles: number; wobble?: number }, r: () => number) {
  const { amplitude, cycles, wobble = 0.35 } = opts;
  const steps = Math.round(cycles * 4);
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t + Math.sin(t * cycles * Math.PI * 2) * amplitude + shake(r, wobble),
    });
  }
  return pts;
}

function arc(center: Point, radii: { rx: number; ry: number }, sweep: { from: number; to: number }, opts: { wobble?: number; steps?: number }, r: () => number) {
  const { wobble = 0.03, steps = 28 } = opts;
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = ((sweep.from + (sweep.to - sweep.from) * t) * Math.PI) / 180;
    const drift = 1 + shake(r, wobble);
    pts.push({ x: center.x + Math.cos(angle) * radii.rx * drift, y: center.y + Math.sin(angle) * radii.ry * drift });
  }
  return pts;
}

type Stroke = { d: string; width?: number; opacity?: number; fill?: boolean };

const wavyStrokes = (): Stroke[] => { const r = createRandom(17); return [{ d: trace(wave({ x: 2, y: 7 }, { x: 138, y: 7 }, { amplitude: 3, cycles: 9 }, r)), width: 2.2 }]; };
const underlineStrokes = (): Stroke[] => { const r = createRandom(23); return [{ d: trace(stroke({ x: 3, y: 6 }, { x: 137, y: 5 }, { sag: -2 }, r)) }]; };
const doubleUnderlineStrokes = (): Stroke[] => { const r = createRandom(41); return [
  { d: trace(stroke({ x: 3, y: 5 }, { x: 137, y: 4 }, { sag: -2 }, r)) },
  { d: trace(stroke({ x: 5, y: 12 }, { x: 135, y: 11 }, { sag: -1.2 }, r)), width: 1.8, opacity: 0.75 },
]; };
const strikethroughStrokes = (): Stroke[] => { const r = createRandom(59); return [{ d: trace(stroke({ x: 3, y: 5 }, { x: 137, y: 5 }, { sag: 1.2 }, r)) }]; };
const crossOutStrokes = (): Stroke[] => { const r = createRandom(73); return [
  { d: trace(stroke({ x: 4, y: 32 }, { x: 136, y: 8 }, { sag: -4, wobble: 1 }, r)) },
  { d: trace(stroke({ x: 6, y: 10 }, { x: 134, y: 30 }, { sag: 4, wobble: 1 }, r)), width: 2, opacity: 0.7 },
]; };
const arrowStrokes = (): Stroke[] => { const r = createRandom(89); return [
  { d: trace(stroke({ x: 3, y: 7 }, { x: 140, y: 8 }, { sag: -2.5 }, r)) },
  { d: trace([{ x: 132, y: 3 }, { x: 142, y: 8 }, { x: 131, y: 13 }]) },
]; };
const circleStrokes = (): Stroke[] => { const r = createRandom(101); return [
  { d: trace(arc({ x: 110, y: 32 }, { rx: 100, ry: 27 }, { from: 150, to: 520 }, { wobble: 0.035 }, r)), width: 3 },
  { d: trace(arc({ x: 110, y: 32 }, { rx: 95, ry: 24 }, { from: 165, to: 480 }, { wobble: 0.03 }, r)), width: 1.5, opacity: 0.55 },
]; };
const boxStrokes = (): Stroke[] => {
  const r = createRandom(127);
  const tl = { x: 12, y: 10 }, tr = { x: 188, y: 10 }, br = { x: 188, y: 54 }, bl = { x: 12, y: 54 };
  const outline = [
    ...stroke(tl, tr, { sag: -3, steps: 8 }, r),
    ...stroke(tr, br, { steps: 4 }, r),
    ...stroke(br, bl, { sag: 3, steps: 8 }, r),
    ...stroke(bl, tl, { steps: 4 }, r),
  ];
  return [{ d: trace(outline, true), width: 2.6 }];
};
const bracketStrokes = (): Stroke[] => { const r = createRandom(149); return [
  { d: trace(arc({ x: 30, y: 30 }, { rx: 24, ry: 34 }, { from: 130, to: 230 }, { steps: 14 }, r)), width: 2.6 },
  { d: trace(arc({ x: 130, y: 30 }, { rx: 24, ry: 34 }, { from: 50, to: -50 }, { steps: 14 }, r)), width: 2.6 },
]; };
const highlightStrokes = (): Stroke[] => {
  const r = createRandom(163);
  const outline = [
    ...stroke({ x: 5, y: 6 }, { x: 165, y: 5 }, { sag: -2, steps: 10 }, r),
    ...stroke({ x: 165, y: 5 }, { x: 165, y: 21 }, { steps: 3 }, r),
    ...stroke({ x: 165, y: 21 }, { x: 5, y: 22 }, { sag: 2, steps: 10 }, r),
    ...stroke({ x: 5, y: 22 }, { x: 5, y: 6 }, { steps: 3 }, r),
  ];
  return [{ d: trace(outline, true), fill: true }];
};

type MarkDef = {
  decoration: React.CSSProperties;
  color: string;
  viewBox?: string;
  strokes?: Stroke[];
  behindText?: boolean;
  padding?: string;
};

const marks: Record<string, MarkDef> = {
  wavy: {
    decoration: { position: "absolute", bottom: "-0.4em", left: "-2%", height: "0.7em", width: "104%", pointerEvents: "none" },
    color: "#c084fc", viewBox: "0 0 140 14", strokes: wavyStrokes(),
  },
  underline: {
    decoration: { position: "absolute", bottom: "-0.32em", left: "-1%", height: "0.5em", width: "102%", pointerEvents: "none" },
    color: "#c084fc", viewBox: "0 0 140 10", strokes: underlineStrokes(),
  },
  doubleUnderline: {
    decoration: { position: "absolute", bottom: "-0.5em", left: "-1%", height: "0.7em", width: "102%", pointerEvents: "none" },
    color: "#34d399", viewBox: "0 0 140 16", strokes: doubleUnderlineStrokes(),
  },
  arrow: {
    decoration: { position: "absolute", bottom: "-0.45em", left: "-1%", height: "0.8em", width: "106%", pointerEvents: "none" },
    color: "#60a5fa", viewBox: "0 0 150 18", strokes: arrowStrokes(),
  },
  circle: {
    decoration: { position: "absolute", top: "-0.6em", left: "-0.55em", height: "calc(100% + 1.2em)", width: "calc(100% + 1.1em)", pointerEvents: "none" },
    color: "#22d3ee", viewBox: "0 0 220 64", strokes: circleStrokes(),
    padding: "0 0.25em",
  },
  box: {
    decoration: { position: "absolute", top: "-0.4em", left: "-0.4em", height: "calc(100% + 0.8em)", width: "calc(100% + 0.8em)", pointerEvents: "none" },
    color: "#fb923c", viewBox: "0 0 200 64", strokes: boxStrokes(),
    padding: "0 0.4em",
  },
  bracket: {
    decoration: { position: "absolute", top: "-0.25em", bottom: "-0.25em", left: "-0.15em", height: "calc(100% + 0.5em)", width: "calc(100% + 0.3em)", pointerEvents: "none" },
    color: "#a3a3a3", viewBox: "0 0 160 60", strokes: bracketStrokes(),
    padding: "0 0.35em",
  },
  strikethrough: {
    decoration: { position: "absolute", top: "50%", left: "-1%", height: "0.5em", width: "102%", pointerEvents: "none", transform: "translateY(-50%)" },
    color: "#f87171", viewBox: "0 0 140 10", strokes: strikethroughStrokes(),
  },
  crossOut: {
    decoration: { position: "absolute", top: "50%", left: "-2%", height: "1.4em", width: "104%", pointerEvents: "none", transform: "translateY(-50%)" },
    color: "#f87171", viewBox: "0 0 140 40", strokes: crossOutStrokes(),
  },
  highlight: {
    decoration: { position: "absolute", top: "-0.08em", left: "-4%", bottom: 0, height: "1.15em", width: "108%", pointerEvents: "none", zIndex: 0 },
    color: "#fde04799", viewBox: "0 0 170 26", strokes: highlightStrokes(), behindText: true,
  },
};

export type AnnotationVariant = keyof typeof marks;

export interface AnnotatedTextProps {
  children: ReactNode;
  variant?: AnnotationVariant;
  color?: string;
  animate?: boolean;
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnnotatedText({
  children, variant = "wavy", color, className,
  animate = true, delay = 0, duration = 0.65,
}: AnnotatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || !animate || rm.matches) return;

    const drawings = el.querySelectorAll("[data-annotation-drawing]");
    const anims = Array.from(drawings, (d, i) => {
      const reveal = d.getAttribute("data-annotation-drawing") === "reveal";
      const op = Number(d.getAttribute("opacity") ?? 1);
      const a = (d as SVGElement | HTMLElement).animate(
        reveal
          ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }]
          : [
              { strokeDasharray: "1", strokeDashoffset: "1", opacity: 0, offset: 0 },
              { strokeDasharray: "1", strokeDashoffset: "0.999", opacity: op, offset: 0.001 },
              { strokeDasharray: "1", strokeDashoffset: "0", opacity: op, offset: 1 },
            ],
        {
          duration: Math.max(0, duration) * 1000,
          delay: Math.max(0, delay) * 1000 + i * 160,
          easing: "cubic-bezier(0.22,0.61,0.36,1)",
          fill: "backwards",
        },
      );
      a.pause();
      return a;
    });

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        anims.forEach((a) => a.play());
        obs.disconnect();
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      anims.forEach((a) => a.cancel());
    };
  }, [animate, delay, duration, variant]);

  const mark = marks[variant];
  const strokeColor = color ?? mark.color;

  return (
    <span
      ref={ref}
      className={className}
      style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap", padding: mark.padding }}
    >
      {mark.behindText ? <span style={{ position: "relative", zIndex: 1 }}>{children}</span> : children}
      <svg
        style={{ ...mark.decoration, color: strokeColor, overflow: "visible" }}
        viewBox={mark.viewBox}
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {mark.strokes?.map((line) => (
          <path
            key={line.d}
            d={line.d}
            pathLength={1}
            data-annotation-drawing={line.fill ? "reveal" : "stroke"}
            fill={line.fill ? "currentColor" : "none"}
            stroke={line.fill ? "none" : "currentColor"}
            strokeWidth={line.fill ? undefined : (line.width ?? 2.4)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={line.opacity}
          />
        ))}
      </svg>
    </span>
  );
}
