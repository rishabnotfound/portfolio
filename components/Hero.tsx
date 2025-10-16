'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Code2, ChevronDown, Instagram, Linkedin } from 'lucide-react';
import Typewriter from 'typewriter-effect';
import { contact_mail, github_username, instagram_username, leetcode_username, name } from '@/config';
import ParallaxBackground from './ParallaxBackground';

export default function Hero() {

  const scrollToSection = (id: string) => {
    if (typeof document !== 'undefined') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" id="home">
      <ParallaxBackground />

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
              <span className="text-gray-700 text-lg sm:text-xl">Hey, I&apos;m</span>
            </motion.div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6">
              <span className="gradient-text inline-block">
                <Typewriter
                  options={{
                    strings: [name],
                    autoStart: true,
                    loop: true,
                    deleteSpeed: 50,
                    delay: 100,
                  }}
                />
              </span>
            </h1>

            <motion.p
              className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Full-Stack Developer | Backend Specialist | Reverse Engineer
            </motion.p>

            <motion.div
              className="text-base sm:text-lg text-gray-300 mb-8 max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p>• Breaking down complex systems</p>
              <p>• Web scraping & automation</p>
              <p>• Cryptography & security</p>
            </motion.div>

            <motion.div
              className="flex gap-4 items-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <a
                href={`https://github.com/${github_username}`}
                draggable={false}
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-3 rounded-full hover:bg-red-500/20 transition-all neon-glow group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={`https://linkedin.com/in/${leetcode_username}`}
                draggable={false}
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-3 rounded-full hover:bg-yellow-500/20 transition-all neon-glow group"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={`https://instagram.com/${instagram_username}`}
                draggable={false}
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-3 rounded-full hover:bg-yellow-500/20 transition-all neon-glow group"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={`mailto:${contact_mail}`}
                draggable={false}
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
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full font-semibold hover:scale-105 transition-all neon-glow"
              >
                View My Work
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-8 py-3 glass rounded-full font-semibold hover:bg-white/10 transition-all"
              >
                Get In Touch
              </button>
              <button
                onClick={() => (window.location.href = "/resume/doc.pdf")}
                className="px-8 py-3 glass rounded-full font-semibold hover:bg-white/10 transition-all"
              >
                Resume
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
