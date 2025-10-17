'use client';

import { useEffect, useRef } from 'react';

export default function GlobalGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    const gridSize = 50;
    const glowRadius = 200;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    // Wait for layout to be ready
    const initCanvas = () => {
      resizeCanvas();
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initCanvas);

    window.addEventListener('resize', resizeCanvas);

    // Also listen for load event to recalculate after all content loads
    window.addEventListener('load', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: mouseX, y: mouseY } = mouseRef.current;

      // Get actual dimensions
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Draw grid with circular torch glow
      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
          const dx = mouseX - x;
          const dy = mouseY - y;
          const distSq = dx * dx + dy * dy;
          const glowRadiusSq = glowRadius * glowRadius;

          let opacity = 0.05;
          if (mouseX > -100 && distSq < glowRadiusSq) {
            const dist = Math.sqrt(distSq);
            opacity = 0.05 + (1 - dist / glowRadius) * 0.5;
          }

          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 1;

          // Draw segments from this point
          if (x + gridSize <= width) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + gridSize, y);
            ctx.stroke();
          }

          if (y + gridSize <= height) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + gridSize);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('load', resizeCanvas);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-screen h-screen pointer-events-none -z-[5]"
    />
  );
}
