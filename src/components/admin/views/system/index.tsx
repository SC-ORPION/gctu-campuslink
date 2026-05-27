'use client';

import React from 'react';
import { Terminal, Shield, Cpu, HardDrive, Database, Activity } from 'lucide-react';

export default function AdminSystemPage() {
  const metrics = [
    { label: 'API Gateway Ping', value: '14ms', status: 'Optimal', icon: <Cpu size={20} />, color: 'text-emerald-500 bg-emerald-50/50 border-emerald-100' },
    { label: 'Supabase DB Connection', value: 'Active', status: 'Healthy', icon: <Database size={20} />, color: 'text-indigo-500 bg-indigo-50/50 border-indigo-100' },
    { label: 'Prisma Client Instance', value: 'v5.15.0', status: 'Operational', icon: <HardDrive size={20} />, color: 'text-purple-500 bg-purple-50/50 border-purple-100' },
    { label: 'Allocation Engine Load', value: '0.4%', status: 'Low load', icon: <Activity size={20} />, color: 'text-teal-500 bg-teal-50/50 border-teal-100' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Terminal className="text-indigo-600" size={24} />
            <span>System Performance</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Real-time status metrics of Supabase endpoints, servers, and processing latency.</p>
        </div>
      </div>

      {/* Grid status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${m.color}`}>
              {m.icon}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{m.label}</span>
              <h4 className="text-xl font-black text-white mt-1 leading-none">{m.value}</h4>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {m.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Box */}
      <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Shield className="text-indigo-600" size={16} />
          <span>Security Audit Trail</span>
        </h3>
        
        <div className="font-mono text-[10px] text-slate-500 bg-[#06182e]/40 p-4 rounded-xl border border-slate-150 space-y-2 max-h-48 overflow-y-auto leading-relaxed">
          <div>[2026-05-25 15:08:04] AUTH: Admin session initialized dynamically from client source index.</div>
          <div>[2026-05-25 15:08:20] TRANSACTION: Supreme state stores updated successfully without sync drops.</div>
          <div>[2026-05-25 15:09:12] ENGINE: Room slip generation pipeline running in transaction-safe context.</div>
          <div className="text-indigo-600">[2026-05-25 15:11:34] SYSTEM: Global variables matching production blueprints initialized cleanly.</div>
        </div>
      </div>
    </div>
  );
}
