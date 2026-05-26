'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface StatusCardProps {
  title: string;
  statusText: string;
  badgeType: 'success' | 'warning' | 'danger';
  explanation: string;
  actionText?: string;
  actionHref?: string;
  icon: React.ReactNode;
}

const badgeStyles = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/15',
};

export default function StatusCard({ title, statusText, badgeType, explanation, actionText, actionHref, icon }: StatusCardProps) {
  return (
    <div className="group bg-[#0a2240]/60 backdrop-blur-sm border border-[#1e5faf]/15 rounded-2xl p-5 hover:border-[#1e5faf]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#0f3058]/60 border border-[#1e5faf]/15 flex items-center justify-center text-[#4a9eff] flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1">
            {title}
          </h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeStyles[badgeType]}`}>
            {statusText}
          </span>
        </div>
      </div>

      <p className="text-[12px] text-slate-400 leading-relaxed mb-4 font-medium">
        {explanation}
      </p>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="group/link inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4a9eff] hover:text-white transition-colors"
        >
          <span>{actionText}</span>
          <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
