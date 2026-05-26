'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SystemErrorProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SystemError({ 
  title = "Operation Conflict Detected", 
  message, 
  actionLabel = "Retry Operation", 
  onAction 
}: SystemErrorProps) {
  const router = useRouter();

  return (
    <motion.div 
      className="w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 border border-[#1e5faf]/15 dark:border-zinc-800 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-4">
        {/* Error icon circle */}
        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={20} className="text-rose-600 dark:text-rose-400" />
        </div>

        {/* Narrative details */}
        <div className="flex-grow space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-0.5">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button 
              onClick={onAction || (() => router.refresh())}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-lg text-xs font-bold transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              {actionLabel}
            </button>
            <button 
              onClick={() => router.back()}
              className="px-3.5 py-2 bg-[#0a2240]/60 backdrop-blur-sm hover:bg-[#06182e]/40 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-[#1e5faf]/15 dark:border-zinc-800 text-slate-300 dark:text-zinc-400 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
