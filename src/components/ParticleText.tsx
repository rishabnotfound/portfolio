import React, { useEffect, useRef } from "react";

export interface ParticleTextProps {
  className?: string;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  particleSize?: number;
  particleDensity?: number;
  dispersionStrength?: number;
  returnSpeed?: number;
  color?: string;
  style?: React.CSSProperties;
}

class Particle {
  x: number; y: number; originX: number; originY: number;
  vx: number; vy: number; size: number; color: string;
  dispersion: number; returnSpd: number;
  constructor(x: number, y: number, size: number, color: string, dispersion: number, returnSpd: number) {
    this.x = x + (Math.random() - 0.5) * 10;
    this.y = y + (Math.random() - 0.5) * 10;
    this.originX = x; this.originY = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
    this.size = size; this.color = color;
    this.dispersion = dispersion; this.returnSpd = returnSpd;
  }
  update(mouseX: number, mouseY: number) {
    const dx = mouseX - this.x, dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const R = 120;
    if (distance < R && mouseX !== -1000 && mouseY !== -1000) {
      const fx = dx / distance, fy = dy / distance;
      const force = (R - distance) / R;
      this.vx -= fx * force * this.dispersion;
      this.vy -= fy * force * this.dispersion;
    }
    this.vx += (this.originX - this.x) * this.returnSpd;
    this.vy += (this.originY - this.y) * this.returnSpd;
    this.vx *= 0.85; this.vy *= 0.85;
    const d = Math.hypot(this.x - this.originX, this.y - this.originY);
    if (d < 1 && Math.random() > 0.95) {
      this.vx += (Math.random() - 0.5) * 0.2;
      this.vy += (Math.random() - 0.5) * 0.2;
    }
    this.x += this.vx; this.y += this.vy;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function ParticleText({
  className, text,
  fontSize = 120,
  fontFamily = "Inter, sans-serif",
  particleSize = 1.5,
  particleDensity = 6,
  dispersionStrength = 15,
  returnSpeed = 0.08,
  color,
  style,
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let mouseX = -1000, mouseY = -1000;
    let w = 0, h = 0;

    const init = () => {
      w = container.clientWidth;
      h = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const cs = window.getComputedStyle(container);
      const textColor = color || cs.color || "#000";
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = textColor;
      const eff = Math.min(fontSize, w * 0.28);
      ctx.font = `900 ${eff}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2);

      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      particles = [];
      const step = Math.max(1, Math.floor(particleDensity * dpr));
      for (let y = 0; y < img.height; y += step) {
        for (let x = 0; x < img.width; x += step) {
          const i = (y * img.width + x) * 4;
          if ((img.data[i + 3] || 0) > 128) {
            particles.push(new Particle(x / dpr, y / dpr, particleSize, textColor, dispersionStrength, returnSpeed));
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) { p.update(mouseX, mouseY); p.draw(ctx); }
      raf = requestAnimationFrame(animate);
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
    };
    const onLeave = () => { mouseX = -1000; mouseY = -1000; };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const r = canvas.getBoundingClientRect();
      mouseX = e.touches[0].clientX - r.left;
      mouseY = e.touches[0].clientY - r.top;
    };

    const t = setTimeout(() => { init(); animate(); }, 100);
    const ro = new ResizeObserver(() => init());
    ro.observe(container);

    // Track cursor globally so particles react even when hovering overlay elements
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    canvas.addEventListener("touchstart", onTouch, { passive: true });
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    canvas.addEventListener("touchend", onLeave);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [text, fontSize, fontFamily, particleSize, particleDensity, dispersionStrength, returnSpeed, color]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", touchAction: "none", ...style }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
