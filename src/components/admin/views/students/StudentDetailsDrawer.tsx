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
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between h-full border-l border-[#E2E8F0] animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col items-center justify-center bg-[#F8FAFC] text-center gap-3 relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-2 rounded-full hover:bg-[#F1F5F9]">
            <X size={20} />
          </button>
          
          <div className="w-24 h-24 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-[#d4af37] shadow-md">
            {student.avatar_url ? (
              <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
            ) : (
              <User size={40} />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#0F172A]">{student.full_name}</h3>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1">Index ID: {student.student_id || 'N/A'}</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4af37]/10 text-[#a3801a] rounded-full border border-[#d4af37]/20 text-[10px] font-black uppercase tracking-widest mt-2">
              Level {student.level || '100'} • {student.gender || 'MIXED'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-left">
          
          {/* Identity info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Personal Credentials</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] block uppercase tracking-wider mb-1">Full Name</span>
                <span className="text-sm font-bold text-[#0F172A]">{student.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] block uppercase tracking-wider mb-1">Gender Group</span>
                <span className="text-sm font-bold text-[#0F172A] uppercase">{student.gender || 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] block uppercase tracking-wider mb-1">Date of Birth</span>
                <span className="text-sm font-bold text-[#0F172A]">{student.date_of_birth || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] block uppercase tracking-wider mb-1">Academic Level</span>
                <span className="text-sm font-bold text-[#0F172A]">Level {student.level || '100'}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-sm text-[#475569] font-medium">
                <Mail size={16} className="text-[#94A3B8]" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#475569] font-medium">
                <Phone size={16} className="text-[#94A3B8]" />
                <span>{student.phone || '+233 24 123 4567'}</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Academic Enrolment</h4>
            {(() => {
              const academics = Array.isArray(student.student_academics) 
                ? student.student_academics[0] 
                : student.student_academics;

              if (!academics) {
                return (
                  <div className="text-xs font-medium text-[#64748B] italic">
                    No academic records synced yet.
                  </div>
                );
              }

              return (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">
                      {academics.faculties?.name || 'Faculty Not Specified'}
                    </div>
                    <div className="text-xs text-[#64748B] font-medium mt-1">
                      {academics.programs?.name || academics.departments?.name || 'General Program'} — Level {academics.level || student.level || '100'}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Contact & Location Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Residential Addresses</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <span className="text-[10px] text-[#64748B] block uppercase tracking-wider mb-1">Home Address</span>
                <span className="text-slate-800 font-bold">{student.home_address || 'Not Provided'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block uppercase tracking-wider mb-1">Digital Address</span>
                <span className="text-slate-800 font-bold">{student.digital_address || 'Not Provided'}</span>
              </div>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Emergency Contact</h4>
            {student.guardian_name ? (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl text-xs font-medium space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Guardian Name:</span>
                  <span className="font-bold text-[#0F172A]">{student.guardian_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Relationship:</span>
                  <span className="font-bold text-[#0F172A] capitalize">{student.guardian_relationship || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Phone Number:</span>
                  <span className="font-bold text-[#1D4ED8]">{student.guardian_phone || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#94A3B8] italic">No guardian information recorded.</div>
            )}
          </div>

          {/* Allocation Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest border-b border-[#E2E8F0] pb-2">Accommodation Status</h4>
            {activeBooking ? (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-[#64748B]">Reserved Hostel:</span>
                  <span className="font-bold text-[#0F172A]">{activeBooking.hostels?.name || 'Tesano Palace'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-[#64748B]">Allotment State:</span>
                  <span className="status-badge info">
                    {activeBooking.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-[#64748B]">Payment Flag:</span>
                  <span className={`status-badge ${
                    activeBooking.payment_status === 'PAID' ? 'success' : 'warning'
                  }`}>
                    {activeBooking.payment_status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#94A3B8] font-medium italic p-4 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2E8F0] text-center">
                No active hostel booking requests on file.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex gap-2">
          <button 
            onClick={onClose}
            className="btn flex-1 bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
