'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, UserPlus, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Hostels', href: '#hostels' },
  { label: 'Help', href: '#faq' },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dynamic branding configurations
  const [siteName, setSiteName] = useState('CampusLink');
  const [logoColor, setLogoColor] = useState('#4a9eff');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Load customizer settings
    const storedSettings = localStorage.getItem('campuslink_customizer_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.siteName) setSiteName(parsed.siteName);
        if (parsed.logoColor) setLogoColor(parsed.logoColor);
      } catch (e) {
        console.error(e);
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg'
          : 'bg-slate-950/70 backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-blue-900/30 border border-blue-500/30 flex items-center justify-center shadow-md">
            <svg 
              className="w-5 h-5 text-blue-500"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <line x1="9" y1="22" x2="9" y2="16" />
              <line x1="15" y1="22" x2="15" y2="16" />
              <line x1="9" y1="16" x2="15" y2="16" />
              <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">{siteName}</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions (Login / Portal CTA Button) */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="h-10 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-all font-medium text-sm flex items-center justify-center"
          >
            Portal Login
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-slate-950 border-b border-slate-800 shadow-2xl md:hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-slate-300 hover:text-white py-2 border-b border-white/5 last:border-none"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  router.push('/auth/login');
                }}
                className="w-full h-10 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Portal Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
