'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqData = [
  {
    question: 'How do I pay for my hostel?',
    answer: 'You can pay via mobile money, bank transfer, or online card payment. Once your payment is completed, the system instantly processes the verification and allocates your selected room.',
  },
  {
    question: 'When will I receive my room assignment?',
    answer: 'Your room assignment is generated instantly as soon as your payment is verified by the platform, usually in under 10 minutes.',
  },
  {
    question: 'Can I choose my roommate?',
    answer: 'Yes! During the registration and hostel selection process, you can input your preferred roommate\'s student ID to request a shared room.',
  },
  {
    question: 'What if my preferred hostel is full?',
    answer: 'If a hostel is at 100% capacity, you can join the real-time waitlist or choose from other verified, high-quality hostel accommodations available on the platform.',
  },
  {
    question: 'Is the platform only for GCTU students?',
    answer: 'Yes, CampusLink is the official, exclusive hostel allocation platform integrated directly with the Ghana Communication Technology University database.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <section id="faq" ref={containerRef} className="relative py-24 bg-slate-50 border-t border-slate-200/60 overflow-hidden">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Common Questions
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about the allocation process.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between text-left p-6 group transition-colors duration-200"
                >
                  <span className={`text-base font-bold transition-colors duration-200 ${isOpen ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-700'}`}>
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
