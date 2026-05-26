import React from 'react';
import { Trash2 } from 'lucide-react';

interface Allocation {
  id: string;
  booking: any;
  rooms: any;
  created_at: string;
}

interface AllocationTableProps {
  allocations: Allocation[];
  onOpenRevokeModal: (alloc: Allocation) => void;
}

export default function AllocationTable({
  allocations,
  onOpenRevokeModal
}: AllocationTableProps) {
  return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-950 border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] rounded-2xl text-left">
      <table className="w-full text-left text-xs text-slate-650 dark:text-zinc-400">
        <thead>
          <tr className="border-b border-[#1e5faf]/15 dark:border-zinc-900 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            <th className="p-4">Student</th>
            <th className="p-4">Student ID</th>
            <th className="p-4">Hostel Block</th>
            <th className="p-4">Building Name</th>
            <th className="p-4">Room Number</th>
            <th className="p-4">Occupants</th>
            <th className="p-4 text-right">Clearance Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/50">
          {allocations.map((a) => {
            const student = a.booking?.users;
            return (
              <tr key={a.id} className="hover:bg-[#06182e]/40/50 dark:hover:bg-zinc-900/30 transition-colors">
                <td className="p-4 font-black text-white dark:text-zinc-200">{student?.fullName || student?.full_name || 'N/A'}</td>
                <td className="p-4 font-mono text-slate-400 dark:text-zinc-550">{student?.studentId || student?.student_id || 'N/A'}</td>
                <td className="p-4 text-slate-200 dark:text-zinc-350">{a.booking?.hostels?.name}</td>
                <td className="p-4 font-bold text-slate-550 dark:text-zinc-450">{a.rooms?.buildings?.name}</td>
                <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">Room {a.rooms?.roomNumber || a.rooms?.room_number}</td>
                <td className="p-4">
                  <span className="inline-flex bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {a.rooms?.currentOccupancy ?? a.rooms?.current_occupancy} / {a.rooms?.capacity} beds
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => onOpenRevokeModal(a)}
                    className="bg-red-50 dark:bg-rose-950/20 text-red-650 dark:text-rose-400 border border-red-200 dark:border-rose-900/30 font-bold text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors uppercase tracking-wide flex items-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)] ml-auto"
                  >
                    <Trash2 size={11} /> Revoke
                  </button>
                </td>
              </tr>
            );
          })}
          {allocations.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-zinc-600 font-bold italic">
                No active roommate allocations recorded.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
