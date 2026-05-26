import React from 'react';
import { Banknote } from 'lucide-react';

interface CashPaymentPanelProps {
  reference: string;
  setReference: (ref: string) => void;
}

export default function CashPaymentPanel({ reference, setReference }: CashPaymentPanelProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mx-auto">
        <Banknote size={24} />
      </div>
      <h3 className="text-sm font-black text-slate-800">Cash Payment at Office</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
        Visit the Academic Hall or Finance Hall office blocks at GCTU main campus to settle in cash. Enter the official cashier receipt number below.
      </p>
      
      <div className="flex flex-col gap-2 text-left">
        <label className="text-xs font-bold text-slate-700">Receipt Number</label>
        <input 
          type="text" 
          placeholder="Enter Cashier receipt number..." 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
