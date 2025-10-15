'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, GitFork, Code2, ExternalLink, Github, ArrowLeft, Calendar, Eye, GitCommit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Tilt from 'react-parallax-tilt';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { github_username } from '@/config';

const api_github = `https://api.github.com`;

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
  watchers_count: number;
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
  C: '#555555',
  'C++': '#f34b7d',
};

export const dynamic = 'force-dynamic';

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  useEffect(() => {
    fetch('/api/github')
      .then((res) => res.json())
      .then((data) => {
        // Fetch more repos
        fetch(`${api_github}/users/${github_username}/repos?per_page=100&sort=updated`)
          .then((res) => res.json())
          .then(async (allRepos) => {
            const filteredRepos = allRepos.filter((repo: any) => !repo.fork && !repo.archived);

            // Fetch commit counts and README images for each repo
            const formatted = await Promise.all(
              filteredRepos.map(async (repo: any) => {
                try {
                  const commitsResponse = await fetch(
                    `${api_github}/repos/${github_username}/${repo.name}/commits?per_page=1`
                  );

                  let commitCount = 0;
                  if (commitsResponse.ok) {
                    const linkHeader = commitsResponse.headers.get('Link');
                    if (linkHeader) {
                      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
                      commitCount = match ? parseInt(match[1]) : 1;
                    } else {
                      const commits = await commitsResponse.json();
                      commitCount = commits.length;
                    }
                  }

                  // Fetch README to extract image
                  let imageUrl = null;
                  try {
                    const readmeResponse = await fetch(
                      `${api_github}/repos/${github_username}/${repo.name}/readme`
                    );

                    if (readmeResponse.ok) {
                      const readmeData = await readmeResponse.json();
                      const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');

                      // Extract first image from markdown
                      const markdownImageMatch = readmeContent.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
                      const htmlImageMatch = readmeContent.match(/src=["'](https?:\/\/[^"']+)["']/);

                      if (markdownImageMatch) {
                        imageUrl = markdownImageMatch[1];
                      } else if (htmlImageMatch) {
                        imageUrl = htmlImageMatch[1];
                      }
                    }
                  } catch (readmeError) {
                    // Continue without image
                  }

                  return {
                    id: repo.id,
                    name: repo.name,
                    description: repo.description,
                    html_url: repo.html_url,
                    homepage: repo.homepage,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    language: repo.language,
                    topics: repo.topics || [],
                    updated_at: repo.updated_at,
                    watchers_count: repo.watchers_count,
                    commits: commitCount,
                    image: imageUrl,
                  };
                } catch (error) {
                  return {
                    id: repo.id,
                    name: repo.name,
                    description: repo.description,
                    html_url: repo.html_url,
                    homepage: repo.homepage,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    language: repo.language,
                    topics: repo.topics || [],
                    updated_at: repo.updated_at,
                    watchers_count: repo.watchers_count,
                    commits: 0,
                    image: null,
                  };
                }
              })
            );

            setRepos(formatted);
            setFilteredRepos(formatted);
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = repos;

    if (searchQuery) {
      filtered = filtered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.topics.some((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedLanguage !== 'All') {
      filtered = filtered.filter((repo) => repo.language === selectedLanguage);
    }

    setFilteredRepos(filtered);
  }, [searchQuery, selectedLanguage, repos]);

  const languages = ['All', ...new Set(repos.map((r) => r.language).filter(Boolean))];

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >


          <h1 className="text-5xl sm:text-6xl font-bold mb-4">
            <span className="gradient-text">All Repositories</span>
          </h1>
          <p className="text-lg text-gray-400">
            Explore all my projects on GitHub
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 glass-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            />
          </div>

          {/* Language Filter */}
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedLanguage === lang
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : 'glass hover:bg-white/10 text-gray-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="text-gray-400 text-sm">
            Showing {filteredRepos.length} of {repos.length} repositories
          </div>
        </motion.div>

        {/* Repositories Grid */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRepos.map((repo, index) => (
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
                        className="object-contain group-hover:scale-[1.02] transition-transform duration-500"
                        unoptimized
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
                      {repo.description || 'No description available'}
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

                    {/* Updated Date & Action Buttons */}
                    <div className="space-y-3">
                      <span className="text-xs text-gray-500 block">
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
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
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600/10 to-red-700/10 hover:from-red-600/20 hover:to-red-700/20 rounded-xl text-sm font-semibold transition-all flex-1 border border-red-600/20 hover:border-red-600/40 group/btn hover:shadow-lg hover:shadow-red-600/20"
                          >
                            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            <span>Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tilt>
            ))}
          </motion.div>
        )}

        {!loading && filteredRepos.length === 0 && (
          <div className="text-center py-20">
            <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No repositories found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </main>
      <Footer />
    </>
  );
}
