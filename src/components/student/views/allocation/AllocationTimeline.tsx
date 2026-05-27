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
    <div className="premium-card p-6">
      <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-6">Allocation Track Timeline</h3>
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                s.done 
                  ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]' 
                  : s.active 
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]' 
                    : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'
              }`}>
                {s.done ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#0F172A]">{s.title}</div>
                <div className="text-[10px] text-[#64748B] font-medium">{s.desc}</div>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="hidden md:block flex-1 h-0.5 bg-[#E2E8F0] mx-2"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
