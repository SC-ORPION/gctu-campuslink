'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const STEPS = [
  { key: 'PENDING_PAYMENT', label: 'Hostel Selected' },
  { key: 'PENDING_VERIFICATION', label: 'Payment Submitted' },
  { key: 'CONFIRMED', label: 'Payment Verified' },
  { key: 'ALLOCATED', label: 'Room Allocated' },
];

const statusOrder = ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'CONFIRMED', 'ALLOCATED'];

export default function BookingProgress({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="bg-[#0a2240]/60 backdrop-blur-sm border border-[#1e5faf]/15 rounded-2xl p-6">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-5">
        Booking Progress
      </h3>

      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-4 left-8 right-8 h-px bg-[#0f3058]">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: currentIndex >= 0 ? (currentIndex + 1) / STEPS.length : 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-[#d4af37] to-[#10b981] origin-left"
          />
        </div>

        {STEPS.map((step, i) => {
          const isCompleted = i <= currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isCompleted
                    ? isCurrent
                      ? 'bg-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-[#0f3058] border border-[#1e5faf]/20'
                }`}
              >
                {isCompleted ? (
                  isCurrent ? (
                    <Clock size={14} className="text-[#06182e]" />
                  ) : (
                    <CheckCircle2 size={14} className="text-white" />
                  )
                ) : (
                  <Circle size={14} className="text-slate-600" />
                )}
              </motion.div>

              <span className={`text-[10px] font-bold text-center leading-tight ${
                isCompleted ? 'text-white' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
