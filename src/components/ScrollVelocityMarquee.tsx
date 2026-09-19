import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
  wrap,
} from "framer-motion";

interface ScrollVelocityMarqueeProps {
  text: string;
  defaultVelocity?: number;
  className?: string;
}

interface ParallaxProps {
  children: string;
  baseVelocity: number;
  className?: string;
}

function ParallaxText({ children, baseVelocity, className }: ParallaxProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const x = useTransform(baseX, (v) => `${wrap(-12.5, 0, v)}%`);
  const directionFactor = useRef<number>(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", display: "flex", flexWrap: "nowrap", width: "100%" }}>
      <motion.div className={className} style={{ x, display: "flex", whiteSpace: "nowrap" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ display: "block", marginRight: "2.5rem" }}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function ScrollVelocityMarquee({ text, defaultVelocity = 5, className }: ScrollVelocityMarqueeProps) {
  return (
    <section style={{ position: "relative", width: "100%" }}>
      <ParallaxText baseVelocity={defaultVelocity} className={className}>
        {text}
      </ParallaxText>
    </section>
  );
}
