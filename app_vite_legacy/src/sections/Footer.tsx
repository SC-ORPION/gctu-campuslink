import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const linkGroups = [
  {
    title: 'Platform',
    links: ['About', 'Hostels', 'How It Works', 'FAQ'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Contact IT Support', 'Report an Issue', 'System Status'],
  },
  {
    title: 'University',
    links: ['GCTU Website', 'Academic Calendar', 'Student Portal', 'Campus Map'],
  },
]

export default function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <footer ref={ref} className="bg-navy-900 border-t border-navy-800">
      <div className="max-w-[1200px] mx-auto px-6 pt-16 md:pt-20 pb-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0 }}
          >
            <div className="flex items-center gap-2.5">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <span className="text-white font-semibold text-xl">CampusLink</span>
            </div>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-[280px]">
              Official hostel allocation platform of Ghana Communication
              Technology University.
            </p>
          </motion.div>

          {/* Link Columns */}
          {linkGroups.map((group, gi) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
                delay: (gi + 1) * 0.1,
              }}
            >
              <h4 className="text-xs font-medium tracking-[0.06em] uppercase text-slate-400 mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-200 hover:text-white transition-colors duration-150"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-slate-400 text-center sm:text-left">
            © 2025 CampusLink — Ghana Communication Technology University. All
            rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <span>·</span>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
