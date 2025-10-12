'use client';

import { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function VideoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  // Generate particle positions once to avoid hydration issues
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: (i * 37) % 100, // Deterministic position
      top: (i * 53) % 100,
      duration: 2 + (i % 3),
      delay: (i % 5) * 0.4,
    }));
  }, []);

  const codeSnippets = [
    {
      title: 'Next.js App Router',
      code: `export default function Page() {
  return <div>Hello World</div>
}`,
      language: 'TypeScript',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'React Three Fiber',
      code: `<Canvas>
  <ambientLight />
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>
</Canvas>`,
      language: 'JSX',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Tailwind CSS',
      code: `<div className="flex items-center
  justify-center bg-gradient-to-r
  from-blue-500 to-purple-500">
</div>`,
      language: 'HTML',
      color: 'from-teal-500 to-green-500',
    },
  ];

  return (
    <section
      ref={containerRef}
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative flex items-center justify-center overflow-hidden"
    >
      <motion.div
        style={{ scale, opacity, y }}
        className="max-w-6xl mx-auto"
      >
        <motion.h2
          className="text-5xl sm:text-6xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="gradient-text">Code in Motion</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {codeSnippets.map((snippet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="glass-dark rounded-xl p-6 relative overflow-hidden group"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${snippet.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{snippet.title}</h3>
                  <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                    {snippet.language}
                  </span>
                </div>

                <pre className="text-sm text-gray-300 bg-black/30 rounded-lg p-4 overflow-x-auto">
                  <code>{snippet.code}</code>
                </pre>

                <motion.div
                  className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full blur-2xl"
                  animate={{
                    background: [
                      'rgba(59, 130, 246, 0.3)',
                      'rgba(139, 92, 246, 0.3)',
                      'rgba(236, 72, 153, 0.3)',
                      'rgba(59, 130, 246, 0.3)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-blue-500 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
