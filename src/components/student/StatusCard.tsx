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
    <div className="flex flex-col h-full bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#1D4ED8] flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 pt-1">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
            {title}
          </h4>
          <span className={`status-badge ${badgeType}`}>
            {statusText}
          </span>
        </div>
      </div>

      <p className="text-sm text-[#475569] leading-relaxed mb-6 font-medium flex-grow">
        {explanation}
      </p>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="group/link inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:text-[#1E3A8A] transition-colors mt-auto"
        >
          <span>{actionText}</span>
          <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
