'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Award, Code, Trophy, Target } from 'lucide-react';

interface GitHubStats {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
}

interface LeetCodeStats {
  ranking: number;
  totalSolved: number;
  reputation: number;
}

export default function DynamicStats() {
  const [githubStats, setGithubStats] = useState<GitHubStats>({ totalRepos: 0, totalStars: 0, totalForks: 0 });
  const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats>({ ranking: 0, totalSolved: 0, reputation: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch GitHub stats
    Promise.all([
      fetch('/api/github').then(res => res.json()),
      fetch('/api/leetcode_profile').then(res => res.json())
    ])
      .then(([githubData, leetcodeData]) => {
        // Calculate GitHub stats
        const totalStars = githubData.reduce((sum: number, repo: any) => sum + (repo.stars || 0), 0);
        const totalForks = githubData.reduce((sum: number, repo: any) => sum + (repo.forks || 0), 0);

        // Fetch all repos for accurate count
        fetch('https://api.github.com/users/rishabnotfound/repos?per_page=100')
          .then(res => res.json())
          .then(allRepos => {
            const nonForkedRepos = allRepos.filter((repo: any) => !repo.fork && !repo.archived);

            setGithubStats({
              totalRepos: nonForkedRepos.length,
              totalStars,
              totalForks
            });
          });

        setLeetcodeStats({
          ranking: leetcodeData.ranking || 0,
          totalSolved: leetcodeData.totalSolved || 0,
          reputation: leetcodeData.reputation || 0
        });

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const stats = [
    {
      icon: Github,
      label: 'GitHub Projects',
      value: loading ? '...' : githubStats.totalRepos,
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30'
    },
    {
      icon: Target,
      label: 'Total Stars',
      value: loading ? '...' : githubStats.totalStars,
      color: 'from-yellow-500 to-orange-500',
      borderColor: 'border-yellow-500/30'
    },
    {
      icon: Award,
      label: 'LeetCode Rank',
      value: loading ? '...' : `#${leetcodeStats.ranking.toLocaleString()}`,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30'
    },
    {
      icon: Code,
      label: 'Problems Solved',
      value: loading ? '...' : leetcodeStats.totalSolved,
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500/30'
    },
    {
      icon: Trophy,
      label: 'LeetCode Rep',
      value: loading ? '...' : leetcodeStats.reputation,
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-500/30'
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className={`glass-dark rounded-2xl p-6 text-center hover:bg-white/5 transition-all border ${stat.borderColor} relative overflow-hidden group`}
        >
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

          <div className="relative z-10">
            <div className="flex justify-center mb-3">
              <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`
                }} />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
              {stat.value}
            </div>

            <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-medium">
              {stat.label}
            </div>
          </div>

          {/* Decorative corner */}
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
        </motion.div>
      ))}
    </div>
  );
}
