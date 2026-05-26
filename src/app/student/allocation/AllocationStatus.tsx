import React from 'react';
import { ShieldCheck, Loader2, XCircle } from 'lucide-react';

interface AllocationStatusProps {
  status: 'PENDING' | 'ALLOCATED' | 'REVOKED';
}

export default function AllocationStatus({ status }: AllocationStatusProps) {
  const config = {
    PENDING: {
      icon: <Loader2 className="text-amber-500 animate-spin" size={24} />,
      title: 'Allocation Processing',
      description: 'Your room assignment details are currently being finalized. This step occurs after receipt verification.',
      color: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/25 dark:border-amber-900/30 dark:text-amber-450'
    },
    ALLOCATED: {
      icon: <ShieldCheck className="text-emerald-500 dark:text-emerald-400" size={24} />,
      title: 'Allocation Complete',
      description: 'Your accommodation assignment has been officially completed. You can now print your Room Slip statements.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/25 dark:border-emerald-900/30 dark:text-emerald-450'
    },
    REVOKED: {
      icon: <XCircle className="text-rose-500" size={24} />,
      title: 'Allocation Revoked',
      description: 'This room allocation was cancelled by admin due to receipt expiration or manual adjustment.',
      color: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/25 dark:border-rose-900/30 dark:text-rose-450'
    }
  };

  const selected = config[status];

  return (
    <div className={`p-6 rounded-2xl border ${selected.color} flex gap-4 items-start transition-all`}>
      <div className="flex-shrink-0 mt-0.5">{selected.icon}</div>
      <div className="text-left">
        <h4 className="text-sm font-black">{selected.title}</h4>
        <p className="text-xs mt-1.5 leading-relaxed font-semibold opacity-90">{selected.description}</p>
      </div>
    </div>
  );
}
