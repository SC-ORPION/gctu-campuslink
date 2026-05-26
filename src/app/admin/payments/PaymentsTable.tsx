import React from 'react';
import { Eye, ShieldCheck, Landmark } from 'lucide-react';

interface Payment {
  id: string;
  method: string;
  reference: string;
  status: string;
  created_at: string;
  bookingId: string;
  booking: any;
}

interface PaymentsTableProps {
  payments: Payment[];
  onOpenVerifyModal: (bookingId: string) => void;
  onOpenDrawer: (payment: Payment) => void;
}

export default function PaymentsTable({
  payments,
  onOpenVerifyModal,
  onOpenDrawer
}: PaymentsTableProps) {
  return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-950 border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] rounded-2xl text-left">
      <table className="w-full text-left text-xs text-slate-650 dark:text-zinc-400">
        <thead>
          <tr className="border-b border-[#1e5faf]/15 dark:border-zinc-900 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            <th className="p-4">Student</th>
            <th className="p-4">Student ID</th>
            <th className="p-4">Payment Method</th>
            <th className="p-4">Transaction Reference</th>
            <th className="p-4">Hostel Reserved</th>
            <th className="p-4">Verification Status</th>
            <th className="p-4 text-right">Clearance Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/50">
          {payments.map((p) => {
            const student = p.booking?.users;
            const isOverdue = p.status === 'PENDING' && (new Date().getTime() - new Date(p.created_at).getTime() > 24 * 60 * 60 * 1000);
            
            return (
              <tr key={p.id} className="hover:bg-[#06182e]/40/50 dark:hover:bg-zinc-900/30 transition-colors">
                <td className="p-4 font-black text-white dark:text-zinc-200">{student?.fullName || student?.full_name || 'N/A'}</td>
                <td className="p-4 font-mono text-slate-400 dark:text-zinc-550">{student?.studentId || student?.student_id || 'N/A'}</td>
                <td className="p-4 font-bold text-slate-500 dark:text-zinc-500 uppercase">{p.method}</td>
                <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all">{p.reference || 'N/A'}</td>
                <td className="p-4 text-slate-200 dark:text-zinc-300">{p.booking?.hostels?.name}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    p.status === 'VERIFIED' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30' 
                      : isOverdue 
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border-rose-200 dark:border-rose-900/30 animate-pulse' 
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-200 dark:border-amber-900/30'
                  }`}>
                    {p.status === 'VERIFIED' ? 'Verified' :
                     isOverdue ? 'Overdue (>24h)' : 'Pending Review'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    
                    <button
                      onClick={() => onOpenDrawer(p)}
                      className="bg-[#06182e]/40 hover:bg-[#0f3058]/30 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-[#1e5faf]/15 dark:border-zinc-800 text-slate-200 dark:text-zinc-300 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)] uppercase tracking-wide"
                    >
                      <Eye size={11} /> Audit
                    </button>

                    {p.status === 'PENDING' && (
                      <button
                        onClick={() => onOpenVerifyModal(p.bookingId)}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-zinc-105 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors uppercase tracking-wide flex items-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                      >
                        <ShieldCheck size={11} /> Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {payments.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-zinc-600 font-bold italic">
                No active unverified payment slips found in workstation.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
