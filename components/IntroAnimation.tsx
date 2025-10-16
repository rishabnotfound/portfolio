'use client';

import { useEffect, useState, useRef } from 'react';

export default function IntroAnimation() {
  const [isAnimating, setIsAnimating] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animationFrame: number;
    const startTime = Date.now();
    const duration = 7000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scale - longer zoom duration
      let scale;
      if (progress < 0.15) {
        scale = 0.5 + (progress / 0.15) * 0.5;
      } else if (progress < 0.35) {
        scale = 1;
      } else if (progress < 0.95) {
        const t = (progress - 0.35) / 0.6;
        const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        scale = 1 + easeT * 49;
      } else {
        scale = 50;
      }

      // Calculate opacity - keep visible until end
      let opacity;
      if (progress < 0.15) {
        opacity = progress / 0.15;
      } else {
        opacity = 1;
      }

      // Fill black background first (not scaled) - only if visible
      if (scale < 45) {
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.save();

      // Setup font for measurements
      const fontSize = Math.min(canvas.width * 0.18, 250);
      ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;

      // Calculate position of "C" hollow (opening on right side)
      const welWidth = ctx.measureText('WEL').width;
      const cWidth = ctx.measureText('C').width;
      const halfTextWidth = ctx.measureText('WELCOME').width / 2;

      // C hollow is offset to the right of C center
      const cLeftEdge = welWidth - halfTextWidth;
      const cHollowX = cLeftEdge + (cWidth * 0.15);

      const offsetX = -cHollowX * (scale - 1);

      ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2);
      ctx.scale(scale, scale);

      // Draw text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '0.1em';

      const text = 'WELCOME';

      // Create text cutout effect
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fillText(text, 0, 0);

      // Reset composite operation for stroke
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.95})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 20;
      ctx.strokeText(text, 0, 0);

      ctx.restore();

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  if (!isAnimating) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    />
  );
}
