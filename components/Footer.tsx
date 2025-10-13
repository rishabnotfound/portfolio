'use client';

import { contact_mail, discord_userid, github_username, leetcode_username, linkedin_username, name, navbar_title } from '@/config';
import { motion } from 'framer-motion';
import { Github, Mail, Code2, Heart, Linkedin, MessageCircle } from 'lucide-react';

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
              {navbar_title}
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
                href={`https://github.com/${github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg hover:bg-white/5 transition-all"
              >
                <Github className="w-5 h-5 text-gray-300" />
              </motion.a>
              <motion.a
                href={`https://linkedin.com/in/${linkedin_username}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg hover:bg-white/5 transition-all"
              >
                <Linkedin className="w-5 h-5 text-gray-300" />
              </motion.a>
              <motion.a
                href={`https://discord.com/users/${discord_userid}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg hover:bg-white/5 transition-all"
              >
                <MessageCircle className="w-5 h-5 text-gray-300" />
              </motion.a>
              <motion.a
                href={`mailto:${contact_mail}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg hover:bg-white/5 transition-all"
              >
                <Mail className="w-5 h-5 text-gray-300" />
              </motion.a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> by {name} © {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
}
