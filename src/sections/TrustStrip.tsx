'use client';

import React from 'react';
import { Building2, Shield, CheckCircle2, Clock } from 'lucide-react';

const trustItems = [
  { icon: Building2, title: 'Official GCTU Platform', caption: 'Directly integrated with university systems' },
  { icon: Shield, title: 'Secure Payments', caption: 'SSL-encrypted transaction processing' },
  { icon: CheckCircle2, title: 'Verified Allocations', caption: 'Every room assignment is authenticated' },
  { icon: Clock, title: 'Real-Time Availability', caption: 'Live room counts across all hostels' },
];

export default function TrustStrip() {
  return (
    <section className="relative bg-[#06182e] py-16 border-y border-white/5">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center text-center p-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#1e5faf]/10 flex items-center justify-center flex-shrink-0 mb-4 border border-[#1e5faf]/25">
                <item.icon size={22} className="text-[#4a9eff]" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
