'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0F172A] border-t border-[#1E293B] mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="flex flex-col space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg p-1">
                <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-lg leading-tight tracking-tight">GCTU CampusLink</span>
                <span className="text-[#D4A017] font-bold text-[10px] uppercase tracking-widest">Accommodations</span>
              </div>
            </Link>
            <p className="text-[#64748B] text-sm leading-relaxed max-w-sm">
              The premier allocation and management system for student housing at Ghana Communication Technology University.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/student/hostels" className="text-[#64748B] hover:text-[#D4A017] transition-colors text-sm font-medium">Browse Hostels</Link></li>
              <li><Link href="/about" className="text-[#64748B] hover:text-[#D4A017] transition-colors text-sm font-medium">About Us</Link></li>
              <li><Link href="/support" className="text-[#64748B] hover:text-[#D4A017] transition-colors text-sm font-medium">Contact Support</Link></li>
              <li><Link href="/faq" className="text-[#64748B] hover:text-[#D4A017] transition-colors text-sm font-medium">FAQ</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Legal & Portal</h4>
            <ul className="space-y-4">
              <li><Link href="/terms" className="text-[#64748B] hover:text-[#D4A017] transition-colors text-sm font-medium">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-[#64748B] hover:text-[#D4A017] transition-colors text-sm font-medium">Privacy Policy</Link></li>
              <li><Link href="/auth/login" className="text-[#D4A017] hover:text-[#FCD34D] transition-colors text-sm font-bold mt-2 inline-block">Admin Portal Access &rarr;</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-[#D4A017] mt-0.5" />
                <span className="text-[#64748B] text-sm font-medium">info@campuslink.gctu.edu.gh</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-[#D4A017] mt-0.5" />
                <span className="text-[#64748B] text-sm font-medium">+233 24 000 0000</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#D4A017] mt-0.5" />
                <span className="text-[#64748B] text-sm font-medium leading-relaxed">Tesano, Accra, Ghana</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-[#1E293B] bg-[#0B1220]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#64748B] text-xs font-medium">
            &copy; {new Date().getFullYear()} Ghana Communication Technology University. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-[#64748B]">
            <span>System Version 2.0</span>
            <span className="w-1 h-1 rounded-full bg-[#1E293B]"></span>
            <span className="text-[#059669] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#059669]"></span> Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
