import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface RevokeAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName?: string;
  roomNumber?: string;
  loading: boolean;
}

export default function RevokeAllocationModal({
  isOpen,
  onClose,
  onConfirm,
  studentName = 'student',
  roomNumber = 'N/A',
  loading
}: RevokeAllocationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Revoke Room Assignment?</h3>
            <p className="text-sm font-medium text-[#64748B]">Evicting student from dorm reservation</p>
          </div>
        </div>

        <div className="bg-[#FEF2F2] border border-[#DC2626]/20 p-4 rounded-xl text-sm font-semibold text-[#DC2626] leading-relaxed">
          WARNING: Revoking this allocation will immediately evict <span className="font-extrabold">{studentName}</span> from Room <span className="font-extrabold">{roomNumber}</span>. Roster occupancy counts will be instantly updated.
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
            className="btn flex-1 bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Eviction'}
          </button>
        </div>
      </div>
    </div>
  );
}
