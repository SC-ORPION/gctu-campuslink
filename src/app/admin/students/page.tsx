'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Users, Search, ShieldAlert, ShieldCheck, 
  Trash2, Ban, Lock, Unlock, Loader2, CheckCircle2 
} from 'lucide-react';
import ConfirmActionModal from '../../../components/admin/ConfirmActionModal';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals management
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, bookings(*, allocations(*))')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    setSuccessMsg(null);
    try {
      const nextStatus = selectedStudent.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      setSuccessMsg(`Student profile updated to ${nextStatus} successfully.`);
      setShowBlockModal(false);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Block action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedStudent) return;
    const activeBooking = selectedStudent.bookings?.find((b: any) => b.status !== 'CANCELLED');
    if (!activeBooking) return;

    setActionLoading(true);
    setSuccessMsg(null);
    try {
      // Direct update to Supabase tables representing structural cancel rules
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED', payment_status: 'FAILED' })
        .eq('id', activeBooking.id);

      if (bookingErr) throw bookingErr;

      // Clean active room allocations associated with this booking
      await supabase
        .from('allocations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('booking_id', activeBooking.id);

      setSuccessMsg('Active booking successfully cancelled. Associated room allocations revoked.');
      setShowCancelModal(false);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Booking cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = students.filter((s: any) => {
    const name = s.full_name?.toLowerCase() || '';
    const sid = s.student_id?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    return name.includes(query) || sid.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Student Directory</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage institutional student profile blocks and active hostel bookings.</p>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl max-w-xs w-full">
          <Search size={16} className="text-slate-400 ml-1" />
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
        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} />
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
                <th>Gender</th>
                <th>Status</th>
                <th>Active Booking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const activeBooking = s.bookings?.find((b: any) => b.status !== 'CANCELLED');
                return (
                  <tr key={s.id}>
                    <td className="font-extrabold text-slate-800">{s.full_name}</td>
                    <td className="font-mono text-slate-400">{s.student_id || 'N/A'}</td>
                    <td className="font-bold text-slate-600 uppercase">{s.gender || 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        s.status === 'BLOCKED' ? 'badge-danger' : 'badge-success'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      {activeBooking ? (
                        <span className="badge badge-primary">{activeBooking.status}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic">None</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setShowBlockModal(true);
                          }}
                          className={`font-bold text-[10px] px-3 py-1.5 rounded-lg border flex items-center gap-1 shadow-sm uppercase tracking-wide ${
                            s.status === 'BLOCKED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-150 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 border-red-150 hover:bg-red-100'
                          }`}
                        >
                          {s.status === 'BLOCKED' ? <Unlock size={11} /> : <Ban size={11} />}
                          <span>{s.status === 'BLOCKED' ? 'Unblock' : 'Block'}</span>
                        </button>

                        {activeBooking && (
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setShowCancelModal(true);
                            }}
                            className="bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wide flex items-center gap-1 shadow-sm"
                          >
                            <Trash2 size={11} /> Cancel Booking
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-bold italic">
                    No matching student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Block Confirmation Modal */}
      <ConfirmActionModal 
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleToggleBlock}
        title={selectedStudent?.status === 'BLOCKED' ? 'Unblock Student Account?' : 'Block Student Account?'}
        description={`Set status flag for ${selectedStudent?.full_name || 'student'}`}
        warningText={
          selectedStudent?.status === 'BLOCKED'
            ? 'Proceeding will restore standard student cockpit access. The student will be able to book rooms and verify payments.'
            : 'WARNING: Blocking this student immediately restricts cockpit access. They will be barred from creating bookings or requesting room allocations.'
        }
        confirmText={selectedStudent?.status === 'BLOCKED' ? 'Confirm Unblock' : 'Confirm Block'}
        loading={actionLoading}
      />

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmActionModal 
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Active Booking?"
        description="Terminating active hostel booking"
        warningText={`WARNING: This action cancels the current booking request held by ${selectedStudent?.full_name || 'the student'}. It will instantly revoke any assigned room bed slots and clear records.`}
        confirmText="Cancel Booking"
        loading={actionLoading}
      />
    </div>
  );
}
