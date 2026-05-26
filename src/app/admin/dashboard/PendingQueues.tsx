import React from 'react';
import { CreditCard, KeyRound } from 'lucide-react';

export default function PendingQueues() {
  const queues = [
    { label: 'Unverified Payments', count: 18, icon: <CreditCard size={14} className="text-amber-400" />, href: '/admin/payments' },
    { label: 'Unassigned Allocations', count: 9, icon: <KeyRound size={14} className="text-[#4a9eff]" />, href: '/admin/allocations' }
  ];

  return (
    <div className="bg-[#0a2240]/60 backdrop-blur-sm p-5 rounded-2xl border-t-4 border-t-blue-700 border border-[#1e5faf]/25 space-y-4">
      <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.1em]">Pending Queues</h3>
      
      <div className="space-y-2.5">
        {queues.map((q, idx) => (
          <a 
            key={idx} 
            href={q.href}
            className="flex items-center justify-between p-3.5 bg-[#06182e]/40 border border-[#1e5faf]/10 hover:border-[#1e5faf]/25 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {q.icon}
              <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">{q.label}</span>
            </div>
            <span className="text-[11px] font-extrabold px-3 py-1 bg-[#0f3058]/50 border border-[#1e5faf]/15 text-white rounded-full">
              {q.count}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
