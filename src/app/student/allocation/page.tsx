'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '../../../components/student/EmptyState';

import AllocationTimeline from './AllocationTimeline';
import RoomSlip from './RoomSlip';
import RoommatesList from './RoommatesList';
import AllocationStatus from './AllocationStatus';
import HostelRulesNotice from './HostelRulesNotice';

export default function StudentRoomSlipPage() {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRoomDetails();
    }
  }, [user]);

  const fetchRoomDetails = async () => {
    if (!user) return;
    try {
      // 1. Fetch active booking & payment status
      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .select('*, hostels(name)')
        .eq('user_id', user.id)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false });

      if (!bookingErr && bookingData && bookingData.length > 0) {
        const activeBooking = bookingData[0];
        setPaymentVerified(activeBooking.payment_status === 'PAID');

        // 2. Fetch active allocation linked to booking_id
        const { data: allocData, error: allocErr } = await supabase
          .from('allocations')
          .select('*, rooms(*, buildings(*))')
          .eq('booking_id', activeBooking.id)
          .is('revoked_at', null)
          .single();

        if (!allocErr && allocData) {
          setAllocation(allocData);

          // 3. Fetch roommates sharing the same room_id
          const { data: matesData, error: matesErr } = await supabase
            .from('allocations')
            .select('*, bookings(users(*))')
            .eq('room_id', allocData.room_id)
            .is('revoked_at', null);

          if (!matesErr && matesData) {
            const parsedMates = matesData
              .map((m: any) => m.bookings?.users)
              .filter((u: any) => u && u.id !== user.id);
            setRoommates(parsedMates);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
          <div className="skeleton-line w-24 h-4"></div>
          <div className="skeleton-line w-48 h-6"></div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3">
          <div className="skeleton-line w-full h-8"></div>
          <div className="skeleton-line w-full h-8"></div>
          <div className="skeleton-line w-2/3 h-6"></div>
        </div>
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <AllocationTimeline step={paymentVerified ? 'PAID' : 'BOOKED'} />
        
        <div className="pt-2">
          <AllocationStatus status="PENDING" />
        </div>

        <EmptyState 
          title="No Assigned Room Slip Yet" 
          description="Your room assignment details will be unlocked as soon as your payment verification is confirmed by finance administrators." 
          actionText="Return to Dashboard" 
          actionHref="/student/dashboard"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AllocationTimeline step="ALLOCATED" />

      <RoomSlip 
        roomNumber={allocation.rooms?.room_number || 'A-204'} 
        buildingName={allocation.rooms?.buildings?.name || 'Main Blocks'} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Guidelines */}
        <div className="lg:col-span-7 space-y-6">
          <AllocationStatus status="ALLOCATED" />
          <HostelRulesNotice />
        </div>

        {/* Right Column: Roommates list */}
        <div className="lg:col-span-5">
          <RoommatesList 
            roommates={roommates} 
            capacity={allocation.rooms?.capacity || 4} 
            primaryHolderName={user?.full_name}
          />
        </div>
      </div>
    </div>
  );
}
