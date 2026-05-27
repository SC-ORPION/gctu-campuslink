'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

import PaymentTabs from './PaymentTabs';
import OnlinePaymentPanel from './OnlinePaymentPanel';
import BankTransferPanel from './BankTransferPanel';
import CashPaymentPanel from './CashPaymentPanel';
import VerificationStatus from './VerificationStatus';
import PaymentProofUploader from './PaymentProofUploader';

export default function StudentPaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ONLINE' | 'BANK' | 'CASH'>('ONLINE');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  // Form Fields
  const [reference, setReference] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActiveBooking();
    }
  }, [user]);

  const fetchActiveBooking = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, hostels(name)')
        .eq('user_id', user.id)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setBooking(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitLoading(true);

    try {
      const response = await fetch('/api/student/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          method: activeTab,
          reference: activeTab === 'ONLINE' ? `ONL-${Math.floor(Math.random() * 1000000)}` : reference.trim(),
          proofImage: proofUrl || 'http://placeholder.supabase.co/proof.png'
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to submit payment.');
      }

      setSuccessMsg(activeTab === 'ONLINE' ? 'Instant Online Payment Successful! Your room has been allocated.' : 'Receipt reference submitted successfully! Awaiting finance verification.');
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Payment submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="premium-card h-24 bg-slate-100"></div>
        <div className="premium-card h-64 bg-slate-100"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16 premium-card max-w-xl mx-auto">
        <AlertTriangle className="text-[#D97706] mx-auto mb-4 animate-bounce" size={40} />
        <h3 className="text-lg font-bold text-[#0F172A] mb-2">No Active Booking Found</h3>
        <p className="text-sm text-[#64748B] max-w-sm mx-auto font-medium">Please select a hostel first before proceeding to make payments.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="premium-card !border-t-4 !border-t-[#1D4ED8]">
        <h2 className="premium-card-title">Hostel Settlement Fee</h2>
        <p className="text-sm font-medium text-[#64748B] mt-1">
          Settling request for <span className="font-bold text-[#1D4ED8]">{booking.hostels?.name}</span>. Total Fee: <span className="font-bold text-[#0F172A]">GH₵ 1,500.00</span>
        </p>
      </div>

      {/* Tabs Selection list */}
      <PaymentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="premium-card">
        <form onSubmit={handleSubmitPayment} className="space-y-6">
          {activeTab === 'ONLINE' && <OnlinePaymentPanel />}

          {activeTab === 'BANK' && (
            <div className="space-y-6">
              <BankTransferPanel reference={reference} setReference={setReference} />
              <PaymentProofUploader onUploadComplete={(url) => setProofUrl(url)} />
            </div>
          )}

          {activeTab === 'CASH' && (
            <div className="space-y-6">
              <CashPaymentPanel reference={reference} setReference={setReference} />
              <PaymentProofUploader onUploadComplete={(url) => setProofUrl(url)} />
            </div>
          )}

          {booking.payment_status && booking.payment_status !== 'UNPAID' && (
            <div className="pt-2">
              <VerificationStatus 
                status={booking.payment_status === 'PAID' ? 'VERIFIED' : 'PENDING'} 
              />
            </div>
          )}

          {successMsg && (
            <div className="bg-[#D1FAE5] border border-[#A7F3D0] p-4 rounded-xl text-sm font-bold text-[#059669] flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] p-4 rounded-xl text-sm font-bold text-[#DC2626]">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitLoading} 
            className="btn btn-primary w-full h-14"
          >
            {submitLoading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Confirm Payment Settlement'}
          </button>
        </form>
      </div>
    </div>
  );
}
