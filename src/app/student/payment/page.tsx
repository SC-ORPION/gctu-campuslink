'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  CreditCard, Landmark, Banknote, AlertTriangle, 
  CheckCircle2, Loader2, Copy, ShieldCheck 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentPaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ONLINE' | 'BANK' | 'CASH'>('ONLINE');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form Fields
  const [reference, setReference] = useState('');
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    navigator.clipboard.writeText('GCTU-HOSTELS-0192837');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          proofImage: 'http://placeholder.supabase.co/proof.png'
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
    return <div className="skeleton h-64 w-full"></div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8">
        <AlertTriangle className="text-amber-500 mx-auto mb-4 animate-bounce" size={32} />
        <h3 className="text-sm font-black text-slate-800 mb-1">No Active Booking</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">Please select a hostel first before proceeding to make payments.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Hostel Settlement Fee</h2>
        <p className="text-xs text-slate-500 mt-1">
          Settling request for <span className="font-extrabold text-blue-600">{booking.hostels?.name}</span>. Total Fee: <span className="font-extrabold text-slate-800">GH₵ 1,500.00</span>
        </p>
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {(['ONLINE', 'BANK', 'CASH'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${
              activeTab === tab 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab === 'ONLINE' && <CreditCard size={14} />}
            {tab === 'BANK' && <Landmark size={14} />}
            {tab === 'CASH' && <Banknote size={14} />}
            <span>{tab.toLowerCase()}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmitPayment} className="space-y-6">
          {activeTab === 'ONLINE' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CreditCard size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-800">Instant Online Checkout</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Securely pay using Visa, Mastercard, or Mobile Money. Online payments are instantly verified and trigger auto-room allocation immediately.
              </p>
            </div>
          )}

          {activeTab === 'BANK' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800">Institutional Bank Transfer</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Bank Name:</span>
                  <span className="font-extrabold text-slate-800">GCB Bank PLC</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Name:</span>
                  <span className="font-extrabold text-slate-800">GCTU Hostel Operations</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Account Number:</span>
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    GCTU-HOSTELS-0192837
                    <button type="button" onClick={handleCopy} className="text-blue-600 hover:text-blue-750">
                      {copied ? <ShieldCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </span>
                </div>
              </div>

              <div className="field-group">
                <label>Transaction reference number</label>
                <input 
                  type="text" 
                  placeholder="Enter GCB transaction ID..." 
                  className="custom-dropdown bg-slate-50 mt-1"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  required={activeTab === 'BANK'}
                />
              </div>
            </div>
          )}

          {activeTab === 'CASH' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mx-auto">
                <Banknote size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-800">Cash Payment at Office</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Visit the Academic Hall or Finance Hall office blocks at GCTU main campus to settle in cash. Enter the official cashier receipt number below.
              </p>
              
              <div className="field-group text-left">
                <label>Receipt number</label>
                <input 
                  type="text" 
                  placeholder="Enter Cashier receipt number..." 
                  className="custom-dropdown bg-slate-50 mt-1"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  required={activeTab === 'CASH'}
                />
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-xs font-bold text-red-800">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitLoading} 
            className="submit-action-btn primary-theme w-full"
          >
            {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Payment Settlement'}
          </button>
        </form>
      </div>
    </div>
  );
}
