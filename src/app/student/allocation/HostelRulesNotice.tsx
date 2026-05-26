import React from 'react';
import { Info } from 'lucide-react';

export default function HostelRulesNotice() {
  const notices = [
    "Strict gender policy enforcement. Male and female students are not permitted cross-access to rooms.",
    "Gate lock curfew is strictly set at 10:00 PM daily. Emergency exceptions require hall coordinator approval.",
    "Subletting or harboring unauthorized external guest students is a serious breach of student code.",
    "Report any maintenance defects immediately to the office using incident logs."
  ];

  return (
    <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6">
      <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
        <Info size={16} className="text-indigo-600" /> Building Guidelines & Rules
      </h2>

      <ul className="space-y-3.5 text-xs font-semibold text-slate-300 text-left">
        {notices.map((notice, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
            <span>{notice}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
