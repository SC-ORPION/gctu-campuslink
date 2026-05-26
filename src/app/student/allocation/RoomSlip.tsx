'use client';

import React from 'react';
import { ShieldCheck, MapPin, Calendar, Printer, Shield, User, AlertCircle, QrCode } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface RoomSlipProps {
  roomNumber: string;
  buildingName: string;
  academicYear?: string;
}

export default function RoomSlip({ roomNumber, buildingName, academicYear = '2026/2027 Academic Session' }: RoomSlipProps) {
  const { user } = useAuth();
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Room Slip Container */}
      <div id="printable-room-slip" className="bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden print:border-none print:shadow-none print:p-0">
        
        {/* Academic Watermark Seal behind */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-100/40 dark:text-zinc-900/10 pointer-events-none select-none print:opacity-30">
          <QrCode size={180} />
        </div>

        {/* 1. Header with institutional logo mock */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e5faf]/15 dark:border-zinc-900 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#1e5faf]/15 dark:border-zinc-800 flex items-center justify-center bg-[#0a2240]/60 backdrop-blur-sm flex-shrink-0">
              <img src="/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-50 leading-none">GHANA COMMUNICATION TECHNOLOGY UNIVERSITY</h2>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mt-1">OFFICIAL HALL ALLOCATION STATEMENT</span>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="inline-flex bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider items-center gap-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <ShieldCheck size={11} /> VERIFIED BY RESIDENTIAL BOARD
            </span>
          </div>
        </div>

        {/* 2. Roster and core details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Student Full Name</span>
                <p className="text-xs font-black text-white dark:text-zinc-200 mt-0.5">{user?.full_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Student ID Number</span>
                <p className="text-xs font-mono font-bold text-slate-850 dark:text-zinc-200 mt-0.5">{user?.student_id || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Allocated Residence</span>
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{buildingName} Block</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Assigned Room Number</span>
                <p className="text-xs font-black text-slate-850 dark:text-zinc-200 mt-0.5">Room {roomNumber}</p>
              </div>
            </div>

            <div className="bg-[#06182e]/40 dark:bg-zinc-900/40 border border-[#1e5faf]/15 dark:border-zinc-900 p-3.5 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
              💡 **Check-in Instructions:** Present a printed copy of this official statement along with your GCTU Student ID card and a copy of your bank payment slip to the Hall Warden at the hostel front desk to collect your key.
            </div>
          </div>

          <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#1e5faf]/15 dark:border-zinc-900 pt-6 md:pt-0 md:pl-6 text-left">
            <div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Duration Period</span>
              <p className="text-xs font-black text-white dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>{academicYear}</span>
              </p>
            </div>

            {/* Official Seal / Signature visual */}
            <div className="pt-4 mt-4 border-t border-slate-50 dark:border-zinc-900/80">
              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Electronic Token</span>
              <span className="font-mono text-[9px] font-bold text-slate-350 dark:text-zinc-650 block mt-0.5">AUTH-2026-XP-099238</span>
              <div className="w-full bg-[#0f3058]/30 dark:bg-zinc-900 h-6 mt-2 rounded flex items-center justify-center font-mono text-[8px] tracking-[6px] text-slate-400 dark:text-zinc-600 font-bold select-none border border-[#1e5faf]/15/50 dark:border-zinc-800">
                ||||||||||||||||||||||||||||||||||||||||||||||||
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Action Controls - Hidden during prints */}
      <div className="flex items-center justify-between gap-4 bg-[#06182e]/40 dark:bg-zinc-900/30 p-4 rounded-2xl border border-[#1e5faf]/15 dark:border-zinc-900 print:hidden">
        <div className="flex items-center gap-2 text-left">
          <Printer size={16} className="text-indigo-650" />
          <div>
            <span className="text-xs font-bold text-white dark:text-zinc-200 block">Print Allocation Statement</span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold block">Generate official paper slip for checking in to GCTU warden.</span>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-colors flex items-center gap-1.5"
        >
          <Printer size={13} />
          <span>Print Statement</span>
        </button>
      </div>
    </div>
  );
}
