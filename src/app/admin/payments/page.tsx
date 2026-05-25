'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  CreditCard, Loader2, CheckCircle2, ShieldAlert,
  Search, Eye, HelpCircle 
} from 'lucide-react';
import ConfirmActionModal from '../../../components/admin/ConfirmActionModal';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, booking:bookings(*, users(*), hostels(name))')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyConfirm = async () => {
    if (!selectedBookingId) return;
    setActionLoading(true);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          adminId: 'd60f4e19-906d-4950-8bdf-4a6c6e7e012a', // Mock admin UUID
          reason: 'Verified manual deposit slip'
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to verify payment.');
      }
      setSuccessMsg('Deposit Slip Verified! Atomic room allocation has been triggered successfully.');
      setShowVerifyModal(false);
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((p: any) => {
    const student = p.booking?.users;
    const name = student?.full_name?.toLowerCase() || '';
    const sid = student?.student_id?.toLowerCase() || '';
    const ref = p.reference?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    return name.includes(query) || sid.includes(query) || ref.includes(query);
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-900">Payment Verification Workstation</h1>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Audit GCTU bank receipt uploads and deposit slips.</p>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg max-w-xs w-full">
          <Search size={14} className="text-slate-400 ml-1" />
          <input 
            type="text" 
            placeholder="Search by student name or ID..."
            className="bg-transparent border-none outline-none text-xs font-semibold w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="skeleton h-64 w-full"></div>
      ) : (
        <div className="dense-table-wrapper animate-fade-in">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Payment Method</th>
                <th>Transaction Reference</th>
                <th>Hostel Reserved</th>
                <th>Verification Status</th>
                <th>Clearance Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const student = p.booking?.users;
                // Calculate if payment is overdue (e.g. created > 24 hours ago)
                const isOverdue = p.status === 'PENDING' && (new Date().getTime() - new Date(p.created_at).getTime() > 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={p.id}>
                    <td className="font-extrabold text-slate-800">{student?.full_name || 'N/A'}</td>
                    <td className="font-mono text-slate-400">{student?.student_id || 'N/A'}</td>
                    <td className="font-bold text-slate-600">{p.method}</td>
                    <td className="font-mono font-bold text-blue-600 select-all">{p.reference || 'N/A'}</td>
                    <td>{p.booking?.hostels?.name}</td>
                    <td>
                      <span className={`badge ${
                        p.status === 'VERIFIED' ? 'badge-success' :
                        isOverdue ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {p.status === 'VERIFIED' ? 'Payment Verified' :
                         isOverdue ? 'Overdue Payments (>24h)' : 'Unverified Payments Queue'}
                      </span>
                    </td>
                    <td>
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setSelectedBookingId(p.bookingId);
                            setShowVerifyModal(true);
                          }}
                          className="bg-slate-900 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wide shadow-sm"
                        >
                          Verify Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-bold italic">
                    No active unverified payment slips found in workstation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification Checkpoint Modal */}
      <ConfirmActionModal 
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onConfirm={handleVerifyConfirm}
        title="Approve Bank Deposit Clearance?"
        description="Verify financial clearance for accommodation fees"
        warningText="WARNING: Approving this deposit verifies the student's booking clearance and automatically triggers the transaction-safe room allocation engine to assign a bed slot."
        confirmText="Approve Clearance"
        loading={actionLoading}
      />
    </div>
  );
}
