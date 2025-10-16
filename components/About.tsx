'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import DynamicStats from './DynamicStats';
import DiscordProfile from './DiscordProfile';


export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative" id="about">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid lg:grid-cols-[1fr,400px] gap-8 items-start">
            {/* Left Content */}
            <div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6">
                <span className="gradient-text">About Me</span>
              </h2>

              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mb-4 leading-relaxed">
                Full-stack developer passionate about backend development, reverse engineering, web scraping, and cryptography. Better at breaking down how things work.
              </p>
              <p className="text-base sm:text-lg text-gray-400 max-w-3xl mb-16 leading-relaxed">
                Turning complex systems inside-out and crafting robust backend solutions with cutting-edge technology.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <DynamicStats />
              </motion.div>
            </div>

            {/* Right Content - Discord Profile */}
            <div className="lg:sticky lg:top-24">
              <DiscordProfile />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
