'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import DynamicStats from './DynamicStats';
import DiscordProfile from './DiscordProfile';

const skills = [
  { name: 'Next.js', badge: 'https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white' },
  { name: 'React', badge: 'https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB' },
  { name: 'Node.js', badge: 'https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white' },
  { name: 'TypeScript', badge: 'https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white' },
  { name: 'JavaScript', badge: 'https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black' },
  { name: 'Python', badge: 'https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white' },
  { name: 'MongoDB', badge: 'https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white' },
  { name: 'PostgreSQL', badge: 'https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white' },
  { name: 'Prisma', badge: 'https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white' },
  { name: 'Firebase', badge: 'https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black' },
  { name: 'Docker', badge: 'https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white' },
  { name: 'Three.js', badge: 'https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white' },
  { name: 'Tailwind CSS', badge: 'https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white' },
  { name: 'Vue.js', badge: 'https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white' },
  { name: 'Nuxt.js', badge: 'https://img.shields.io/badge/Nuxt.js-00DC82?style=for-the-badge&logo=nuxtdotjs&logoColor=white' },
  { name: 'Socket.io', badge: 'https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white' },
  { name: 'Nginx', badge: 'https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white' },
  { name: 'Git', badge: 'https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white' },
  { name: 'GitHub Actions', badge: 'https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white' },
  { name: 'Vercel', badge: 'https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white' },
  { name: 'Google Cloud', badge: 'https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white' },
  { name: 'Cloudflare', badge: 'https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white' },
  { name: 'Vite', badge: 'https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white' },
  { name: 'Golang', badge: 'https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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
                18-year-old full-stack developer with a passion for cryptography and open source. I&apos;ve contributed to numerous open source repositories and built multiple famous websites used by millions.
              </p>
              <p className="text-base sm:text-lg text-gray-400 max-w-3xl mb-16 leading-relaxed">
                Turning complex problems into elegant solutions using cutting-edge technology.
              </p>

              <h3 className="text-3xl sm:text-4xl font-bold mb-12">
                <span className="text-white">Tech Stack</span>
              </h3>

              <motion.div
                variants={container}
                initial="hidden"
                animate={isInView ? 'show' : 'hidden'}
                className="flex flex-wrap gap-3 max-w-5xl mb-16"
              >
                {skills.map((skill) => (
                  <motion.div
                    key={skill.name}
                    variants={item}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="transition-all"
                  >
                    <img
                      src={skill.badge}
                      alt={skill.name}
                      className="h-8 hover:shadow-lg hover:shadow-blue-500/20 transition-shadow"
                    />
                  </motion.div>
                ))}
              </motion.div>

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
