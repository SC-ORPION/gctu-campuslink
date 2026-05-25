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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        {warningText && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-xs font-bold text-red-800 leading-relaxed">
            {warningText}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onClose}
            className="py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
