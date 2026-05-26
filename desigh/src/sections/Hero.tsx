import { motion } from 'framer-motion'
import { Lock, CheckCircle, Activity } from 'lucide-react'

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      >
        <source src="/videos/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(6,24,46,0.92) 0%, rgba(6,24,46,0.5) 50%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col justify-end h-full max-w-[720px] px-6 pb-16 md:pb-20"
        style={{ paddingLeft: 'clamp(1.5rem, 5vw, 3rem)' }}
      >
        {/* Label Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
        >
          <span className="inline-block text-xs font-medium tracking-[0.06em] uppercase text-amber-500 border border-amber-500/40 px-3.5 py-1.5 rounded">
            Official GCTU Platform
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
          className="mt-6 text-white font-extrabold leading-[0.95] tracking-[-0.03em]"
          style={{
            fontSize: 'clamp(3rem, 8vw, 7rem)',
          }}
        >
          Your Room,
          <br />
          Your Campus,
          <br />
          Your Future.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.65 }}
          className="mt-5 text-base text-slate-200 leading-relaxed max-w-[540px]"
        >
          Ghana Communication Technology University's official hostel allocation
          system. Real-time availability, secure payments, instant room
          assignment.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.8 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <a
            href="#get-started"
            className="inline-flex items-center px-8 py-3.5 text-sm font-semibold text-navy-950 bg-amber-500 rounded-md hover:bg-amber-400 transition-colors duration-200"
          >
            Get Started
          </a>
          <a
            href="#hostels"
            className="inline-flex items-center px-8 py-3.5 text-sm font-semibold text-white border border-white/30 rounded-md hover:border-white hover:bg-white/5 transition-all duration-200"
          >
            Explore Hostels
          </a>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-10 flex flex-wrap items-center gap-4 md:gap-6"
        >
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-emerald-500" />
            <span className="text-xs font-medium tracking-[0.06em] uppercase text-slate-400">
              Secure SSL Payments
            </span>
          </div>
          <div className="w-px h-4 bg-slate-600 hidden md:block" />
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-xs font-medium tracking-[0.06em] uppercase text-slate-400">
              Verified Allocations
            </span>
          </div>
          <div className="w-px h-4 bg-slate-600 hidden md:block" />
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            <span className="text-xs font-medium tracking-[0.06em] uppercase text-slate-400">
              Real-Time Availability
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
