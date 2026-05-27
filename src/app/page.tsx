'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

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
    <div className="min-h-screen w-full flex flex-col bg-[#F8FAFC]">
      
      {/* Premium Hero Section */}
      <section 
        className="relative w-full py-24 lg:py-32 flex flex-col items-center justify-center bg-[#0F172A] border-b border-[#1E293B] overflow-hidden"
      >
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('/assets/gctu-campus-2.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0F172A]/80 to-[#0F172A]"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white p-2 mb-8 shadow-xl shadow-black/50">
            <img 
              src="/assets/gctu-logo.jpg" 
              alt="GCTU Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 font-['Outfit']">
            CampusLink Allocation System
          </h1>
          <p className="text-[#64748B] text-lg md:text-xl font-medium max-w-2xl">
            The central platform for managing student housing and accommodations at Ghana Communication Technology University.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Box 1: About */}
          <div className="premium-card flex flex-col h-full">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center mb-6">
                <span className="text-[#0F172A] font-bold text-lg">i</span>
              </div>
              <h2 className="premium-card-title mb-4">About GCTU Hostels</h2>
              <p className="text-[#475569] text-sm leading-relaxed">
                Read more about the current application session. This guide helps you navigate the application process for a bed in GCTU Hostels, including prices and availability.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <button
                onClick={() => router.push('/support')}
                className="text-[#0F172A] font-semibold text-sm hover:text-[#D4A017] transition-colors flex items-center gap-2"
              >
                Read Information &rarr;
              </button>
            </div>
          </div>

          {/* Box 2: Apply */}
          <div className="premium-card flex flex-col h-full border-[#0F172A] shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F172A]/5 rounded-bl-full -z-10"></div>
            <div className="flex-1 relative z-10">
              <div className="w-12 h-12 rounded-lg bg-[#0F172A] text-white flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h2 className="premium-card-title mb-4">Apply for Reservation</h2>
              <p className="text-[#475569] text-sm leading-relaxed">
                Submit your application for bed allocation. Please note that application does not guarantee automatic allocation due to high demand.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] relative z-10">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-[#D4A017] font-bold text-sm hover:text-[#0F172A] transition-colors flex items-center gap-2"
              >
                Start Application &rarr;
              </button>
            </div>
          </div>

          {/* Box 3: Portal Login */}
          <div className="premium-card flex flex-col h-full">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
              </div>
              <h2 className="premium-card-title mb-4">Portal Access</h2>
              <p className="text-[#475569] text-sm leading-relaxed">
                Access your personalized management portal to track payments, view your room slip, and report any incidents.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-[#0F172A] font-semibold text-sm hover:text-[#D4A017] transition-colors flex items-center gap-2"
              >
                Sign In to Portal &rarr;
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}
