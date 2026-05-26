'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();

  // Dynamic branding configurations
  const [primaryThemeColor, setPrimaryThemeColor] = useState('#d4af37');
  const [heroHeadline, setHeroHeadline] = useState('Your\nCampus,\nYour Future.');
  const [heroSubtitle, setHeroSubtitle] = useState("Ghana Communication Technology University's official hostel allocation system. Real-time availability, secure payments, instant room assignment.");
  const [heroBgImage, setHeroBgImage] = useState('/assets/gctu-gate.jpg');

  useEffect(() => {
    // Load customizer settings
    const storedSettings = localStorage.getItem('campuslink_customizer_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.primaryThemeColor) setPrimaryThemeColor(parsed.primaryThemeColor);
        if (parsed.heroHeadline) setHeroHeadline(parsed.heroHeadline);
        if (parsed.heroSubtitle) setHeroSubtitle(parsed.heroSubtitle);
        if (parsed.heroBgImage) setHeroBgImage(parsed.heroBgImage);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Format headlines replacing \n with <br />
  const renderedHeadline = heroHeadline.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < heroHeadline.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.6)), url('/images/gctu-campus.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dynamic Background Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 -z-10" />

      <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand content */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
            {/* GCTU badge */}
            <div className="flex items-center gap-3">
              <span className="text-blue-500 font-bold text-xs uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                Ghana Communication Technology University
              </span>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-bold text-xs tracking-wider uppercase">
                Official Portal
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
              Hostel Allocation <br />
              <span className="text-blue-500">Made Seamless.</span>
            </h1>

            {/* Paragraph */}
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              {heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl h-12 px-6 shadow-lg shadow-blue-700/25 transition-all duration-300 flex items-center justify-center"
              >
                Get Started Now
              </button>
              <a
                href="#hostels"
                className="border border-slate-400 text-white hover:bg-white/10 font-medium rounded-xl h-12 px-6 transition-all duration-300 flex items-center justify-center"
              >
                Explore Hostels
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-400 pt-6 border-t border-slate-800/80 w-full max-w-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Secure SSL Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Verified Allocations</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>Real-Time Updates</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating visual composition of cards */}
          <div className="lg:col-span-5 flex flex-col space-y-6 relative">
            
            {/* Main Allocation Preview Card */}
            <div className="bg-white text-slate-850 rounded-2xl border border-slate-250 shadow-xl p-6 relative z-10 transition-all duration-300 hover:shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  Allocation Active
                </span>
                <span className="text-xs font-medium text-slate-500">2026/2027 Session</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Student Allocation Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Assigned Hostel</span>
                  <span className="font-semibold text-slate-950">Kofi Annan Hall</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Room Status</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Available
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Assigned Capacity</span>
                  <span className="font-semibold text-slate-950">4 In a Room</span>
                </div>
              </div>
            </div>

            {/* Mini layered cards side-by-side for Occupancy and Room availability */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Occupancy Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 hover:shadow-xl transition-all duration-300">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Global Occupancy</div>
                <div className="text-2xl font-bold text-slate-900">84%</div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-700 rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              {/* Room Availability Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 hover:shadow-xl transition-all duration-300">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Spaces Left</div>
                <div className="text-2xl font-bold text-blue-700">42 Available</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Booking Open
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
