import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RejectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
  studentName?: string;
}

export default function RejectPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  studentName = 'student'
}: RejectPaymentModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a2240]/60 backdrop-blur-sm max-w-md w-full rounded-2xl border border-[#1e5faf]/15 p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Reject Deposit Clearance?</h3>
            <p className="text-xs font-semibold text-slate-400">Declining fees for {studentName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-200">Decline/Rejection Reason</label>
            <textarea 
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reference number could not be verified by GCB treasury..."
              className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-xs resize-none"
              required
            />
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
              type="submit"
              className="py-3 bg-rose-600 hover:bg-rose-750 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Reject Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
