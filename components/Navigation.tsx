'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, User, Briefcase, Mail } from 'lucide-react';
import { navbar_title } from '@/config';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveSection(id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHomePage) return;

    const activeNav = navRefs.current[activeSection];
    if (activeNav) {
      const { offsetLeft, offsetWidth } = activeNav;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeSection, isHomePage]);

  useEffect(() => {
    if (!isHomePage) return;

    // Initialize indicator position on mount
    setTimeout(() => {
      const activeNav = navRefs.current[activeSection];
      if (activeNav) {
        const { offsetLeft, offsetWidth } = activeNav;
        setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
      }
    }, 100);
  }, [isHomePage]);

  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href={isHomePage ? "#home" : "/"} className="text-2xl font-bold gradient-text">
              {navbar_title}
            </a>
          </div>
        </div>
      </nav>
    );
  }

  const navItems = [
    { name: 'Home', href: '#home', icon: Home },
    { name: 'About', href: '#about', icon: User },
    { name: 'Skills', href: '#skills', icon: Briefcase },
    { name: 'Projects', href: '#projects', icon: Briefcase },
    { name: 'Contact', href: '#contact', icon: Mail },
  ];

  const scrollToSection = (href: string) => {
    if (typeof document !== 'undefined') {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div
            className={`flex items-center justify-between h-16 px-6 rounded-2xl transition-all duration-300 ${
              scrolled
                ? 'backdrop-blur-md bg-white/5 border border-white/10 shadow-lg shadow-black/20'
                : 'backdrop-blur-sm bg-white/0 border border-white/0'
            }`}
          >
            {/* Logo */}
            <motion.a
              href={isHomePage ? "#home" : "/"}
              onClick={(e) => {
                if (isHomePage) {
                  e.preventDefault();
                  scrollToSection('#home');
                }
              }}
              className="text-2xl font-bold gradient-text"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {navbar_title}
            </motion.a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 relative">
              {/* Animated Oval Indicator - only on home page */}
              {isHomePage && (
                <motion.div
                  className="absolute h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-lg"
                  initial={false}
                  animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              {navItems.map((item) => {
                const sectionId = item.href.replace('#', '');
                const isActive = activeSection === sectionId;
                return (
                  <motion.a
                    key={item.name}
                    ref={(el) => {
                      navRefs.current[sectionId] = el;
                    }}
                    href={isHomePage ? item.href : `/${item.href}`}
                    onClick={(e) => {
                      if (isHomePage) {
                        e.preventDefault();
                        scrollToSection(item.href);
                      }
                    }}
                    className={`relative z-10 px-6 py-2 transition-colors font-medium ${
                      isHomePage && isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.name}
                  </motion.a>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 rounded-lg glass hover:bg-white/10"
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 glass-dark backdrop-blur-xl" />

            <div className="relative h-full flex flex-col items-center justify-center gap-8">
              {navItems.map((item, index) => {
                const sectionId = item.href.replace('#', '');
                const isActive = activeSection === sectionId;
                return (
                  <motion.a
                    key={item.name}
                    href={isHomePage ? item.href : `/${item.href}`}
                    onClick={(e) => {
                      if (isHomePage) {
                        e.preventDefault();
                        scrollToSection(item.href);
                      }
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-center gap-4 text-2xl font-semibold transition-colors"
                    whileHover={{ scale: 1.1, x: 10 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isHomePage && isActive && (
                      <motion.div
                        layoutId="mobile-indicator"
                        className="absolute -inset-4 bg-gradient-to-r from-white/20 to-white/10 rounded-full backdrop-blur-sm border border-white/20"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <item.icon className={`w-8 h-8 relative z-10 ${isHomePage && isActive ? 'text-white' : 'text-gray-300'}`} />
                    <span className={`relative z-10 ${isHomePage && isActive ? 'text-white' : 'text-gray-300'}`}>
                      {item.name}
                    </span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
