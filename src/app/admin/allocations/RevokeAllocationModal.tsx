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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a2240]/60 backdrop-blur-sm max-w-md w-full rounded-2xl border border-[#1e5faf]/15 p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Revoke Room Assignment?</h3>
            <p className="text-xs font-semibold text-slate-400">Evicting student from dorm reservation</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-xs font-bold text-rose-800 leading-relaxed">
          WARNING: Revoking this allocation will immediately evict <span className="font-extrabold">{studentName}</span> from Room <span className="font-extrabold">{roomNumber}</span>. Roster occupancy counts will be instantly updated.
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
            className="py-3 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-750 transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Eviction'}
          </button>
        </div>
      </div>
    </div>
  );
}
