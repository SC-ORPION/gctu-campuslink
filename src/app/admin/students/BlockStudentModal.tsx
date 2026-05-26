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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a2240]/60 backdrop-blur-sm max-w-md w-full rounded-2xl border border-[#1e5faf]/15 p-6 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isBlocked ? <Unlock size={20} /> : <Ban size={20} />}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isBlocked ? 'Unblock Student Account?' : 'Block Student Account?'}
            </h3>
            <p className="text-xs font-semibold text-slate-400">Set status flag for {studentName}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl text-xs font-bold leading-relaxed border ${
          isBlocked 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          {isBlocked 
            ? 'Proceeding will restore standard student cockpit access. The student will be able to book rooms and verify payments.'
            : 'WARNING: Blocking this student immediately restricts cockpit access. They will be barred from creating bookings or requesting room allocations.'}
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
            className={`py-3 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
              isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-750'
            }`}
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
