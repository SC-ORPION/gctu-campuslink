import React from 'react';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';

interface VerifyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  studentName?: string;
}

export default function VerifyPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  studentName = 'student'
}: VerifyPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a2240]/60 backdrop-blur-sm max-w-md w-full rounded-2xl border border-[#1e5faf]/15 p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Approve Deposit Clearance?</h3>
            <p className="text-xs font-semibold text-slate-400">Verifying fees for {studentName}</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs font-bold text-emerald-800 leading-relaxed">
          WARNING: Approving this deposit verifies the student's booking clearance and automatically triggers the transaction-safe room allocation engine to assign a bed slot.
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="py-3 bg-[#06182e]/40 border border-[#1e5faf]/15 text-slate-200 rounded-xl font-bold text-xs hover:bg-[#0f3058]/30 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            className="py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Approve Clearance'}
          </button>
        </div>
      </div>
    </div>
  );
}
