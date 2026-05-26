import React from 'react';
import { CheckCircle2, Clock, Landmark } from 'lucide-react';

interface AllocationTimelineProps {
  step: 'BOOKED' | 'PAID' | 'ALLOCATED';
}

export default function AllocationTimeline({ step }: AllocationTimelineProps) {
  const steps = [
    {
      id: 'BOOKED',
      title: 'Hostel Selected',
      desc: 'Temporary room reserved',
      active: true,
      done: step === 'PAID' || step === 'ALLOCATED'
    },
    {
      id: 'PAID',
      title: 'Payment Settle',
      desc: 'Verify transaction receipts',
      active: step === 'PAID' || step === 'ALLOCATED',
      done: step === 'ALLOCATED'
    },
    {
      id: 'ALLOCATED',
      title: 'Room Slip generated',
      desc: 'Room details unlocked',
      active: step === 'ALLOCATED',
      done: step === 'ALLOCATED'
    }
  ];

  return (
    <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Allocation Track Timeline</h3>
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                s.done 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : s.active 
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                    : 'bg-[#06182e]/40 text-slate-400 border-[#1e5faf]/15'
              }`}>
                {s.done ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">{s.title}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{s.desc}</div>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="hidden md:block flex-1 h-0.5 bg-[#0f3058]/30 mx-2"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
