'use client';

import React from 'react';
import Link from 'next/link';

const platformLinks = [
  { label: 'Browse Hostels', href: '#hostels' },
  { label: 'How It Works', href: '#onboarding' },
  { label: 'Student Portal', href: '/auth/login' },
  { label: 'FAQ', href: '#faq' },
];

const supportLinks = [
  { label: 'Help Center', href: '#faq' },
  { label: 'Report Issue', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

const universityLinks = [
  { label: 'GCTU Website', href: 'https://gctu.edu.gh' },
  { label: 'Academic Calendar', href: '#' },
  { label: 'Student Affairs', href: '#' },
  { label: 'Campus Map', href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#0a2240] border-t border-[#1e5faf]/15">
      {/* Gradient top line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#06182e] flex items-center justify-center border border-[#d4af37]/30 overflow-hidden">
                <img src="/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-base font-extrabold text-white block leading-tight">CampusLink</span>
                <span className="text-[9px] font-bold text-[#d4af37] uppercase tracking-[0.1em]">GCTU Accommodation</span>
              </div>
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed font-medium max-w-[250px]">
              The official digital accommodation allocation platform for Ghana Communication Technology University.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[13px] text-slate-300 hover:text-white transition-colors font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-4">Support</h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[13px] text-slate-300 hover:text-white transition-colors font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* University */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-4">University</h4>
            <ul className="space-y-2.5">
              {universityLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[13px] text-slate-300 hover:text-white transition-colors font-medium" target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#0f3058] py-5">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 font-medium">
            © {new Date().getFullYear()} CampusLink — Ghana Communication Technology University
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors font-medium">Privacy</a>
            <a href="#" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors font-medium">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
