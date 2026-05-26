'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
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
        <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl h-24 border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"></div>
        <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl h-64 border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16 bg-[#0a2240]/60 backdrop-blur-sm border border-[#1e5faf]/15 rounded-2xl p-8 max-w-xl mx-auto shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <AlertTriangle className="text-amber-500 mx-auto mb-4 animate-bounce" size={32} />
        <h3 className="text-sm font-black text-white mb-1">No Active Booking Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">Please select a hostel first before proceeding to make payments.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <h2 className="text-lg font-black text-slate-900 dark:text-zinc-50">Hostel Settlement Fee</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Settling request for <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{booking.hostels?.name}</span>. Total Fee: <span className="font-extrabold text-white dark:text-zinc-200">GH₵ 1,500.00</span>
        </p>
      </div>

      {/* Tabs Selection list */}
      <PaymentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
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
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg text-xs font-bold text-rose-800 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitLoading} 
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-xs rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Payment Settlement'}
          </button>
        </form>
      </div>
    </div>
  );
}
