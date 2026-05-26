'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Building2, ShieldCheck, TrendingUp } from 'lucide-react';

const stats = [
  { icon: Users, value: 2400, suffix: '+', label: 'Students Served', color: '#4a9eff' },
  { icon: Building2, value: 12, suffix: '', label: 'Partner Hostels', color: '#d4af37' },
  { icon: ShieldCheck, value: 99, suffix: '%', label: 'Allocation Success', color: '#10b981' },
  { icon: TrendingUp, value: 86, suffix: '%', label: 'Occupancy Rate', color: '#8b5cf6' },
];

function AnimatedCounter({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function InteractiveLightGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="about" ref={ref} className="relative py-24 md:py-32 bg-[#0a2240] overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(42,117,209,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(42,117,209,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#2a75d1]/5 blur-[120px]" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.15em] mb-3 block">
            Platform Metrics
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-white tracking-tight mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
            Real-time operational data from the CampusLink allocation engine powering GCTU student housing.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="group relative bg-[#06182e]/60 backdrop-blur-sm border border-[#1e5faf]/15 rounded-2xl p-6 text-center hover:border-[#1e5faf]/30 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Top Highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(42,117,209,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: `${stat.color}12` }}
              >
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>

              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={isInView} />
              </div>

              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
