'use client';

import { useEffect, useRef } from 'react';

export default function ParallaxBackground() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const moveX = (clientX / innerWidth - 0.5) * 2;
      const moveY = (clientY / innerHeight - 0.5) * 2;

      const layers = scene.querySelectorAll<HTMLDivElement>('.parallax-layer');
      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth || '0');
        const moveXLayer = moveX * depth * 30;
        const moveYLayer = moveY * depth * 30;

        layer.style.transform = `translate(${moveXLayer}px, ${moveYLayer}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={sceneRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="parallax-layer absolute inset-0 transition-transform duration-100 ease-out"
        data-depth="0.1"
        style={{
          backgroundImage: 'url("/layers/ilu_bg.jpg")',
          backgroundPosition: 'bottom center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div
        className="parallax-layer absolute inset-0 transition-transform duration-100 ease-out"
        data-depth="0.2"
        style={{
          backgroundImage: 'url("/layers/ilu_03.png")',
          backgroundPosition: 'left bottom',
          backgroundSize: 'auto',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div
        className="parallax-layer absolute transition-transform duration-100 ease-out"
        data-depth="0.5"
        style={{
          backgroundImage: 'url("/layers/ilu_02.png")',
          backgroundPosition: 'bottom center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          width: '120%',
          height: '120%',
          left: '-10%',
          top: '-10%',
        }}
      />

      <div
        className="parallax-layer absolute transition-transform duration-100 ease-out"
        data-depth="0.8"
        style={{
          backgroundImage: 'url("/layers/ilu_man.png")',
          backgroundPosition: 'right bottom',
          backgroundSize: 'auto 60%',
          backgroundRepeat: 'no-repeat',
          width: '120%',
          height: '120%',
          left: '-10%',
          top: '-10%',
        }}
      />

      <div
        className="parallax-layer absolute transition-transform duration-100 ease-out"
        data-depth="0.85"
        style={{
          backgroundImage: 'url("/layers/ilu_overlay.png")',
          backgroundPosition: 'bottom center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          width: '120%',
          height: '120%',
          left: '-10%',
          top: '-10%',
        }}
      />

      <div
        className="parallax-layer absolute transition-transform duration-100 ease-out"
        data-depth="1.0"
        style={{
          backgroundImage: 'url("/layers/ilu_01.png")',
          backgroundPosition: 'bottom center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          width: '120%',
          height: '120%',
          left: '-10%',
          top: '-15%',
        }}
      />
    </div>
  );
}
