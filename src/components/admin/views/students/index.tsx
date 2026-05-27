'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';

import StudentFilters from './StudentFilters';
import StudentTable from './StudentTable';
import StudentDetailsDrawer from './StudentDetailsDrawer';
import BlockStudentModal from './BlockStudentModal';
import RevokeBookingModal from './RevokeBookingModal';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawer management
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
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
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED', payment_status: 'FAILED' })
        .eq('id', activeBooking.id);

      if (bookingErr) throw bookingErr;

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
      <div className="premium-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="premium-card-title text-2xl mb-1">Student Directory</h1>
          <p className="text-sm font-medium text-[#64748B]">Manage institutional student profile blocks and active hostel bookings.</p>
        </div>
        <StudentFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>

      {successMsg && (
        <div className="bg-[#D1FAE5] border border-[#059669]/20 text-[#059669] p-4 rounded-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="premium-card animate-pulse h-64 bg-slate-100"></div>
      ) : (
        <StudentTable 
          students={filteredStudents}
          onOpenBlockModal={(s) => {
            setSelectedStudent(s);
            setShowBlockModal(true);
          }}
          onOpenCancelModal={(s) => {
            setSelectedStudent(s);
            setShowCancelModal(true);
          }}
          onOpenDrawer={(s) => {
            setSelectedStudent(s);
            setShowDrawer(true);
          }}
        />
      )}

      {/* Profile Dossier Drawer */}
      <StudentDetailsDrawer 
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />

      {/* Block Confirmation Modal */}
      <BlockStudentModal 
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleToggleBlock}
        studentName={selectedStudent?.full_name || ''}
        isBlocked={selectedStudent?.status === 'BLOCKED'}
        loading={actionLoading}
      />

      {/* Cancel Booking Confirmation Modal */}
      <RevokeBookingModal 
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleCancelBooking}
        studentName={selectedStudent?.full_name || ''}
        loading={actionLoading}
      />
    </div>
  );
}
