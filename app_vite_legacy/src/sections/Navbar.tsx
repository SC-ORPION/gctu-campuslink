import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Hostels', href: '#hostels' },
  { label: 'Help', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled
          ? 'bg-navy-900/95 backdrop-blur-xl shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#0a2240" stroke="#2a75d1" strokeWidth="1.5"/>
            <path d="M20 6L6 14V16H34V14L20 6Z" fill="#1e5faf"/>
            <rect x="10" y="18" width="6" height="6" rx="1" fill="#2a75d1" opacity="0.8"/>
            <rect x="17" y="18" width="6" height="6" rx="1" fill="#2a75d1" opacity="0.9"/>
            <rect x="24" y="18" width="6" height="6" rx="1" fill="#2a75d1" opacity="0.8"/>
            <rect x="10" y="26" width="6" height="6" rx="1" fill="#2a75d1" opacity="0.6"/>
            <rect x="17" y="26" width="6" height="6" rx="1" fill="#2a75d1" opacity="0.7"/>
            <rect x="24" y="26" width="6" height="6" rx="1" fill="#2a75d1" opacity="0.6"/>
            <circle cx="20" cy="12" r="2" fill="#d4a017"/>
          </svg>
          <span className="text-white font-semibold text-lg tracking-tight">
            CampusLink
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Login Button */}
        <div className="hidden md:block">
          <a
            href="#login"
            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white border border-slate-400 rounded-md hover:bg-blue-600 hover:border-blue-600 transition-all duration-200"
          >
            Login
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-0 right-0 bg-navy-900/98 backdrop-blur-xl border-t border-navy-800 md:hidden"
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#login"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white border border-slate-400 rounded-md hover:bg-blue-600 hover:border-blue-600 transition-all mt-2"
            >
              Login
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
