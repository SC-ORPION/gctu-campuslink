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
    <div className="premium-card">
      <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-8">
        Booking Progress
      </h3>

      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-4 left-8 right-8 h-px bg-[#E2E8F0]">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: currentIndex >= 0 ? (currentIndex + 1) / STEPS.length : 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-[#1D4ED8] to-[#059669] origin-left"
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
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                  isCompleted
                    ? isCurrent
                      ? 'bg-[#1D4ED8] shadow-md ring-4 ring-[#EFF6FF]'
                      : 'bg-[#059669] shadow-sm'
                    : 'bg-white border-2 border-[#E2E8F0]'
                }`}
              >
                {isCompleted ? (
                  isCurrent ? (
                    <Clock size={14} className="text-white" />
                  ) : (
                    <CheckCircle2 size={14} className="text-white" />
                  )
                ) : (
                  <Circle size={14} className="text-[#94A3B8]" />
                )}
              </motion.div>

              <span className={`text-[11px] font-bold text-center leading-tight ${
                isCompleted ? 'text-[#0F172A]' : 'text-[#64748B]'
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
