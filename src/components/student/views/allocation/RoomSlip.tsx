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
      <div id="printable-room-slip" className="premium-card relative overflow-hidden print:border-none print:shadow-none print:p-0">
        
        {/* Academic Watermark Seal behind */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none select-none print:opacity-30">
          <QrCode size={180} />
        </div>

        {/* 1. Header with institutional logo mock */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E2E8F0] flex items-center justify-center bg-white flex-shrink-0">
              <img src="/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-[#0F172A] leading-none">GHANA COMMUNICATION TECHNOLOGY UNIVERSITY</h2>
              <span className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-widest block mt-1">OFFICIAL HALL ALLOCATION STATEMENT</span>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="status-badge success">
              <ShieldCheck size={11} className="mr-1 inline-block" /> VERIFIED BY RESIDENTIAL BOARD
            </span>
          </div>
        </div>

        {/* 2. Roster and core details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wide">Student Full Name</span>
                <p className="text-xs font-bold text-[#0F172A] mt-0.5">{user?.full_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wide">Student ID Number</span>
                <p className="text-xs font-mono font-bold text-[#0F172A] mt-0.5">{user?.student_id || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wide">Allocated Residence</span>
                <p className="text-xs font-bold text-[#1D4ED8] mt-0.5">{buildingName} Block</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wide">Assigned Room Number</span>
                <p className="text-xs font-bold text-[#0F172A] mt-0.5">Room {roomNumber}</p>
              </div>
            </div>

            <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-3.5 rounded-xl text-[10px] font-semibold text-[#1E3A8A] leading-relaxed">
              💡 **Check-in Instructions:** Present a printed copy of this official statement along with your GCTU Student ID card and a copy of your bank payment slip to the Hall Warden at the hostel front desk to collect your key.
            </div>
          </div>

          <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#E2E8F0] pt-6 md:pt-0 md:pl-6 text-left">
            <div>
              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Duration Period</span>
              <p className="text-xs font-bold text-[#0F172A] mt-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#64748B]" />
                <span>{academicYear}</span>
              </p>
            </div>

            {/* Official Seal / Signature visual */}
            <div className="pt-4 mt-4 border-t border-[#E2E8F0]">
              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Electronic Token</span>
              <span className="font-mono text-[9px] font-bold text-[#0F172A] block mt-0.5">AUTH-2026-XP-099238</span>
              <div className="w-full bg-[#F8FAFC] h-6 mt-2 rounded flex items-center justify-center font-mono text-[8px] tracking-[6px] text-[#94A3B8] font-bold select-none border border-[#E2E8F0]">
                ||||||||||||||||||||||||||||||||||||||||||||||||
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Action Controls - Hidden during prints */}
      <div className="flex items-center justify-between gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] print:hidden">
        <div className="flex items-center gap-2 text-left">
          <Printer size={16} className="text-[#1D4ED8]" />
          <div>
            <span className="text-xs font-bold text-[#0F172A] block">Print Allocation Statement</span>
            <span className="text-[10px] text-[#64748B] font-medium block">Generate official paper slip for checking in to GCTU warden.</span>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="btn btn-primary px-4 py-2"
        >
          <Printer size={13} />
          <span>Print Statement</span>
        </button>
      </div>
    </div>
  );
}
