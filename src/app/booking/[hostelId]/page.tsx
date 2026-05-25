'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Home, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Hostel, Room } from '@/types';

export default function BookingPage({ params }: { params: { hostelId: string } }) {
  const router = useRouter();
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchHostel();
  }, [params.hostelId]);

  const fetchHostel = async () => {
    const { data, error } = await supabase
      .from('hostels')
      .select('*, rooms(*)')
      .eq('id', params.hostelId)
      .single();
    
    if (error) setError(error.message);
    else setHostel(data);
    setLoading(false);
  };

  const handleBooking = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login to book a room");

      // Call the Booking Engine Edge Function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-engine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          hostel_id: params.hostelId
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Booking failed");

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!hostel) return <div className="text-center py-20">Hostel not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-primary p-8 text-white text-center">
            <h1 className="text-3xl font-black mb-2">Confirm Your Booking</h1>
            <p className="opacity-80">You are booking a space at {hostel.name}</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold border border-red-100">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {success ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Initialized!</h2>
                <p className="text-gray-500 mb-8">Redirecting you to your dashboard to complete payment...</p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Home size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Hostel</div>
                      <div className="font-black text-gray-800">{hostel.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <CreditCard size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Payment Method</div>
                      <div className="font-black text-gray-800">Bank Transfer / Cash Deposit</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100">
                  <h3 className="font-black text-blue-800 mb-2 flex items-center gap-2">
                    <ShieldCheck size={18} /> Important Note
                  </h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    By clicking "Initialize Booking", you agree to the terms of GCTU hostel management. 
                    You will have 24 hours to upload your payment receipt to secure your spot.
                  </p>
                </div>

                <button 
                  onClick={handleBooking}
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : "Initialize Booking"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
