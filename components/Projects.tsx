'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Github, ExternalLink, Star, GitFork, Code2, ArrowRight, GitCommit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Tilt from 'react-parallax-tilt';

interface Repo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  homepage: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  updated_at: string;
  commits?: number;
  image?: string | null;
}

const languageColors: { [key: string]: string } = {
  JavaScript: '#f1e05a',
  TypeScript: '#2b7489',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  PHP: '#4F5D95',
  Lua: '#000080',
};

export default function Projects() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    fetch('/api/github')
      .then((res) => res.json())
      .then((data) => {
        setRepos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching repos:', err);
        setLoading(false);
      });
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative" id="projects">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl sm:text-6xl font-bold text-center mb-6">
            <span className="gradient-text">Featured Projects</span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 text-center max-w-3xl mx-auto mb-16">
            Explore my projects featuring backend systems, automation tools, and complex integrations.
          </p>

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-red-500/20"></div>
              </div>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate={isInView ? 'show' : 'hidden'}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {repos.slice(0, 6).map((repo) => (
                <Tilt
                  key={repo.id}
                  tiltMaxAngleX={5}
                  tiltMaxAngleY={5}
                  perspective={1000}
                  scale={1.02}
                  transitionSpeed={2000}
                  glareEnable={true}
                  glareMaxOpacity={0.1}
                  glareColor="#ff0000"
                  glarePosition="all"
                  glareBorderRadius="16px"
                >
                  <motion.div
                    variants={item}
                    className="glass-dark rounded-2xl overflow-hidden hover:bg-white/5 transition-all group relative border border-white/5 hover:border-red-500/30 flex flex-col h-full"
                  >
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Animated gradient border effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-500/20 blur-xl" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Project Image */}
                    {repo.image ? (
                      <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-black/40 to-black/20">
                        <Image
                          src={repo.image}
                          alt={`${repo.name} preview`}
                          fill
                          className="object-contain group-hover:scale-[1.02] transition-transform duration-500 select-none pointer-events-none"
                          unoptimized
                          draggable={false}
                        />
                        {/* Overlay gradient for better text contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-gradient-to-br from-red-500/10 via-black/40 to-black/20 flex items-center justify-center">
                        <Code2 className="w-16 h-16 text-red-500/30" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      {/* Title */}
                      <div className="flex items-center gap-2 mb-3">
                        <Code2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors truncate">
                          {repo.name}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                        {repo.description || 'An awesome project built with modern technologies'}
                      </p>

                      {/* Topics */}
                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {repo.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                              #{topic}
                            </span>
                          ))}
                          {repo.topics.length > 3 && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-gray-400 border border-white/10">
                              +{repo.topics.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats Bar */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-400 pb-4 border-b border-white/5">
                        {repo.language && (
                          <div className="flex items-center gap-1.5 group/lang">
                            <span
                              className="w-3 h-3 rounded-full ring-2 ring-white/10 group-hover/lang:ring-white/20 transition-all"
                              style={{
                                backgroundColor:
                                  languageColors[repo.language] || '#888',
                              }}
                            />
                            <span className="text-xs font-medium">{repo.language}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 group/stat hover:text-yellow-400 transition-colors">
                          <Star className="w-4 h-4" />
                          <span className="font-semibold">{repo.stars}</span>
                        </div>
                        <div className="flex items-center gap-1 group/stat hover:text-blue-400 transition-colors">
                          <GitFork className="w-4 h-4" />
                          <span className="font-semibold">{repo.forks}</span>
                        </div>
                        {repo.commits && (
                          <div className="flex items-center gap-1 group/stat hover:text-green-400 transition-colors">
                            <GitCommit className="w-4 h-4" />
                            <span className="font-semibold">{repo.commits}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          draggable={false}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 rounded-xl text-sm font-semibold transition-all flex-1 border border-red-500/20 hover:border-red-500/40 group/btn hover:shadow-lg hover:shadow-red-500/20"
                        >
                          <Github className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                          <span>Code</span>
                        </a>
                        {repo.homepage && (
                          <a
                            href={repo.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable={false}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600/10 to-red-700/10 hover:from-red-600/20 hover:to-red-700/20 rounded-xl text-sm font-semibold transition-all flex-1 border border-red-600/20 hover:border-red-600/40 group/btn hover:shadow-lg hover:shadow-red-600/20"
                          >
                            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            <span>Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Tilt>
              ))}
            </motion.div>
          )}

          {/* View More Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-16"
          >
            <Link
              draggable={false}
              href="/repos"
              className="group relative inline-flex items-center gap-3 px-10 py-5 overflow-hidden rounded-2xl font-bold text-white transition-all duration-300"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/80 via-red-700/80 to-red-600/80 bg-[length:200%_100%] animate-gradient" />

              {/* Hover glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/40 via-red-600/40 to-red-500/40 blur-xl" />
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12 group-hover:left-full transition-all duration-1000" />
              </div>

              {/* Content */}
              <span className="relative z-10 flex items-center gap-3 text-lg">
                <Code2 className="w-5 h-5" />
                <span>Explore All Projects</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </span>

              {/* Border glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-red-500/30 group-hover:border-red-400/50 transition-colors" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
