import React from 'react';
import { Ban, Unlock, Loader2, AlertTriangle } from 'lucide-react';

interface BlockStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
  isBlocked: boolean;
  loading: boolean;
}

export default function BlockStudentModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  isBlocked,
  loading
}: BlockStudentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isBlocked ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
            {isBlocked ? <Unlock size={24} /> : <Ban size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              {isBlocked ? 'Unblock Student Account?' : 'Block Student Account?'}
            </h3>
            <p className="text-sm font-medium text-[#64748B]">Set status flag for {studentName}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl text-sm font-semibold leading-relaxed border ${
          isBlocked 
            ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]' 
            : 'bg-[#FEF2F2] border-[#DC2626]/20 text-[#DC2626]'
        }`}>
          {isBlocked 
            ? 'Proceeding will restore standard student cockpit access. The student will be able to book rooms and verify payments.'
            : 'WARNING: Blocking this student immediately restricts cockpit access. They will be barred from creating bookings or requesting room allocations.'}
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
            className={`btn flex-1 text-white ${
              isBlocked ? 'bg-[#059669] hover:bg-[#047857]' : 'bg-[#DC2626] hover:bg-[#B91C1C]'
            }`}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
