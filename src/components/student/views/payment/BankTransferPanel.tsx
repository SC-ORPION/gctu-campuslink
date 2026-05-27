import React, { useState } from 'react';
import { Copy, ShieldCheck } from 'lucide-react';

interface BankTransferPanelProps {
  reference: string;
  setReference: (ref: string) => void;
}

export default function BankTransferPanel({ reference, setReference }: BankTransferPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('GCTU-HOSTELS-0192837');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[#0F172A]">Institutional Bank Transfer</h3>
      <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] space-y-3">
        <div className="flex justify-between">
          <span>Bank Name:</span>
          <span className="font-bold text-[#0F172A]">GCB Bank PLC</span>
        </div>
        <div className="flex justify-between">
          <span>Account Name:</span>
          <span className="font-bold text-[#0F172A]">GCTU Hostel Operations</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Account Number:</span>
          <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
            GCTU-HOSTELS-0192837
            <button type="button" onClick={handleCopy} className="text-[#1D4ED8] hover:text-[#1E3A8A] transition-colors">
              {copied ? <ShieldCheck size={16} className="text-[#059669]" /> : <Copy size={16} />}
            </button>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-[#475569]">Transaction Reference Number</label>
        <input 
          type="text" 
          placeholder="Enter GCB transaction ID..." 
          className="form-input"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
