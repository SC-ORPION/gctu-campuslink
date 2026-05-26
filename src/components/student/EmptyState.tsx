'use client';

import React from 'react';
import Link from 'next/link';
import { Building, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
}

export default function EmptyState({ title, description, actionText, actionHref }: EmptyStateProps) {
  return (
    <div className="bg-[#0a2240]/40 backdrop-blur-sm border border-[#1e5faf]/15 rounded-2xl p-12 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0f3058]/60 border border-[#1e5faf]/15 flex items-center justify-center mb-5">
        <Building size={28} className="text-slate-500" />
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-[13px] text-slate-400 max-w-md mx-auto leading-relaxed mb-6 font-medium">
        {description}
      </p>

      <Link
        href={actionHref}
        className="group inline-flex items-center gap-2 px-6 py-3 bg-[#d4af37] hover:bg-[#e0bc45] text-[#06182e] font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-[#d4af37]/15"
      >
        <span>{actionText}</span>
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
