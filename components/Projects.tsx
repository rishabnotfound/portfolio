'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Github, ExternalLink, Star, GitFork, Code2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
            Check out some of my latest work. Each project showcases different skills and technologies.
          </p>

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate={isInView ? 'show' : 'hidden'}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {repos.slice(0, 6).map((repo) => (
                <motion.div
                  key={repo.id}
                  variants={item}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="glass-dark rounded-2xl p-6 hover:bg-white/5 transition-all group relative overflow-hidden border border-white/5 hover:border-red-500/30"
                >
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Code2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors truncate">
                          {repo.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                      {repo.description || 'An awesome project built with modern technologies'}
                    </p>

                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-300 border border-red-500/20"
                          >
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 3 && (
                          <span className="px-2.5 py-1 text-xs rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                            +{repo.topics.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                languageColors[repo.language] || '#888',
                            }}
                          />
                          <span>{repo.language}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{repo.stars}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        <span>{repo.forks}</span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex gap-2 pt-4 border-t border-white/5">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-all flex-1 border border-red-500/20 group/btn"
                      >
                        <Github className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span>Code</span>
                      </a>
                      {repo.homepage && (
                        <a
                          href={repo.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 rounded-lg text-sm font-medium transition-all border border-red-600/20 group/btn"
                        >
                          <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Live</span>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* View More Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-12"
          >
            <Link
              href="/repos"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full font-semibold hover:scale-105 transition-all neon-glow group"
            >
              <span>View More</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
