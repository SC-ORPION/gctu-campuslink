import React from 'react';
import { X, Image as ImageIcon, Check, Ban, Eye } from 'lucide-react';

interface PaymentPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any | null;
  onVerify: () => void;
  onReject: () => void;
}

export default function PaymentPreviewDrawer({
  isOpen,
  onClose,
  payment,
  onVerify,
  onReject
}: PaymentPreviewDrawerProps) {
  if (!isOpen || !payment) return null;

  const student = payment.booking?.users;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-screen max-w-md bg-white dark:bg-zinc-950 shadow-2xl flex flex-col justify-between h-full border-l border-slate-105 dark:border-zinc-900 animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1e5faf]/15 dark:border-zinc-900 flex justify-between items-center bg-[#06182e]/40/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <ImageIcon size={18} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white dark:text-zinc-200">Deposit Slip Auditor</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">{payment.reference || 'No Ref'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-zinc-555 hover:text-slate-300 dark:hover:text-zinc-350 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          
          {/* Identity Dossier */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-[#1e5faf]/15 dark:border-zinc-900 pb-2">Student Dossier</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-semibold">Full Name</span>
                <span className="text-xs font-bold text-slate-200 dark:text-zinc-300">{student?.fullName || student?.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-semibold">Student ID</span>
                <span className="text-xs font-bold text-slate-200 dark:text-zinc-300">{student?.studentId || student?.student_id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-[#1e5faf]/15 dark:border-zinc-900 pb-2">Transaction Particulars</h4>
            <div className="bg-[#06182e]/40 dark:bg-zinc-900/40 border border-[#1e5faf]/15 dark:border-zinc-900 p-4 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 dark:text-zinc-450">Reserved Hostel:</span>
                <span className="font-bold text-white dark:text-zinc-200">{payment.booking?.hostels?.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 dark:text-zinc-450">Method Settle:</span>
                <span className="font-extrabold text-white dark:text-zinc-200">{payment.method}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 dark:text-zinc-450">Total Amount:</span>
                <span className="font-black text-indigo-650 dark:text-indigo-400">GH₵1,500.00</span>
              </div>
            </div>
          </div>

          {/* Uploaded Slip Image */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-[#1e5faf]/15 dark:border-zinc-900 pb-2">Receipt Document Upload</h4>
            <div className="relative aspect-[4/3] bg-[#0f3058]/30 dark:bg-zinc-900 rounded-xl overflow-hidden border border-[#1e5faf]/15 dark:border-zinc-800 flex items-center justify-center group shadow-inner">
              <ImageIcon className="text-slate-350 dark:text-zinc-700 absolute" size={48} />
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye size={16} /> Open Document
                </span>
              </div>
              {/* Mock receipt view */}
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                GCB_DEPOSIT_SLIP.PNG
              </div>
            </div>
          </div>

        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-[#1e5faf]/15 dark:border-zinc-900 bg-[#06182e]/40/50 dark:bg-zinc-950/50 flex gap-2">
          {payment.status === 'PENDING' ? (
            <>
              <button 
                onClick={onReject}
                className="w-1/2 py-3 bg-red-50 dark:bg-rose-950/20 border border-red-200 dark:border-rose-900/30 text-red-650 dark:text-rose-400 font-black text-xs rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                <Ban size={14} /> Reject
              </button>
              <button 
                onClick={onVerify}
                className="w-1/2 py-3 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                <Check size={14} /> Verify Slip
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="w-full py-3 bg-white dark:bg-zinc-900 border border-[#1e5faf]/15 dark:border-zinc-800 text-slate-200 dark:text-zinc-300 font-black text-xs rounded-xl hover:bg-[#06182e]/40 dark:hover:bg-zinc-800 transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            >
              Close Auditor
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
