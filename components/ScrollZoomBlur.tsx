'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollZoomBlurProps {
  children: React.ReactNode;
  index: number;
  total: number;
}

export default function ScrollZoomBlur({ children, index, total }: ScrollZoomBlurProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Blur when out of focus, sharp when in focus
  const blur = useTransform(scrollYProgress,
    [0, 0.15, 0.5, 0.85, 1],
    [15, 0, 0, 0, 15]
  );

  return (
    <motion.section
      ref={ref}
      className="scroll-section"
      style={{
        // @ts-ignore - framer motion types
        filter: useTransform(blur, (value) => `blur(${value}px)`),
      }}
    >
      {children}
    </motion.section>
  );
}
