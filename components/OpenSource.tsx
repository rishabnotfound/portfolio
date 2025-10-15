'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Github, ExternalLink, GitPullRequest, Code2 } from 'lucide-react';
import Image from 'next/image';
import { openSourceContributions } from '@/config';

interface Contribution {
  id: number;
  repoName: string;
  repoUrl: string;
  pullRequestUrl: string;
  pullRequestNumber: number;
  description: string;
  logo: string;
  logoAlt: string;
}

export default function OpenSource() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative" id="opensource">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl sm:text-6xl font-bold text-center mb-6">
            <span className="gradient-text">OpenSource Contributions</span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 text-center max-w-3xl mx-auto mb-16">
            Contributing to the open-source community. Here are some of my merged pull requests to major projects.
          </p>

          <motion.div
            variants={container}
            initial="hidden"
            animate={isInView ? 'show' : 'hidden'}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {openSourceContributions.map((contribution) => (
              <motion.div
                key={contribution.id}
                variants={item}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-dark rounded-2xl p-6 hover:bg-white/5 transition-all group relative overflow-hidden border border-white/5 hover:border-red-500/30"
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  {/* Logo */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center p-3 border border-white/10 group-hover:border-red-500/30 transition-colors">
                      <Image
                        src={contribution.logo}
                        alt={contribution.logoAlt}
                        width={80}
                        height={80}
                        className="object-contain select-none pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  </div>

                  {/* Repo Name */}
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {contribution.repoName}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 min-h-[60px]">
                    {contribution.description}
                  </p>

                  {/* Pull Request Info */}
                  <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                    <GitPullRequest className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-300 font-medium">
                      PR #{contribution.pullRequestNumber}
                    </span>
                    <span className="ml-auto text-xs text-red-400 font-semibold">MERGED</span>
                  </div>

                  {/* Links */}
                  <div className="flex gap-2">
                    <a
                      href={contribution.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-all flex-1 border border-red-500/20 group/btn"
                    >
                      <Github className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      <span>Repo</span>
                    </a>
                    <a
                      href={contribution.pullRequestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 rounded-lg text-sm font-medium transition-all flex-1 border border-red-600/20 group/btn"
                    >
                      <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      <span>PR</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
