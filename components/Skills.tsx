'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Code2, Database, Cloud, Layout, Server, Wrench, Palette, Package } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

const skillCategories = [
  {
    title: 'Languages',
    icon: Code2,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/30',
    skills: [
      { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
      { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
      { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
      { name: 'Go', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg' },
      { name: 'PHP', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
      { name: 'Lua', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg' },
      { name: 'YAML', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/yaml/yaml-original.svg' },
    ],
  },
  {
    title: 'Frontend Frameworks',
    icon: Layout,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/30',
    skills: [
      { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
      { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
      { name: 'Vue.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
      { name: 'Nuxt.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxtjs-original.svg' },
      { name: 'Three.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/threejs/threejs-original.svg' },
      { name: 'Framer', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/framermotion/framermotion-original.svg' },
      { name: 'jQuery', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-original.svg' },
      { name: 'Vite', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg' },
    ],
  },
  {
    title: 'Styling',
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
    borderColor: 'border-pink-500/30',
    skills: [
      { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
      { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
      { name: 'Tailwind', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
      { name: 'SASS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg' },
      { name: 'PostCSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postcss/postcss-original.svg' },
    ],
  },
  {
    title: 'Backend & APIs',
    icon: Server,
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-500/30',
    skills: [
      { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
      { name: 'Socket.io', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg' },
      { name: 'Nginx', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg' },
      { name: 'JWT', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/json/json-original.svg' },
    ],
  },
  {
    title: 'Databases',
    icon: Database,
    color: 'from-orange-500 to-red-500',
    borderColor: 'border-orange-500/30',
    skills: [
      { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
      { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
      { name: 'Prisma', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg' },
      { name: 'Firebase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg' },
    ],
  },
  {
    title: 'Cloud & Hosting',
    icon: Cloud,
    color: 'from-cyan-500 to-blue-500',
    borderColor: 'border-cyan-500/30',
    skills: [
      { name: 'Google Cloud', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg' },
      { name: 'Vercel', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg' },
      { name: 'Cloudflare', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-original.svg' },
      { name: 'Netlify', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/netlify/netlify-original.svg' },
      { name: 'GitHub Pages', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
      { name: 'Replit', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/replit/replit-original.svg' },
      { name: 'Glitch', icon: 'https://cdn.simpleicons.org/glitch/3333FF/white' },
    ],
  },
  {
    title: 'DevOps & Tools',
    icon: Wrench,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-500/30',
    skills: [
      { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
      { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
      { name: 'GitHub', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg' },
      { name: 'GitHub Actions', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/githubactions/githubactions-original.svg' },
      { name: 'Linux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
      { name: 'Windows', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows11/windows11-original.svg' },
    ],
  },
  {
    title: 'Dev Tools',
    icon: Package,
    color: 'from-indigo-500 to-purple-500',
    borderColor: 'border-indigo-500/30',
    skills: [
      { name: 'npm', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg' },
      { name: 'pnpm', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pnpm/pnpm-original.svg' },
      { name: 'VS Code', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
      { name: 'PyCharm', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pycharm/pycharm-original.svg' },
      { name: 'Android Studio', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/androidstudio/androidstudio-original.svg' },
      { name: 'NixOS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nixos/nixos-original.svg' },
      { name: 'ESLint', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg' },
      { name: 'FFmpeg', icon: 'https://cdn.simpleicons.org/ffmpeg/007808/white' },
      { name: 'WebGL', icon: 'https://cdn.simpleicons.org/webgl/990000/white' },
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const categoryItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section className="min-h-screen py-1 px-4 sm:px-6 lg:px-8 relative" id="skills">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-center">
            <span className="gradient-text">Skills & Expertise</span>
          </h2>
          <p className="text-lg text-gray-400 text-center max-w-2xl mx-auto mb-16">
            A comprehensive overview of technologies and tools I work with
          </p>

          <motion.div
            variants={container}
            initial="hidden"
            animate={isInView ? 'show' : 'hidden'}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {skillCategories.map((category, idx) => (
              <motion.div
                key={category.title}
                variants={categoryItem}
              >
                <Tilt
                  tiltMaxAngleX={10}
                  tiltMaxAngleY={10}
                  scale={1.02}
                  transitionSpeed={2000}
                  perspective={1000}
                  className={`glass-dark rounded-2xl p-6 border ${category.borderColor} hover:border-opacity-100 transition-all group relative overflow-hidden h-full`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} shadow-lg`} style={{ transform: 'translateZ(30px)' }}>
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white" style={{ transform: 'translateZ(25px)' }}>{category.title}</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {category.skills.map((skill, skillIdx) => (
                        <Tilt
                          key={skill.name}
                          tiltMaxAngleX={15}
                          tiltMaxAngleY={15}
                          scale={1.1}
                          transitionSpeed={1500}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl glass hover:bg-white/10 transition-all cursor-pointer group/skill relative"
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${category.color} opacity-0 group-hover/skill:opacity-20 transition-opacity`} />

                          <div className="w-12 h-12 flex items-center justify-center relative z-10" style={{ transform: 'translateZ(40px)' }}>
                            <img
                              src={skill.icon}
                              alt={skill.name}
                              draggable={false}
                              className="w-full h-full object-contain transition-transform group-hover/skill:scale-110 select-none"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/48/1f2937/ffffff?text=' + skill.name[0];
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 group-hover/skill:text-white transition-colors text-center leading-tight relative z-10" style={{ transform: 'translateZ(30px)' }}>
                            {skill.name}
                          </span>
                        </Tilt>
                      ))}
                    </div>
                  </div>

                  {/* Border highlight */}
                  <div className={`absolute inset-0 rounded-2xl border ${category.borderColor} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                </Tilt>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
