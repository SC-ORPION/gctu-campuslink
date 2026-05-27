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
    <div className="premium-table-container">
      <table className="premium-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Student ID</th>
            <th>Payment Method</th>
            <th>Transaction Reference</th>
            <th>Hostel Reserved</th>
            <th>Verification Status</th>
            <th className="text-right">Clearance Action</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const student = p.booking?.users;
            const isOverdue = p.status === 'PENDING' && (new Date().getTime() - new Date(p.created_at).getTime() > 24 * 60 * 60 * 1000);
            
            return (
              <tr key={p.id}>
                <td className="font-semibold text-[#0F172A]">{student?.fullName || student?.full_name || 'N/A'}</td>
                <td className="font-mono text-[#64748B] text-xs">{student?.studentId || student?.student_id || 'N/A'}</td>
                <td className="uppercase text-[#475569]">{p.method}</td>
                <td className="font-mono font-bold text-[#1D4ED8] select-all">{p.reference || 'N/A'}</td>
                <td className="text-[#475569]">{p.booking?.hostels?.name}</td>
                <td>
                  <span className={`status-badge ${
                    p.status === 'VERIFIED' ? 'success' : isOverdue ? 'danger animate-pulse' : 'warning'
                  }`}>
                    {p.status === 'VERIFIED' ? 'Verified' : isOverdue ? 'Overdue (>24h)' : 'Pending Review'}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex gap-2 justify-end">
                    
                    <button
                      onClick={() => onOpenDrawer(p)}
                      className="btn btn-secondary h-8 px-3 text-xs"
                    >
                      <Eye size={14} /> Audit
                    </button>

                    {p.status === 'PENDING' && (
                      <button
                        onClick={() => onOpenVerifyModal(p.bookingId)}
                        className="btn btn-primary h-8 px-3 text-xs"
                      >
                        <ShieldCheck size={14} /> Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {payments.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-12 text-[#64748B] font-medium text-sm">
                No active unverified payment slips found in workstation.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
