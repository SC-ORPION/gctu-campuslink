import React from 'react';
import { Home, Users, CheckCircle2, UserCheck } from 'lucide-react';

interface OccupancyOverviewProps {
  totalHostels?: number;
  allocatedStudents?: number;
  totalCapacity?: number;
  registeredStudents?: number;
}

export default function OccupancyOverview({
  totalHostels = 0,
  allocatedStudents = 0,
  totalCapacity = 0,
  registeredStudents = 0
}: OccupancyOverviewProps) {
  const stats = [
    { label: 'Total Hostels', value: totalHostels.toString(), icon: <Home size={18} />, color: 'text-gold', bg: 'bg-gold/10 border-gold/15' },
    { label: 'Registered Students', value: registeredStudents.toString(), icon: <Users size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15' },
    { label: 'Allocated Students', value: allocatedStudents.toString(), icon: <UserCheck size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
    { label: 'Total Capacity', value: totalCapacity.toString(), icon: <CheckCircle2 size={18} />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/15' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((s, idx) => (
        <div key={idx} className="bg-[#0a2240]/60 backdrop-blur-sm p-5 rounded-2xl border-l-8 border-l-[#d4af37] border border-[#1e5faf]/25 flex items-center gap-4 hover:border-[#1e5faf]/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.bg} ${s.color}`}>
            {s.icon}
          </div>
          <div className="text-left">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">{s.label}</span>
            <h4 className="text-2xl font-extrabold text-white mt-0.5 leading-none">{s.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );
}

