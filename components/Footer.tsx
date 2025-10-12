'use client';

import { motion } from 'framer-motion';
import { Github, Mail, Code2, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <motion.h3
              className="text-2xl font-bold gradient-text mb-4"
              whileHover={{ scale: 1.05 }}
            >
              {'<Rishab />'}
            </motion.h3>
            <p className="text-gray-400 text-sm">
              Full Stack Developer crafting amazing web experiences with modern
              technologies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'About', 'Projects', 'Contact'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Connect</h4>
            <div className="flex gap-4">
              <motion.a
                href="https://github.com/rishabnotfound"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 glass rounded-full hover:bg-blue-500/20 transition-all"
              >
                <Github className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="https://leetcode.com/rishabnotfound"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 glass rounded-full hover:bg-purple-500/20 transition-all"
              >
                <Code2 className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="mailto:itzrishabboss@gmail.com"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 glass rounded-full hover:bg-pink-500/20 transition-all"
              >
                <Mail className="w-5 h-5" />
              </motion.a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> by
            Rishab © {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
}
