import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface TextMorphProps {
  words?: string[];
  interval?: number;
  morphDuration?: number;
  className?: string;
}

const DEFAULT_WORDS = ["IMAGINE", "REFINE", "RELEASE"];
const MORPH_BLUR = 12;
const MORPH_THRESHOLD = 18;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return reduced;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smoothstep = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};

function setLayerStyles(el: HTMLSpanElement, opacity: number, blur: number, scale: number) {
  el.style.opacity = opacity.toFixed(4);
  el.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : "none";
  el.style.transform = `translateX(-50%) scale(${scale.toFixed(4)})`;
}

export function TextMorph({
  words = DEFAULT_WORDS,
  interval = 2600,
  morphDuration = 680,
  className,
}: TextMorphProps) {
  const values = useMemo(() => {
    const f = words.filter((w) => w.trim().length > 0);
    return f.length > 0 ? f : DEFAULT_WORDS;
  }, [words]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentLayerRef = useRef<HTMLSpanElement>(null);
  const nextLayerRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);
  const holdTimerRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<number | undefined>(undefined);
  const morphingRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const reactId = useId().replace(/:/g, "");
  const filterId = `text-morph-threshold-${reactId}`;

  const safeIndex = currentIndex % values.length;
  const nextIndex = (safeIndex + 1) % values.length;
  const currentWord = values[safeIndex]!;
  const nextWord = values[nextIndex]!;
  const thresholdOffset = -MORPH_THRESHOLD * 0.46;

  const measureStage = useCallback(
    (target: "current" | "next", immediate = false) => {
      const stage = stageRef.current;
      const layer = target === "current" ? currentLayerRef.current : nextLayerRef.current;
      if (!stage || !layer) return;
      const width = layer.offsetWidth;
      const height = layer.offsetHeight;
      if (immediate || reducedMotion) {
        const prev = stage.style.transition;
        stage.style.transition = "none";
        stage.style.width = `${width}px`;
        stage.style.height = `${height}px`;
        void stage.offsetWidth;
        stage.style.transition = prev;
        return;
      }
      stage.style.width = `${width}px`;
      stage.style.height = `${height}px`;
    },
    [reducedMotion],
  );

  useLayoutEffect(() => {
    const cur = currentLayerRef.current;
    const nxt = nextLayerRef.current;
    const stage = stageRef.current;
    if (!cur || !nxt || !stage) return;
    setLayerStyles(cur, 1, 0, 1);
    setLayerStyles(nxt, 0, reducedMotion ? 0 : MORPH_BLUR, 0.992);
    cur.style.willChange = "auto";
    nxt.style.willChange = "auto";
    stage.style.filter = "none";
    stage.style.transition = reducedMotion
      ? "none"
      : `width ${Math.max(160, morphDuration)}ms cubic-bezier(0.22,1,0.36,1), height ${Math.max(160, morphDuration)}ms cubic-bezier(0.22,1,0.36,1)`;
    measureStage("current", true);
  }, [currentIndex, measureStage, morphDuration, reducedMotion, values]);

  useEffect(() => {
    const cur = currentLayerRef.current;
    const nxt = nextLayerRef.current;
    if (!cur || !nxt) return;
    const ro = new ResizeObserver(() => {
      if (!morphingRef.current) measureStage("current", true);
    });
    ro.observe(cur);
    ro.observe(nxt);
    return () => ro.disconnect();
  }, [measureStage]);

  const beginMorph = useCallback(() => {
    const cur = currentLayerRef.current;
    const nxt = nextLayerRef.current;
    const stage = stageRef.current;
    if (!cur || !nxt || !stage || morphingRef.current || values.length < 2) return;

    morphingRef.current = true;
    cur.style.willChange = "opacity, filter, transform";
    nxt.style.willChange = "opacity, filter, transform";
    stage.style.filter = reducedMotion ? "none" : `url(#${filterId})`;
    measureStage("next");

    const startedAt = performance.now();
    const dur = reducedMotion ? 140 : Math.max(240, morphDuration);

    const render = (now: number) => {
      const progress = clamp((now - startedAt) / dur);
      const eased = smoothstep(progress);
      if (reducedMotion) {
        setLayerStyles(cur, 1 - eased, 0, 1);
        setLayerStyles(nxt, eased, 0, 1);
      } else {
        const incoming = smoothstep(clamp(progress / 0.82));
        const outgoing = smoothstep(clamp((progress - 0.18) / 0.82));
        setLayerStyles(cur, Math.pow(1 - outgoing, 0.55), MORPH_BLUR * outgoing, 1 - outgoing * 0.012);
        setLayerStyles(nxt, Math.pow(incoming, 0.55), MORPH_BLUR * (1 - incoming), 0.988 + incoming * 0.012);
      }
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(render);
        return;
      }
      stage.style.filter = "none";
      cur.style.willChange = "auto";
      nxt.style.willChange = "auto";
      morphingRef.current = false;
      setCurrentIndex(nextIndex);
    };

    frameRef.current = window.requestAnimationFrame(render);
  }, [filterId, measureStage, morphDuration, nextIndex, reducedMotion, values.length]);

  useEffect(() => {
    if (values.length < 2) return;
    holdTimerRef.current = window.setTimeout(beginMorph, Math.max(400, interval));
    return () => {
      if (holdTimerRef.current !== undefined) window.clearTimeout(holdTimerRef.current);
    };
  }, [beginMorph, currentIndex, interval, values.length]);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== undefined) window.clearTimeout(holdTimerRef.current);
      if (frameRef.current !== undefined) window.cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  useEffect(() => {
    if (currentIndex < values.length) return;
    setCurrentIndex(0);
  }, [currentIndex, values.length]);

  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-block", maxWidth: "100%", verticalAlign: "baseline" }}
      aria-label={currentWord}
      aria-live="off"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${MORPH_THRESHOLD} ${thresholdOffset}`}
              result="thresholded"
            />
            <feComposite in="SourceGraphic" in2="thresholded" operator="atop" />
          </filter>
        </defs>
      </svg>

      <span
        ref={stageRef}
        aria-hidden="true"
        style={{ position: "relative", display: "block", minWidth: 0, maxWidth: "100%", userSelect: "none" }}
      >
        <span
          ref={currentLayerRef}
          style={{
            position: "absolute", left: "50%", top: 0, display: "block",
            width: "max-content", whiteSpace: "pre",
            transform: "translateX(-50%)", transformOrigin: "center",
          }}
        >
          {currentWord}
        </span>
        <span
          ref={nextLayerRef}
          style={{
            position: "absolute", left: "50%", top: 0, display: "block",
            width: "max-content", whiteSpace: "pre", opacity: 0,
            filter: `blur(${MORPH_BLUR}px)`,
            transform: "translateX(-50%) scale(0.992)", transformOrigin: "center",
          }}
        >
          {nextWord}
        </span>
      </span>
    </span>
  );
}

export default TextMorph;
