'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  warningText?: string;
  confirmText?: string;
  loading?: boolean;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningText,
  confirmText = 'Proceed Action',
  loading = false
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a2240]/60 backdrop-blur-sm/[0.08] backdrop-blur-2xl max-w-md w-full rounded-2xl border border-white/15 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white leading-tight">{title}</h3>
            <p className="text-xs font-semibold text-white/50 mt-0.5">{description}</p>
          </div>
        </div>

        {warningText && (
          <div className="bg-red-500/10 border border-red-400/20 p-4 rounded-xl text-xs font-bold text-red-300 leading-relaxed">
            {warningText}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onClose}
            className="py-3 bg-[#0a2240]/60 backdrop-blur-sm/5 border border-white/10 text-white/70 rounded-xl font-bold text-xs hover:bg-[#0a2240]/60 backdrop-blur-sm/10 hover:border-white/20 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-xs hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(59,130,246,0.25)]"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
