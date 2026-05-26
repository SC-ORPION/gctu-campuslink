'use client';

import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Register or Login',
    description: 'Use your student ID. One portal for all users — admins and students alike.',
  },
  {
    number: '02',
    title: 'Choose Your Hostel',
    description: 'Browse real-time availability, pricing, and room types across all campus hostels.',
  },
  {
    number: '03',
    title: 'Submit Payment',
    description: 'Secure, instant payment verification integrated with university finance systems.',
  },
  {
    number: '04',
    title: 'Receive Allocation',
    description: 'Instant room assignment with digital confirmation and roommate details.',
  },
];

export default function HowItWorks() {
  return (
    <section id="onboarding" className="relative py-24 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Four Steps to Your Room
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            From login to allocation in under 10 minutes.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting Line - Desktop */}
          <div className="hidden md:block absolute top-[20px] left-[12.5%] right-[12.5%] h-[2px] bg-slate-200" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-center text-center group"
              >
                {/* Node */}
                <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center relative z-10 transition-all duration-300 group-hover:border-blue-700 group-hover:shadow-[0_0_12px_rgba(29,78,216,0.15)]">
                  <span className="font-mono text-sm text-blue-700 font-bold">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="mt-6 text-slate-900 font-bold text-lg leading-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-[260px] font-normal">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
