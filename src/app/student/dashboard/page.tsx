'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, CreditCard, LogOut, ShieldAlert,
  ArrowRight, Calendar, User, Info, MapPin, LayoutGrid 
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
      // 1. Fetch active booking
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

        // 2. Fetch allocation details if assigned
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

  // Blocked Student Redirect Gate handled inside layout/middleware, double-asserted here
  if (user?.status === 'BLOCKED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 text-center shadow-md">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={36} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Account Permanently Blocked</h1>
          <p className="text-slate-500 mb-6 leading-relaxed text-sm font-medium">
            Your profile access has been restricted by GCTU Hostel Administration. You are barred from using booking operations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Active Student Cockpit
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Welcome Back, {user?.full_name}</h1>
          <p className="text-xs font-semibold text-slate-500">Manage your institutional accommodation request details here.</p>
        </div>
        <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1.5 align-middle self-start sm:self-auto">
          <LayoutGrid size={14} className="text-slate-400" />
          <span>ID: {user?.student_id || 'N/A'}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="skeleton h-36"></div>
          <div className="skeleton h-36"></div>
          <div className="skeleton h-36"></div>
        </div>
      ) : !booking ? (
        /* Empty booking state */
        <EmptyState 
          title="No Active Accommodation Booking" 
          description="You haven't reserved or applied for any GCTU hostel accommodation for the upcoming academic semester." 
          actionText="Browse Available Hostels" 
          actionHref="/hostels"
        />
      ) : (
        <div className="space-y-4">
          {/* 2. Pipeline tracker */}
          <BookingProgress currentStatus={booking.status} />

          {/* 3. Operational Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatusCard 
              title="Hostel Allocation Request" 
              statusText={
                booking.status === 'PENDING_PAYMENT' ? 'Hostel Locked (Selection Finalized)' :
                booking.status === 'PENDING_VERIFICATION' ? 'Payment Pending Verification' :
                booking.status === 'CONFIRMED' ? 'Allocation Queued' :
                booking.status === 'ALLOCATED' ? 'Allocation Confirmed' : 'Booking Revoked'
              } 
              badgeType={
                booking.status === 'ALLOCATED' ? 'success' :
                booking.status === 'CANCELLED' ? 'danger' : 'warning'
              } 
              explanation={
                booking.status === 'PENDING_PAYMENT' 
                  ? `Selection locked: ${booking.hostels?.name}. Lock in this room slot by submitting your payment receipt.`
                  : `Booking successfully secured at ${booking.hostels?.name}.`
              }
              actionText="Browse Available Hostels"
              actionHref={`/hostels`}
              icon={<Building size={16} />}
            />

            <StatusCard 
              title="Financial Statement Status" 
              statusText={
                booking.payment_status === 'VERIFIED' ? 'Payment Verified' :
                booking.payment_status === 'PENDING' ? 'Payment Pending Verification' : 'Payment Failed'
              } 
              badgeType={
                booking.payment_status === 'VERIFIED' ? 'success' :
                booking.payment_status === 'FAILED' ? 'danger' : 'warning'
              } 
              explanation={
                booking.payment_status === 'VERIFIED'
                  ? 'Your transaction has been verified by GCTU finance accounts successfully.'
                  : 'Your deposit receipt verification is pending institutional bank validation.'
              }
              actionText={booking.payment_status !== 'VERIFIED' ? 'Submit Payment for Verification' : undefined}
              actionHref="/student/payment"
              icon={<CreditCard size={16} />}
            />

            <StatusCard 
              title="Bed Allocation Status" 
              statusText={
                allocation ? 'Room Assigned' :
                booking.payment_status === 'VERIFIED' ? 'Room Assignment Processing' : 'Allocation Queued'
              } 
              badgeType={allocation ? 'success' : 'warning'} 
              explanation={
                allocation 
                  ? `Bed Slot Assigned! Building: ${allocation.rooms?.buildings?.name || 'Alpha'}, Room ${allocation.rooms?.room_number}.`
                  : 'Allocation Queued: Waiting list processing requires financial status verification.'
              }
              actionText={allocation ? 'Open Room Slip' : undefined}
              actionHref="/student/room"
              icon={<User size={16} />}
            />
          </div>

          {/* 4. Room Info Card */}
          {allocation && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Room Slip Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Building</div>
                  <div className="text-base font-black text-slate-800 mt-1">{allocation.rooms?.buildings?.name}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Room Number</div>
                  <div className="text-base font-black text-slate-800 mt-1">Room {allocation.rooms?.room_number}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Gender Policy</div>
                  <div className="text-base font-black text-slate-800 mt-1 uppercase">
                    {allocation.rooms?.gender_rule?.replace('_ONLY', 's Only')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
