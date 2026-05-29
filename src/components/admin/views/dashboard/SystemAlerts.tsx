import React from 'react';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

export default function SystemAlerts() {
  const alerts = [
    { id: 1, title: 'High Occupancy Alert', text: 'Tesano Palace female rooms are at 94% capacity. Action recommended.', type: 'WARNING' },
    { id: 2, title: 'Unverified Payments', text: '18 cash cashier reference slips are pending verification by the finance desk.', type: 'INFO' }
  ];

  return (
    <div className="bg-[#0a2240]/60 backdrop-blur-sm p-5 rounded-2xl border-t-4 border-t-gold border border-[#1e5faf]/25 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.1em]">Active System Feeds</h3>
        <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-500/15 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Live
        </span>
      </div>

      <div className="space-y-2.5">
        {alerts.map((a) => (
          <div key={a.id} className="p-3.5 bg-[#06182e]/40 border border-[#1e5faf]/10 rounded-xl flex gap-3 items-start hover:border-[#1e5faf]/20 transition-colors">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              a.type === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-gold/10 text-gold'
            }`}>
              <AlertCircle size={14} />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <span>{a.title}</span>
                <ArrowUpRight size={10} className="text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{a.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
