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
      <h3 className="text-sm font-black text-slate-800">Institutional Bank Transfer</h3>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 space-y-2">
        <div className="flex justify-between">
          <span>Bank Name:</span>
          <span className="font-extrabold text-slate-800">GCB Bank PLC</span>
        </div>
        <div className="flex justify-between">
          <span>Account Name:</span>
          <span className="font-extrabold text-slate-800">GCTU Hostel Operations</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Account Number:</span>
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            GCTU-HOSTELS-0192837
            <button type="button" onClick={handleCopy} className="text-blue-600 hover:text-blue-750">
              {copied ? <ShieldCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-700">Transaction Reference Number</label>
        <input 
          type="text" 
          placeholder="Enter GCB transaction ID..." 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
