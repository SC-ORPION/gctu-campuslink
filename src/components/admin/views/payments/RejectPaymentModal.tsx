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
    <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Reject Deposit Clearance?</h3>
            <p className="text-sm font-medium text-[#64748B]">Declining fees for {studentName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Decline/Rejection Reason</label>
            <textarea 
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reference number could not be verified by GCB treasury..."
              className="form-input resize-none py-3"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="btn flex-1 bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn flex-1 bg-[#DC2626] text-white hover:bg-[#B91C1C]"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Reject Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
