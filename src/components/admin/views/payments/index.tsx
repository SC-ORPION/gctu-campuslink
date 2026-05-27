'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';

import PaymentFilters from './PaymentFilters';
import PaymentsTable from './PaymentsTable';
import VerifyPaymentModal from './VerifyPaymentModal';
import RejectPaymentModal from './RejectPaymentModal';
import PaymentPreviewDrawer from './PaymentPreviewDrawer';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Drawer states
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
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
    const bookingId = selectedBookingId || selectedPayment?.bookingId;
    if (!bookingId) return;

    setActionLoading(true);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
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
      setShowDrawer(false);
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
    } finally {
      setActionLoading(false);
      setSelectedPayment(null);
      setSelectedBookingId(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedPayment) return;
    setActionLoading(true);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedPayment.bookingId,
          reason: reason
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to reject payment.');
      }
      setSuccessMsg('Deposit Slip Rejected. Notification dispatch active.');
      setShowRejectModal(false);
      setShowDrawer(false);
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
      setSelectedPayment(null);
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="premium-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="premium-card-title text-2xl mb-1">Payment Verification Queue</h1>
          <p className="text-sm font-medium text-[#64748B]">Audit GCTU bank receipt uploads and cashier deposit slips.</p>
        </div>
        <PaymentFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
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
        <PaymentsTable 
          payments={filteredPayments}
          onOpenVerifyModal={(bookingId) => {
            setSelectedBookingId(bookingId);
            setShowVerifyModal(true);
          }}
          onOpenDrawer={(p) => {
            setSelectedPayment(p);
            setShowDrawer(true);
          }}
        />
      )}

      {/* Slip Auditor Drawer */}
      <PaymentPreviewDrawer 
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onVerify={() => setShowVerifyModal(true)}
        onReject={() => setShowRejectModal(true)}
      />

      {/* Verification Checkpoint Modal */}
      <VerifyPaymentModal 
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setSelectedBookingId(null);
        }}
        onConfirm={handleVerifyConfirm}
        loading={actionLoading}
        studentName={selectedPayment?.booking?.users?.full_name}
      />

      {/* Rejection Input Modal */}
      <RejectPaymentModal 
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
        studentName={selectedPayment?.booking?.users?.full_name}
      />
    </div>
  );
}
