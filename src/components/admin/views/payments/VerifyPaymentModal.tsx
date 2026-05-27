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
    <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Approve Deposit Clearance?</h3>
            <p className="text-sm font-medium text-[#64748B]">Verifying fees for {studentName}</p>
          </div>
        </div>

        <div className="bg-[#FEF2F2] border border-[#DC2626]/20 p-4 rounded-xl text-sm font-semibold text-[#DC2626] leading-relaxed">
          WARNING: Approving this deposit verifies the student's booking clearance and automatically triggers the transaction-safe room allocation engine to assign a bed slot.
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
            type="button"
            onClick={onConfirm}
            className="btn btn-primary flex-1 bg-[#059669] hover:bg-[#047857]"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Approve Clearance'}
          </button>
        </div>
      </div>
    </div>
  );
}
