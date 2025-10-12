'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Code2, ChevronDown, Award } from 'lucide-react';
import Typewriter from 'typewriter-effect';

export default function Hero() {
  const [Scene3DComponent, setScene3DComponent] = useState<any>(null);

  useEffect(() => {
    // Load Scene3D only on client side
    import('./Scene3D').then((mod) => {
      setScene3DComponent(() => mod.default);
    });
  }, []);

  const scrollToSection = (id: string) => {
    if (typeof document !== 'undefined') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" id="home">
      {Scene3DComponent && <Scene3DComponent />}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <span className="text-gray-400 text-lg sm:text-xl">Hi, I&apos;m</span>
            </motion.div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6">
              <span className="gradient-text inline-block">
                <Typewriter
                  options={{
                    strings: ['Rishab'],
                    autoStart: true,
                    loop: true,
                    deleteSpeed: 50,
                    delay: 100,
                  }}
                />
              </span>
            </h1>

            <motion.p
              className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Full Stack Developer crafting exceptional digital experiences
            </motion.p>

            <motion.div
              className="flex gap-4 items-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <a
                href="https://github.com/rishabnotfound"
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-3 rounded-full hover:bg-blue-500/20 transition-all neon-glow group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://leetcode.com/rishabnotfound"
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-3 rounded-full hover:bg-yellow-500/20 transition-all neon-glow group"
              >
                <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="mailto:itzrishabboss@gmail.com"
                className="glass p-3 rounded-full hover:bg-pink-500/20 transition-all neon-glow group"
              >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <button
                onClick={() => scrollToSection('projects')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold hover:scale-105 transition-all neon-glow"
              >
                View My Work
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-8 py-3 glass rounded-full font-semibold hover:bg-white/10 transition-all"
              >
                Get In Touch
              </button>
            </motion.div>
          </motion.div>

          {/* Right Side - 3D Visual Space */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block relative h-96"
          >
            {/* Empty space for 3D scene to show through */}
          </motion.div>
        </div>
      </div>

      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />
    </section>
  );
}
