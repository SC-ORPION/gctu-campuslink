import React from 'react';
import { X, User, Phone, Mail, Award, BookOpen, Clock } from 'lucide-react';

interface StudentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null;
}

export default function StudentDetailsDrawer({ isOpen, onClose, student }: StudentDetailsDrawerProps) {
  if (!isOpen || !student) return null;

  const activeBooking = student.bookings?.find((b: any) => b.status !== 'CANCELLED');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-screen max-w-md bg-[#0a2240]/60 backdrop-blur-sm shadow-2xl flex flex-col justify-between h-full border-l border-[#1e5faf]/15 animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1e5faf]/15 flex justify-between items-center bg-[#06182e]/40/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <User size={18} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white">Student Profile Dossier</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{student.student_id || 'Index ID N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          
          {/* Identity info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#1e5faf]/15 pb-2">Personal Credentials</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block">Full Name</span>
                <span className="text-xs font-bold text-slate-200">{student.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Gender Group</span>
                <span className="text-xs font-bold text-slate-200 uppercase">{student.gender || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Mail size={14} className="text-slate-400" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Phone size={14} className="text-slate-400" />
                <span>{student.phone || '+233 24 123 4567'}</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#1e5faf]/15 pb-2">Academic Enrolment</h4>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Faculty of Computing & Information Systems</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">BSc. Software Engineering — Year 3</div>
              </div>
            </div>
          </div>

          {/* Allocation Info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#1e5faf]/15 pb-2">Accommodation Status</h4>
            {activeBooking ? (
              <div className="bg-[#06182e]/40 border border-[#1e5faf]/15 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Reserved Hostel:</span>
                  <span className="font-bold text-white">{activeBooking.hostels?.name || 'Tesano Palace'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Allotment State:</span>
                  <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {activeBooking.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Payment Flag:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    activeBooking.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {activeBooking.payment_status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No active hostel booking requests on file.</div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1e5faf]/15 bg-[#06182e]/40/50 flex gap-2">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-[#0a2240]/60 backdrop-blur-sm border border-[#1e5faf]/15 text-slate-200 font-black text-xs rounded-xl hover:bg-[#06182e]/40 transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
