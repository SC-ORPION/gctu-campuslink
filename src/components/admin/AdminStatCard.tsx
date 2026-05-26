'use client';

import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  explanation?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export default function AdminStatCard({ title, value, explanation, icon, colorClass }: AdminStatCardProps) {
  return (
    <div className="bg-[#0a2240]/60 backdrop-blur-sm/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-between hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all">
      <div>
        <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{title}</span>
        <span className="text-2xl font-black text-white leading-none">{value}</span>
        {explanation && (
          <span className="block text-[10px] font-bold text-white/40 mt-1">{explanation}</span>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl backdrop-blur-md flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
