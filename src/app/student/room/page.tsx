'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  Building, ShieldCheck, HelpCircle, 
  Users, MapPin, Calendar, Info, ShieldAlert 
} from 'lucide-react';
import EmptyState from '../../../components/student/EmptyState';

export default function StudentRoomSlipPage() {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoomDetails();
    }
  }, [user]);

  const fetchRoomDetails = async () => {
    if (!user) return;
    try {
      // 1. Fetch active allocation
      const { data: allocData, error: allocErr } = await supabase
        .from('allocations')
        .select('*, rooms(*, buildings(*))')
        .eq('booking_id', (
          await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', user.id)
            .neq('status', 'CANCELLED')
            .order('created_at', { ascending: false })
            .limit(1)
        ).data?.[0]?.id)
        .is('revoked_at', null)
        .single();

      if (!allocErr && allocData) {
        setAllocation(allocData);

        // 2. Fetch roommates sharing the same room_id
        const { data: matesData, error: matesErr } = await supabase
          .from('allocations')
          .select('*, bookings(users(*))')
          .eq('room_id', allocData.room_id)
          .is('revoked_at', null);

        if (!matesErr && matesData) {
          // Extract user records and filter out current logged-in user
          const parsedMates = matesData
            .map((m: any) => m.bookings?.users)
            .filter((u: any) => u && u.id !== user.id);
          setRoommates(parsedMates);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-64 w-full"></div>;
  }

  if (!allocation) {
    return (
      <EmptyState 
        title="No Assigned Room Slip Yet" 
        description="Your room assignment will appear here as soon as your payment verification is confirmed by the system finance administrators." 
        actionText="Return to Dashboard" 
        actionHref="/student/dashboard"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 align-middle self-start sm:self-auto">
            <ShieldCheck size={12} /> Certified Room Slip
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-3 leading-none">Room {allocation.rooms?.room_number}</h1>
          <p className="text-xs font-semibold text-slate-500 mt-2 flex items-center gap-1">
            <MapPin size={14} className="text-primary" /> {allocation.rooms?.buildings?.name} Building Block
          </p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-xs font-bold text-slate-400 uppercase">Duration Period</div>
          <div className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1">
            <Calendar size={14} className="text-slate-400" />
            <span>2026/2027 Academic Year</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Guidelines */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Info size={16} className="text-primary" /> Building Guidelines & Rules
          </h2>

          <ul className="space-y-3.5 text-xs font-semibold text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              <span>Strict gender policy enforcement. Male and female students are not permitted cross-access to rooms.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              <span>Gate lock curfew is strictly set at 10:00 PM daily. Emergency exceptions require hall coordinator approval.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              <span>Subletting or harboring unauthorized external guest students is a serious breach of student code.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              <span>Report any maintenance defects immediately to the office using incident logs.</span>
            </li>
          </ul>
        </div>

        {/* Right Column: Roommates list */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Users size={16} className="text-primary" /> Roommates ({roommates.length + 1} / {allocation.rooms?.capacity})
          </h2>

          <div className="space-y-3">
            {/* Logged in student */}
            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  ME
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">{user?.full_name}</div>
                  <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">Primary Holder</div>
                </div>
              </div>
            </div>

            {/* Roommates */}
            {roommates.map((mate) => (
              <div key={mate.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                    {mate.full_name?.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-700">{mate.full_name}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Roommate</div>
                  </div>
                </div>
              </div>
            ))}

            {roommates.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs italic font-bold">
                You are currently the sole occupant assigned to this room.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
