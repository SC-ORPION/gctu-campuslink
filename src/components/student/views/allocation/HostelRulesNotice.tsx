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
    <div className="premium-card p-6 space-y-6">
      <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-2">
        <Info size={16} className="text-[#1D4ED8]" /> Building Guidelines & Rules
      </h2>

      <ul className="space-y-3.5 text-xs font-medium text-[#475569] text-left">
        {notices.map((notice, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] mt-1.5 flex-shrink-0" />
            <span>{notice}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
