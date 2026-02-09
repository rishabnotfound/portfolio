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

    // Load Poppins font for canvas
    const loadFont = async () => {
      const font = new FontFace(
        'Poppins',
        'url(https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1JlFc-K.woff2)',
        { weight: '900' }
      );

      try {
        await font.load();
        document.fonts.add(font);
      } catch (e) {
        console.warn('Font loading failed, using fallback');
      }

      startAnimation();
    };

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animationFrame: number;

    const startAnimation = () => {
      const startTime = Date.now();
      const duration = 7500;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Animation phases:
        // 0-15%: Fade in and slight scale up
        // 15-40%: Hold steady for dramatic pause
        // 40-92%: Cinematic zoom into C hollow
        // 92-100%: Final zoom and fade out

        let scale: number;
        let opacity: number;

        if (progress < 0.15) {
          // Phase 1: Fade in with gentle scale
          const t = progress / 0.15;
          const easeOut = 1 - Math.pow(1 - t, 3);
          scale = 0.6 + easeOut * 0.4;
          opacity = easeOut;
        } else if (progress < 0.40) {
          // Phase 2: Hold steady - dramatic pause
          scale = 1;
          opacity = 1;
        } else if (progress < 0.92) {
          // Phase 3: Cinematic zoom into the C hollow
          const t = (progress - 0.40) / 0.52;
          // Custom easing: slow start, accelerate, then slow at end
          const easeT = t < 0.3
            ? (t / 0.3) * (t / 0.3) * 0.15
            : 0.15 + (1 - Math.pow(1 - ((t - 0.3) / 0.7), 2.5)) * 0.85;

          scale = 1 + easeT * 79;
          opacity = 1;
        } else {
          // Phase 4: Final zoom with fade
          const t = (progress - 0.92) / 0.08;
          scale = 80 + t * 20;
          opacity = 1 - t;
        }

        // Only render if visible
        if (opacity <= 0) {
          if (progress >= 1) {
            setIsAnimating(false);
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          return;
        }

        // Fill black background (only when not zoomed too far)
        if (scale < 70) {
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();

        // Setup font - Poppins for clean strokes
        const baseFontSize = Math.min(canvas.width * 0.15, 220);
        ctx.font = `900 ${baseFontSize}px Poppins, sans-serif`;

        // Set letter spacing before measuring
        const letterSpacingEm = 0.08;
        ctx.letterSpacing = `${letterSpacingEm}em`;

        // Calculate the position of the C's hollow opening
        // The C letter has its hollow opening on the RIGHT side
        const text = 'WELCOME';

        // Measure with letter spacing applied
        const fullTextWidth = ctx.measureText(text).width;
        const welWidth = ctx.measureText('WEL').width;
        const cWidth = ctx.measureText('C').width;

        // Text is centered at (0,0), so left edge is at -fullTextWidth/2
        // C starts after "WEL" + letter spacing gap
        // Target the CENTER of C's hollow (inner left vertical curve)
        const cLeftEdge = -fullTextWidth / 2 + welWidth;
        const cHollowX = cLeftEdge + cWidth * 0.17; // Center of C's hollow (inner curve)
        const cHollowY = 0; // Center vertically in the hollow

        // Apply transforms - zoom INTO the C hollow point
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Complete the shift EARLY when scale is small (tiny pixel movement)
        // Then it's locked on C before the big zoom happens
        const t = Math.min((scale - 1) / 6.7, 1); // finishes by scale ~2.2 //SHOULD HAVE BEEN 1.2 tbh
        const offsetRatio = 1 - Math.pow(1 - t, 2); // ease-out - fast start, done quickly
        const pivotX = centerX - cHollowX * scale * offsetRatio;
        const pivotY = centerY - cHollowY * scale * offsetRatio;

        ctx.translate(pivotX, pivotY);
        ctx.scale(scale, scale);

        // Draw text with refined styling
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Create the cutout effect - text punches through black
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillText(text, 0, 0);

        // Add elegant stroke outline
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Subtle glow effect
        ctx.shadowColor = `rgba(255, 255, 255, ${opacity * 0.4})`;
        ctx.shadowBlur = 15;
        ctx.strokeText(text, 0, 0);

        ctx.restore();

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animate();
    };

    loadFont();

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
