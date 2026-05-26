'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, CreditCard, ShieldAlert,
  ArrowRight, User, LayoutGrid, MapPin
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import BookingProgress from '../../../components/student/BookingProgress';
import StatusCard from '../../../components/student/StatusCard';
import EmptyState from '../../../components/student/EmptyState';
import { useRouter } from 'next/navigation';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookingDetails();
    }
  }, [user]);

  const fetchBookingDetails = async () => {
    if (!user) return;
    try {
      const { data: bookingsData, error: bookingErr } = await supabase
        .from('bookings')
        .select('*, hostels(name, campus, location_name)')
        .eq('user_id', user.id)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false });

      if (bookingErr) throw bookingErr;

      if (bookingsData && bookingsData.length > 0) {
        const activeBooking = bookingsData[0];
        setBooking(activeBooking);

        if (activeBooking.status === 'ALLOCATED') {
          const { data: allocData, error: allocErr } = await supabase
            .from('allocations')
            .select('*, rooms(*, buildings(*))')
            .eq('booking_id', activeBooking.id)
            .is('revoked_at', null)
            .single();

          if (!allocErr && allocData) {
            setAllocation(allocData);
          }
        }
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Blocked guard
  if (user?.status === 'BLOCKED') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Account Restricted</h1>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed font-normal">
            Your profile access has been restricted by the GCTU Hostel Administration. Please contact academic coordinators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-white border-l-8 border-l-blue-700 border-y border-r border-slate-200/80 rounded-2xl p-6 overflow-hidden shadow-md"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              Active Student Portal
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-3">Welcome Back, {user?.full_name}</h1>
            <p className="text-sm text-slate-500 font-normal mt-1">
              Manage your GCTU accommodation details and bookings.
            </p>
          </div>
          <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 self-start sm:self-auto">
            <LayoutGrid size={14} className="text-slate-400" />
            <span>Student ID: {user?.student_id || 'N/A'}</span>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton-line h-32 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="skeleton-line h-32 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="skeleton-line h-32 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : !booking ? (
        <EmptyState 
          title="No Active Accommodation Booking" 
          description="You haven't reserved or applied for any GCTU hostel accommodation for the upcoming academic semester." 
          actionText="Browse Available Hostels" 
          actionHref="/student/hostels"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Progress Tracker */}
          <BookingProgress currentStatus={booking.status} />

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border-t-4 border-t-blue-700 border-x border-b border-slate-200 rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <StatusCard 
                title="Hostel Allocation Request" 
                statusText={
                  booking.status === 'PENDING_PAYMENT' ? 'Hostel Locked' :
                  booking.status === 'PENDING_VERIFICATION' ? 'Payment Pending' :
                  booking.status === 'CONFIRMED' ? 'Allocation Queued' :
                  booking.status === 'ALLOCATED' ? 'Confirmed' : 'Revoked'
                } 
                badgeType={
                  booking.status === 'ALLOCATED' ? 'success' :
                  booking.status === 'CANCELLED' ? 'danger' : 'warning'
                } 
                explanation={
                  booking.status === 'PENDING_PAYMENT' 
                    ? `Selection locked: ${booking.hostels?.name}. Submit payment to secure your slot.`
                    : `Booking secured at ${booking.hostels?.name}.`
                }
                actionText="Browse Hostels"
                actionHref="/student/hostels"
                icon={<Building size={16} />}
              />
            </div>

            <div className="bg-white border-t-4 border-t-blue-700 border-x border-b border-slate-200 rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <StatusCard 
                title="Financial Status" 
                statusText={
                  booking.payment_status === 'VERIFIED' ? 'Verified' :
                  booking.payment_status === 'PENDING' ? 'Pending Verification' : 'Failed'
                } 
                badgeType={
                  booking.payment_status === 'VERIFIED' ? 'success' :
                  booking.payment_status === 'FAILED' ? 'danger' : 'warning'
                } 
                explanation={
                  booking.payment_status === 'VERIFIED'
                    ? 'Transaction verified by GCTU finance.'
                    : 'Receipt verification pending bank validation.'
                }
                actionText={booking.payment_status !== 'VERIFIED' ? 'Submit Payment' : undefined}
                actionHref="/student/payment"
                icon={<CreditCard size={16} />}
              />
            </div>

            <div className="bg-white border-t-4 border-t-blue-700 border-x border-b border-slate-200 rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <StatusCard 
                title="Bed Allocation" 
                statusText={
                  allocation ? 'Room Assigned' :
                  booking.payment_status === 'VERIFIED' ? 'Processing' : 'Queued'
                } 
                badgeType={allocation ? 'success' : 'warning'} 
                explanation={
                  allocation 
                    ? `Building: ${allocation.rooms?.buildings?.name || 'Alpha'}, Room ${allocation.rooms?.room_number}.`
                    : 'Waiting for financial verification to proceed.'
                }
                actionText={allocation ? 'Open Room Slip' : undefined}
                actionHref="/student/allocation"
                icon={<User size={16} />}
              />
            </div>
          </div>

          {/* Room Slip */}
          {allocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white border-2 border-blue-600/30 rounded-2xl p-6 shadow-md"
            >
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b border-blue-50 pb-2">
                Room Slip Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50/45 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building size={14} className="text-blue-700" />
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Building</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{allocation.rooms?.buildings?.name}</div>
                </div>

                <div className="bg-blue-50/45 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-amber-600" />
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Room</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">Room {allocation.rooms?.room_number}</div>
                </div>

                <div className="bg-blue-50/45 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} className="text-emerald-700" />
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Gender Policy</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 uppercase">
                    {allocation.rooms?.gender_rule?.replace('_ONLY', 's Only')}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
