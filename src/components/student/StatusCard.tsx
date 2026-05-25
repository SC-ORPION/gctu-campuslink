'use client';

import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatusCardProps {
  title: string;
  statusText: string;
  badgeType: 'primary' | 'success' | 'warning' | 'danger';
  explanation: string;
  actionText?: string;
  actionHref?: string;
  icon: React.ReactNode;
}

export default function StatusCard({ 
  title, 
  statusText, 
  badgeType, 
  explanation, 
  actionText, 
  actionHref,
  icon 
}: StatusCardProps) {
  const getBadgeClass = () => {
    switch (badgeType) {
      case 'success': return 'badge-success';
      case 'warning': return 'badge-warning';
      case 'danger': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:scale-[1.005] transition-all">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
          <span className={`badge ${getBadgeClass()}`}>{statusText}</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
            {icon}
          </div>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">{explanation}</p>
        </div>
      </div>
      {actionText && actionHref && (
        <div className="mt-4 pt-4 border-t border-slate-50">
          <Link 
            href={actionHref}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-750 transition-colors"
          >
            <span>{actionText}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
