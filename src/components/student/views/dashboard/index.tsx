'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, CreditCard, ShieldAlert,
  ArrowRight, User, LayoutGrid, MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import BookingProgress from '@/components/student/BookingProgress';
import StatusCard from '@/components/student/StatusCard';
import EmptyState from '@/components/student/EmptyState';
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
        <div className="premium-card max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">Account Restricted</h1>
          <p className="text-sm text-[#64748B] mb-6 leading-relaxed font-medium">
            Your profile access has been restricted by the GCTU Hostel Administration. Please contact academic coordinators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="premium-card relative overflow-hidden !border-l-4 !border-l-[#1D4ED8]"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D4ED8]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="status-badge info">
              Active Student Portal
            </span>
            <h1 className="premium-card-title mt-3 text-2xl">Welcome Back, {user?.full_name}</h1>
            <p className="text-sm text-[#64748B] font-medium mt-1">
              Manage your GCTU accommodation details and bookings.
            </p>
          </div>
          <div className="bg-[#F8FAFC] px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#475569] flex items-center gap-2 self-start sm:self-auto">
            <LayoutGrid size={16} className="text-[#94A3B8]" />
            <span>Student ID: {user?.student_id || 'N/A'}</span>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="premium-card h-32 animate-pulse bg-slate-100" />
          <div className="premium-card h-32 animate-pulse bg-slate-100" />
          <div className="premium-card h-32 animate-pulse bg-slate-100" />
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
          className="space-y-8"
        >
          {/* Progress Tracker */}
          <BookingProgress currentStatus={booking.status} />

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              icon={<Building size={18} />}
            />

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
              icon={<CreditCard size={18} />}
            />

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
              icon={<User size={18} />}
            />
          </div>

          {/* Room Slip */}
          {allocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="premium-card !border-[#1D4ED8]/30 bg-[#F8FAFC]"
            >
              <h3 className="premium-card-title mb-6 border-b border-[#E2E8F0] pb-4">
                Room Slip Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Building size={16} className="text-[#1D4ED8]" />
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Building</span>
                  </div>
                  <div className="text-lg font-bold text-[#0F172A]">{allocation.rooms?.buildings?.name}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-[#D97706]" />
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Room</span>
                  </div>
                  <div className="text-lg font-bold text-[#0F172A]">Room {allocation.rooms?.room_number}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-[#059669]" />
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Gender Policy</span>
                  </div>
                  <div className="text-lg font-bold text-[#0F172A] uppercase">
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
