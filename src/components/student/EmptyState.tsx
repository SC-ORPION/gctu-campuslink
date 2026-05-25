'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
}

export default function EmptyState({ title, description, actionText, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-slate-200 rounded-2xl">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-sm font-black text-slate-900 mb-1">{title}</h3>
      <p className="text-xs font-semibold text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && actionHref && (
        <Link 
          href={actionHref}
          className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-750 transition-colors shadow-sm"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
