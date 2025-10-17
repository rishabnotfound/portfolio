'use client';

import { useEffect, useRef, useState } from 'react';

export default function ParallaxBackground() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Handle scroll for parallax layers
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollProgress(progress);

      const layers = scene.querySelectorAll<HTMLDivElement>('.parallax-layer');
      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth || '0');

        // Skip scroll parallax for ilu_01.png layer (depth 1.0)
        if (depth === 1.0) return;

        const moveY = scrolled * depth * 0.5;
        const currentTransform = layer.style.transform || '';
        const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        const translateX = translateMatch ? translateMatch[1] : '0px';

        layer.style.transform = `translate(${translateX}, ${moveY}px)`;
      });
    };

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

        const scrolled = window.scrollY;
        // Skip scroll parallax for ilu_01.png layer (depth 1.0)
        const scrollMoveY = depth === 1.0 ? 0 : scrolled * depth * 0.5;

        layer.style.transform = `translate(${moveXLayer}px, ${moveYLayer + scrollMoveY}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        filter: `blur(${scrollProgress * 8}px)`,
        opacity: Math.max(0.2, 1 - scrollProgress * 0.8),
        transition: 'filter 0.1s ease-out, opacity 0.1s ease-out'
      }}
    >
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
