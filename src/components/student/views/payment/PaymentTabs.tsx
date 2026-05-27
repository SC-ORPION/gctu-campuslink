import React from 'react';
import { CreditCard, Landmark, Banknote } from 'lucide-react';

interface PaymentTabsProps {
  activeTab: 'ONLINE' | 'BANK' | 'CASH';
  setActiveTab: (tab: 'ONLINE' | 'BANK' | 'CASH') => void;
}

export default function PaymentTabs({ activeTab, setActiveTab }: PaymentTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 bg-[#F1F5F9] p-1.5 rounded-2xl border border-[#E2E8F0]">
      {(['ONLINE', 'BANK', 'CASH'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeTab === tab 
              ? 'bg-white text-[#1D4ED8] shadow-sm border border-[#E2E8F0]' 
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          {tab === 'ONLINE' && <CreditCard size={16} />}
          {tab === 'BANK' && <Landmark size={16} />}
          {tab === 'CASH' && <Banknote size={16} />}
          <span>{tab.toLowerCase()}</span>
        </button>
      ))}
    </div>
  );
}
