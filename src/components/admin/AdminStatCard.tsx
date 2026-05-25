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
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:scale-[1.005] transition-all">
      <div>
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</span>
        <span className="text-2xl font-black text-slate-900 leading-none">{value}</span>
        {explanation && (
          <span className="block text-[10px] font-bold text-slate-400 mt-1">{explanation}</span>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
