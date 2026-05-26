'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface HostelPreviewProps {
  hostels: any[];
  loading: boolean;
}

const mockHostels = [
  {
    id: 'mock-1',
    name: 'Kofi Annan Hall',
    occupancy: 78,
    gender: 'MIXED',
    total_rooms: 240,
    price: 3200,
    image: '/assets/gctu-building.jpg',
  },
  {
    id: 'mock-2',
    name: 'Kwame Nkrumah Hostel',
    occupancy: 92,
    gender: 'MALE',
    total_rooms: 180,
    price: 2800,
    image: '/assets/gctu-campus-2.jpg',
  },
  {
    id: 'mock-3',
    name: 'Leta Hands Residence',
    occupancy: 45,
    gender: 'FEMALE',
    total_rooms: 200,
    price: 3500,
    image: '/assets/gctu-stairs.jpg',
  }
];

export default function HostelPreview({ hostels, loading }: HostelPreviewProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const displayHostels = hostels && hostels.length > 0 ? hostels : mockHostels;

  return (
    <section id="hostels" ref={containerRef} className="relative py-24 bg-white overflow-hidden">
      {/* Background Soft Accent Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Available Accommodations
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Choose from GCTU verified student housing partners with real-time room status indicators.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-3xl h-[420px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayHostels.map((hostel, i) => {
              const occupancy = hostel.occupancy ?? 75;
              const gender = hostel.gender ?? 'MIXED';
              const price = hostel.price ?? 3000;
              const totalRooms = hostel.total_rooms ?? 200;
              const image = hostel.image ?? '/assets/gctu-building.jpg';
              
              // Elegant status configuration
              let tagStyle = 'text-amber-700 bg-amber-50 border-amber-200';
              if (occupancy > 90) {
                tagStyle = 'text-rose-700 bg-rose-50 border-rose-200';
              } else if (occupancy < 50) {
                tagStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200';
              }

              return (
                <motion.div
                  key={hostel.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
                  className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full justify-between"
                >
                  <div>
                    {/* Image Aspect ratio wrapper */}
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100 mb-6">
                      <img
                        src={image}
                        alt={hostel.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 to-transparent opacity-40" />
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${tagStyle}`}>
                        {occupancy}% Full
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {gender}
                      </span>
                    </div>

                    {/* Header Title with Custom Hover effect */}
                    <h3 className="text-xl font-bold text-slate-950 mb-2 leading-tight group-hover:text-blue-700 transition-colors duration-200">
                      {hostel.name}
                    </h3>

                    {/* Pricing Info */}
                    <p className="text-xs font-semibold text-slate-500 mb-6 leading-relaxed flex items-center gap-1.5">
                      <span className="text-slate-900 font-bold text-sm">₵{price.toLocaleString()}</span>
                      <span>/ academic year · {totalRooms} rooms</span>
                    </p>

                    {/* Premium Progress Bar with animated track glow */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden border border-slate-200/50 relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${occupancy}%` } : {}}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
                        className="h-full bg-blue-700 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Footer Actions with Custom animated hover button */}
                  <div className="pt-4 border-t border-slate-100">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-blue-700 group-hover:text-blue-800 transition-colors duration-200 gap-2"
                    >
                      <span>Apply For Booking</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
