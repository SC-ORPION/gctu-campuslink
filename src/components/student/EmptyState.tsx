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
    <div className="premium-card text-center py-12">
      <div className="w-16 h-16 mx-auto rounded-full bg-[#EFF6FF] border border-[#E2E8F0] flex items-center justify-center mb-5">
        <Building size={28} className="text-[#1D4ED8]" />
      </div>

      <h3 className="text-xl font-bold text-[#0F172A] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed mb-8 font-medium">
        {description}
      </p>

      <Link
        href={actionHref}
        className="btn btn-primary"
      >
        <span>{actionText}</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
