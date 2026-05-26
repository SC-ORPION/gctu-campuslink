import React from 'react';
import { Ban, Unlock, Trash2, Eye } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  gender: string;
  status: string;
  bookings: any[];
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
    <div className="overflow-x-auto bg-white dark:bg-zinc-950 border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] rounded-2xl text-left">
      <table className="w-full text-left text-xs text-slate-650 dark:text-zinc-400">
        <thead>
          <tr className="border-b border-[#1e5faf]/15 dark:border-zinc-900 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            <th className="p-4">Student</th>
            <th className="p-4">Student ID</th>
            <th className="p-4">Gender</th>
            <th className="p-4">Status</th>
            <th className="p-4">Active Booking</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/50">
          {students.map((s) => {
            const activeBooking = s.bookings?.find((b: any) => b.status !== 'CANCELLED');
            return (
              <tr key={s.id} className="hover:bg-[#06182e]/40/50 dark:hover:bg-zinc-900/30 transition-colors">
                <td className="p-4 font-black text-white dark:text-zinc-200">{s.full_name}</td>
                <td className="p-4 font-mono text-slate-400 dark:text-zinc-550">{s.student_id || 'N/A'}</td>
                <td className="p-4 font-bold text-slate-500 dark:text-zinc-500 uppercase">{s.gender || 'N/A'}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    s.status === 'BLOCKED' 
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border-rose-250 dark:border-rose-900/30' 
                      : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/30'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-4">
                  {activeBooking ? (
                    <span className="inline-flex bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      {activeBooking.status}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 dark:text-zinc-700 italic">None</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    
                    <button
                      onClick={() => onOpenDrawer(s)}
                      className="bg-[#06182e]/40 hover:bg-[#0f3058]/30 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-[#1e5faf]/15 dark:border-zinc-800 text-slate-300 dark:text-zinc-300 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)] uppercase tracking-wide"
                    >
                      <Eye size={11} /> View
                    </button>

                    <button
                      onClick={() => onOpenBlockModal(s)}
                      className={`font-bold text-[10px] px-2.5 py-1.5 rounded-lg border flex items-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)] uppercase tracking-wide transition-colors ${
                        s.status === 'BLOCKED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                          : 'bg-red-50 dark:bg-rose-950/20 text-red-600 dark:text-rose-400 border-red-150 dark:border-rose-900/30 hover:bg-red-100 dark:hover:bg-rose-900'
                      }`}
                    >
                      {s.status === 'BLOCKED' ? <Unlock size={11} /> : <Ban size={11} />}
                      <span>{s.status === 'BLOCKED' ? 'Unblock' : 'Block'}</span>
                    </button>

                    {activeBooking && (
                      <button
                        onClick={() => onOpenCancelModal(s)}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors uppercase tracking-wide flex items-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                      >
                        <Trash2 size={11} /> Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-zinc-650 font-bold italic">
                No matching student records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
