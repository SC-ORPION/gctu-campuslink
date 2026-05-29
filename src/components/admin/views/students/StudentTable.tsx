import React from 'react';
import { Ban, Unlock, Trash2, Eye, User } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  gender: string;
  status: string;
  bookings: any[];
  avatar_url?: string;
  level?: number;
}

interface StudentTableProps {
  students: Student[];
  onOpenBlockModal: (student: Student) => void;
  onOpenCancelModal: (student: Student) => void;
  onOpenDrawer: (student: Student) => void;
}

export default function StudentTable({
  students,
  onOpenBlockModal,
  onOpenCancelModal,
  onOpenDrawer
}: StudentTableProps) {
  return (
    <div className="premium-table-container">
      <table className="premium-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Student ID</th>
            <th>Gender</th>
            <th>Status</th>
            <th>Active Booking</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const activeBooking = s.bookings?.find((b: any) => b.status !== 'CANCELLED');
            return (
              <tr key={s.id}>
                <td className="font-semibold text-[#0F172A]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center">
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={14} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-none mb-1">{s.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Level {s.level || '100'}</div>
                    </div>
                  </div>
                </td>
                <td className="font-mono text-[#64748B] text-xs">{s.student_id || 'N/A'}</td>
                <td className="uppercase text-[#475569]">{s.gender || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${
                    s.status === 'BLOCKED' ? 'danger' : 'success'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td>
                  {activeBooking ? (
                    <span className="status-badge info">
                      {activeBooking.status}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#94A3B8] italic">None</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex gap-2 justify-end">
                    
                    <button
                      onClick={() => onOpenDrawer(s)}
                      className="btn btn-secondary h-8 px-3 text-xs"
                    >
                      <Eye size={14} /> View
                    </button>

                    <button
                      onClick={() => onOpenBlockModal(s)}
                      className={`btn h-8 px-3 text-xs ${
                        s.status === 'BLOCKED'
                          ? 'bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5] border border-[#059669]/20'
                          : 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] border border-[#DC2626]/20'
                      }`}
                    >
                      {s.status === 'BLOCKED' ? <Unlock size={14} /> : <Ban size={14} />}
                      <span>{s.status === 'BLOCKED' ? 'Unblock' : 'Block'}</span>
                    </button>

                    {activeBooking && (
                      <button
                        onClick={() => onOpenCancelModal(s)}
                        className="btn btn-primary h-8 px-3 text-xs"
                      >
                        <Trash2 size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-12 text-[#64748B] font-medium text-sm">
                No matching student records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
