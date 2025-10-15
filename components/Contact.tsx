'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Github, Linkedin, Instagram } from 'lucide-react';
import { contact_mail, github_username, instagram_username, linkedin_username } from '@/config';
import Tilt from 'react-parallax-tilt';

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const socialLinks = [
    {
      name: 'Email',
      href: `mailto:${contact_mail}`,
      icon: Mail,
      value: contact_mail,
      color: 'from-red-500 to-red-600',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconBgHover: 'group-hover:bg-red-500/30',
      iconColor: 'text-red-400',
    },
    {
      name: 'GitHub',
      href: `https://github.com/${github_username}`,
      icon: Github,
      value: `@${github_username}`,
      color: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-500/30',
      iconBg: 'bg-gray-500/20',
      iconBgHover: 'group-hover:bg-gray-500/30',
      iconColor: 'text-gray-400',
      external: true,
    },
    {
      name: 'LinkedIn',
      href: `https://linkedin.com/in/${linkedin_username}`,
      icon: Linkedin,
      value: `@${linkedin_username}`,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconBgHover: 'group-hover:bg-blue-500/30',
      iconColor: 'text-blue-400',
      external: true,
    },
    {
      name: 'Instagram',
      href: `https://instagram.com/${instagram_username}`,
      icon: Instagram,
      value: `@${instagram_username}`,
      color: 'from-pink-500 to-purple-600',
      borderColor: 'border-pink-500/30',
      iconBg: 'bg-pink-500/20',
      iconBgHover: 'group-hover:bg-pink-500/30',
      iconColor: 'text-pink-400',
      external: true,
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

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative flex items-center"
      id="contact"
    >
      <div className="max-w-5xl mx-auto w-full">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl sm:text-6xl font-bold text-center mb-6">
            <span className="gradient-text">Get In Touch</span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 text-center max-w-3xl mx-auto mb-16">
            Have a project in mind or want to collaborate? Feel free to reach out through any of these platforms!
          </p>

          {/* Social Links Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate={isInView ? 'show' : 'hidden'}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {socialLinks.map((link) => (
              <motion.div key={link.name} variants={item}>
                <Tilt
                  tiltMaxAngleX={5}
                  tiltMaxAngleY={5}
                  scale={1.02}
                  transitionSpeed={2000}
                  perspective={1000}
                >
                  <a
                    href={link.href}
                    draggable={false}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className={`flex items-center gap-4 glass-dark p-6 rounded-xl hover:bg-white/5 transition-all group border ${link.borderColor} relative overflow-hidden`}
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                    {/* Icon */}
                    <div className={`relative z-10 p-3 ${link.iconBg} rounded-lg ${link.iconBgHover} transition-all`}>
                      <link.icon className={`w-6 h-6 ${link.iconColor}`} />
                    </div>

                    {/* Text */}
                    <div className="relative z-10">
                      <div className="text-sm text-gray-400">{link.name}</div>
                      <div className="text-white font-medium">{link.value}</div>
                    </div>
                  </a>
                </Tilt>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
