'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Active session redirection
  useEffect(() => {
    if (currentUser) {
      const role = currentUser.role || 'student';
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [currentUser, router]);

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between relative bg-cover bg-center overflow-x-hidden selection:bg-blue-600 selection:text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url('/assets/gctu-campus-2.jpg')`,
      }}
    >
      {/* Top and Centered Branding Panel */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-16 pb-8 flex flex-col items-center text-center relative z-10">
        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white p-2.5 border border-white/20 shadow-xl mb-6 transition-transform duration-300 hover:scale-105">
          <img 
            src="/assets/gctu-logo.jpg" 
            alt="GCTU Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">
          GCTU Hostel Allocation System
        </h1>
      </header>

      {/* Three-Column Information & Access Panel */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 relative z-10 my-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Box 1: About GCTU Hostels */}
          <div className="bg-black/85 border-2 border-amber-500/40 backdrop-blur-md rounded-3xl p-8 flex flex-col justify-between items-center text-center shadow-[0_4px_30px_rgba(212,175,55,0.15)] transition-all duration-300 hover:border-amber-500/70 hover:shadow-[0_4px_35px_rgba(212,175,55,0.25)] hover:-translate-y-1">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-amber-500 tracking-wide uppercase">
                About GCTU Hostels
              </h2>
              <p className="text-slate-100 text-sm leading-relaxed font-semibold">
                Click to Read More about the Current Application Session. This should guide you in your application for a bed in GCTU Hostels. You can also find Hostel and Room Prices for your consideration.
              </p>
            </div>
            <button
              onClick={() => router.push('/support')}
              className="mt-6 inline-flex items-center text-base font-bold text-blue-400 hover:text-blue-300 transition-colors gap-1 group/btn"
            >
              <span>Read More</span>
              <span className="group-hover/btn:translate-x-1 transition-transform duration-200">»</span>
            </button>
          </div>

          {/* Box 2: Apply for Reservation */}
          <div className="bg-black/85 border-2 border-amber-500/40 backdrop-blur-md rounded-3xl p-8 flex flex-col justify-between items-center text-center shadow-[0_4px_30px_rgba(212,175,55,0.15)] transition-all duration-300 hover:border-amber-500/70 hover:shadow-[0_4px_35px_rgba(212,175,55,0.25)] hover:-translate-y-1">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-amber-500 tracking-wide uppercase">
                Apply for Reservation
              </h2>
              <p className="text-slate-100 text-sm leading-relaxed font-semibold">
                Click on the Apply Now link to submit your application for GCTU Hostel Bed Allocation. Fill in the form and submit. Note that this application is not an automatic allocation of a bed as many students will be applying.
              </p>
            </div>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-6 inline-flex items-center text-base font-bold text-blue-400 hover:text-blue-300 transition-colors gap-1 group/btn"
            >
              <span>Apply Now</span>
              <span className="group-hover/btn:translate-x-1 transition-transform duration-200">»</span>
            </button>
          </div>

          {/* Box 3: Portal Login */}
          <div className="bg-black/85 border-2 border-amber-500/40 backdrop-blur-md rounded-3xl p-8 flex flex-col justify-between items-center text-center shadow-[0_4px_30px_rgba(212,175,55,0.15)] transition-all duration-300 hover:border-amber-500/70 hover:shadow-[0_4px_35px_rgba(212,175,55,0.25)] hover:-translate-y-1">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-amber-500 tracking-wide uppercase">
                Portal Login
              </h2>
              <p className="text-slate-100 text-sm leading-relaxed font-semibold">
                Click on the Portal Login to access your GCTU Hostels Management Portal. You will need your Username and Password. Click on Reset Password to change your Password if you have forgotten it.
              </p>
            </div>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-6 inline-flex items-center text-base font-bold text-blue-400 hover:text-blue-300 transition-colors gap-1 group/btn"
            >
              <span>Portal Login</span>
              <span className="group-hover/btn:translate-x-1 transition-transform duration-200">»</span>
            </button>
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs md:text-sm text-slate-650 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <strong>Copyright &copy; 2026 <a href="https://gctu.edu.gh" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Ghana Communication Technology University</a>.</strong> All rights reserved.
        </div>
      </footer>
    </div>
  );
}
