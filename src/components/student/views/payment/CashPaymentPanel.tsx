import React from 'react';
import { Banknote } from 'lucide-react';

interface CashPaymentPanelProps {
  reference: string;
  setReference: (ref: string) => void;
}

export default function CashPaymentPanel({ reference, setReference }: CashPaymentPanelProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto">
        <Banknote size={24} />
      </div>
      <h3 className="text-sm font-bold text-[#0F172A]">Cash Payment at Office</h3>
      <p className="text-xs font-medium text-[#64748B] max-w-sm mx-auto leading-relaxed">
        Visit the Academic Hall or Finance Hall office blocks at GCTU main campus to settle in cash. Enter the official cashier receipt number below.
      </p>
      
      <div className="flex flex-col gap-2 text-left">
        <label className="text-xs font-bold text-[#475569]">Receipt Number</label>
        <input 
          type="text" 
          placeholder="Enter Cashier receipt number..." 
          className="form-input"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
