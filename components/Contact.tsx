'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Github, Send, CheckCircle, Code2 } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    // Simulate sending (in a real app, this would be an API call)
    setTimeout(() => {
      setStatus('sent');
      setTimeout(() => {
        setStatus('idle');
        setFormData({ name: '', email: '', message: '' });
      }, 3000);
    }, 1500);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative flex items-center"
      id="contact"
    >
      <div className="max-w-6xl mx-auto w-full">
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
            Have a project in mind or want to collaborate? Feel free to reach out!
          </p>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-3xl font-bold mb-6 text-white">
                  Let&apos;s Connect
                </h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  I&apos;m always interested in hearing about new projects and
                  opportunities. Whether you have a question or just want to say
                  hi, I&apos;ll try my best to get back to you!
                </p>
              </div>

              <div className="space-y-6">
                <motion.a
                  href="mailto:itzrishabboss@gmail.com"
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="flex items-center gap-4 glass-dark p-4 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="text-white font-medium">
                      itzrishabboss@gmail.com
                    </div>
                  </div>
                </motion.a>

                <motion.a
                  href="https://github.com/rishabnotfound"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="flex items-center gap-4 glass-dark p-4 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
                    <Github className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">GitHub</div>
                    <div className="text-white font-medium">@rishabnotfound</div>
                  </div>
                </motion.a>

                <motion.a
                  href="https://leetcode.com/rishabnotfound"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="flex items-center gap-4 glass-dark p-4 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="p-3 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-all">
                    <Code2 className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">LeetCode</div>
                    <div className="text-white font-medium">@rishabnotfound</div>
                  </div>
                </motion.a>
              </div>

              {/* Decorative element */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="hidden lg:block w-64 h-64 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20" />
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 glass-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 glass-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 glass-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500 resize-none"
                    placeholder="Your message..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={status !== 'idle'}
                  whileHover={{ scale: status === 'idle' ? 1.05 : 1 }}
                  whileTap={{ scale: status === 'idle' ? 0.95 : 1 }}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    status === 'sent'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed neon-glow`}
                >
                  {status === 'idle' && (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                  {status === 'sending' && (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                      Sending...
                    </>
                  )}
                  {status === 'sent' && (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Message Sent!
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
