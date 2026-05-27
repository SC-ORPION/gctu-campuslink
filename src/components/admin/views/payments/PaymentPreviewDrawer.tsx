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
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between h-full border-l border-[#E2E8F0] animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center flex-shrink-0">
              <ImageIcon size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#0F172A]">Deposit Slip Auditor</h3>
              <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">{payment.reference || 'No Ref'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-left">
          
          {/* Identity Dossier */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Student Dossier</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-[#94A3B8] block font-semibold uppercase tracking-wider mb-1">Full Name</span>
                <span className="text-sm font-bold text-[#0F172A]">{student?.fullName || student?.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block font-semibold uppercase tracking-wider mb-1">Student ID</span>
                <span className="text-sm font-bold text-[#0F172A]">{student?.studentId || student?.student_id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Transaction Particulars</h4>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[#64748B]">Reserved Hostel:</span>
                <span className="font-bold text-[#0F172A]">{payment.booking?.hostels?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[#64748B]">Method Settle:</span>
                <span className="font-bold text-[#0F172A] uppercase">{payment.method}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-[#E2E8F0] pt-3 mt-1">
                <span className="font-semibold text-[#64748B]">Total Amount:</span>
                <span className="font-black text-[#1D4ED8]">GH₵1,500.00</span>
              </div>
            </div>
          </div>

          {/* Uploaded Slip Image */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Receipt Document Upload</h4>
            <div className="relative aspect-[4/3] bg-[#F1F5F9] rounded-xl overflow-hidden border border-[#E2E8F0] flex items-center justify-center group shadow-sm">
              <ImageIcon className="text-[#CBD5E1] absolute" size={48} />
              <div className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye size={18} /> Open Document
                </span>
              </div>
              {/* Mock receipt view */}
              <div className="absolute bottom-3 left-3 bg-[#0F172A]/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                GCB_DEPOSIT_SLIP.PNG
              </div>
            </div>
          </div>

        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex gap-3">
          {payment.status === 'PENDING' ? (
            <>
              <button 
                onClick={onReject}
                className="btn flex-1 bg-[#FEF2F2] border border-[#DC2626]/20 text-[#DC2626] hover:bg-[#FEE2E2]"
              >
                <Ban size={16} /> Reject
              </button>
              <button 
                onClick={onVerify}
                className="btn btn-primary flex-1 bg-[#059669] hover:bg-[#047857]"
              >
                <Check size={16} /> Verify Slip
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="btn flex-1 bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              Close Auditor
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
