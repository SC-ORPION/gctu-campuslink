import React from 'react';
import { CreditCard, Landmark, Banknote } from 'lucide-react';

interface PaymentTabsProps {
  activeTab: 'ONLINE' | 'BANK' | 'CASH';
  setActiveTab: (tab: 'ONLINE' | 'BANK' | 'CASH') => void;
}

export default function PaymentTabs({ activeTab, setActiveTab }: PaymentTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 bg-[#0f3058]/30 p-1.5 rounded-2xl border border-[#1e5faf]/15">
      {(['ONLINE', 'BANK', 'CASH'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${
            activeTab === tab 
              ? 'bg-[#0a2240]/60 backdrop-blur-sm text-slate-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#1e5faf]/15/50' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {tab === 'ONLINE' && <CreditCard size={14} />}
          {tab === 'BANK' && <Landmark size={14} />}
          {tab === 'CASH' && <Banknote size={14} />}
          <span>{tab.toLowerCase()}</span>
        </button>
      ))}
    </div>
  );
}
