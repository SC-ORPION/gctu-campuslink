'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface BookingProgressProps {
  currentStatus: 'PENDING_PAYMENT' | 'PENDING_VERIFICATION' | 'CONFIRMED' | 'ALLOCATED' | 'CANCELLED';
}

export default function BookingProgress({ currentStatus }: BookingProgressProps) {
  const steps = [
    { key: 'PENDING_PAYMENT', label: '1. Registered' },
    { key: 'PENDING_VERIFICATION', label: '2. Paid' },
    { key: 'CONFIRMED', label: '3. Verified' },
    { key: 'ALLOCATED', label: '4. Assigned' },
  ];

  const getStepIndex = () => {
    if (currentStatus === 'CANCELLED') return -1;
    if (currentStatus === 'PENDING_PAYMENT') return 0;
    if (currentStatus === 'PENDING_VERIFICATION') return 1;
    if (currentStatus === 'CONFIRMED') return 2;
    if (currentStatus === 'ALLOCATED') return 3;
    return 0;
  };

  const activeIndex = getStepIndex();

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accommodation Pipeline</span>
        <span className="text-xs font-black text-slate-800">
          {currentStatus === 'CANCELLED' ? 'Cancelled' : `Stage ${activeIndex + 1} of 4`}
        </span>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Connection line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 z-0"
          style={{ width: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 100 : 0}%` }}
        ></div>

        {steps.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone 
                    ? 'bg-blue-600 text-white' 
                    : isActive 
                      ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? <Check size={14} /> : index + 1}
              </div>
              <span 
                className={`text-[10px] font-extrabold uppercase mt-2 tracking-wide ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {step.label.split('. ')[1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
