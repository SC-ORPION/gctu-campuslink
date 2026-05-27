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
    <div className="premium-table-container">
      <table className="premium-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Student ID</th>
            <th>Hostel Block</th>
            <th>Building Name</th>
            <th>Room Number</th>
            <th>Occupants</th>
            <th className="text-right">Clearance Action</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a) => {
            const student = a.booking?.users;
            return (
              <tr key={a.id}>
                <td className="font-semibold text-[#0F172A]">{student?.fullName || student?.full_name || 'N/A'}</td>
                <td className="font-mono text-[#64748B] text-xs">{student?.studentId || student?.student_id || 'N/A'}</td>
                <td className="text-[#475569]">{a.booking?.hostels?.name}</td>
                <td className="font-bold text-[#475569]">{a.rooms?.buildings?.name}</td>
                <td className="font-bold text-[#1D4ED8]">Room {a.rooms?.roomNumber || a.rooms?.room_number}</td>
                <td>
                  <span className="status-badge info">
                    {a.rooms?.currentOccupancy ?? a.rooms?.current_occupancy} / {a.rooms?.capacity} beds
                  </span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => onOpenRevokeModal(a)}
                    className="btn bg-[#FEF2F2] border border-[#DC2626]/20 text-[#DC2626] hover:bg-[#FEE2E2] h-8 px-3 text-xs ml-auto"
                  >
                    <Trash2 size={14} /> Revoke
                  </button>
                </td>
              </tr>
            );
          })}
          {allocations.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-12 text-[#64748B] font-medium text-sm">
                No active roommate allocations recorded.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
