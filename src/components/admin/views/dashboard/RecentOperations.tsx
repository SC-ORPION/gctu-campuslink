import React from 'react';

export default function RecentOperations() {
  const operations = [
    { text: 'Cashier receipt GCTU-928 verified for student index GCTU002401', time: '10 mins ago', type: 'PAYMENT' },
    { text: 'Auto-allocation engine triggered for 4 pending verified slots', time: '1 hour ago', type: 'SYSTEM' },
    { text: 'New building block "Tesano Elite Block B" added to listing registries', time: '4 hours ago', type: 'HOSTEL' }
  ];

  const typeColor: Record<string, string> = {
    PAYMENT: 'bg-emerald-400',
    SYSTEM: 'bg-[#d4af37]',
    HOSTEL: 'bg-[#4a9eff]',
  };

  return (
    <div className="bg-[#0a2240]/60 backdrop-blur-sm p-5 rounded-2xl border-t-4 border-t-blue-700 border border-[#1e5faf]/25 space-y-4">
      <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.1em]">Recent Operations</h3>

      <div className="space-y-3.5">
        {operations.map((op, idx) => (
          <div key={idx} className="flex gap-3 items-start text-left">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${typeColor[op.type] || 'bg-slate-500'}`} />
            <div className="flex-1">
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{op.text}</p>
              <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{op.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
