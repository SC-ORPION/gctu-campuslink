'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ShieldCheck, Loader2, Play, ArrowRight 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

import SystemAlerts from './SystemAlerts';
import OccupancyOverview from './OccupancyOverview';
import PendingQueues from './PendingQueues';
import RecentOperations from './RecentOperations';

export default function AdminDashboardPage() {
  const [pendingAllocations, setPendingAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    try {
      const { data: pendingAllocData } = await supabase
        .from('bookings')
        .select('*, users(*), hostels(name)')
        .eq('status', 'CONFIRMED')
        .limit(5);

      setPendingAllocations(pendingAllocData || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAutoAllocation = async (bookingId: string) => {
    setTriggerLoading(true);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/admin/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto',
          bookingId
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Auto allocation failed.');
      }
      setSuccessMsg('Bed slot allocated successfully! Roster updated.');
      await fetchAdminMetrics();
    } catch (err: any) {
      alert(err.message || 'Engine run failed.');
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-br from-[#0a2240] to-[#0f3058] border-l-8 border-l-[#d4af37] border-y border-r border-[#1e5faf]/20 rounded-2xl p-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/3 rounded-full blur-[80px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white">Admin Control Terminal</h1>
            <p className="text-[12px] text-slate-400 mt-1 font-medium">
              Consolidated operational metrics and allocation engine controls.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-[#d4af37]/8 text-[#d4af37] px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] self-start md:self-auto border border-[#d4af37]/15">
            <ShieldCheck size={12} /> Authorized Session
          </span>
        </div>
      </motion.div>

      {loading ? (
        <div className="bg-[#0a2240]/40 p-12 rounded-2xl border border-[#1e5faf]/10 animate-pulse">
          <div className="skeleton-line w-full h-8 mb-4 rounded-lg" />
          <div className="skeleton-line w-3/4 h-8 mb-4 rounded-lg" />
          <div className="skeleton-line w-1/2 h-6 rounded-lg" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Occupancy Stats */}
          <OccupancyOverview />

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 p-3.5 rounded-xl text-[12px] font-bold flex items-center gap-2"
            >
              <ShieldCheck size={14} />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Allocation Queue */}
            <div className="lg:col-span-8 bg-[#0a2240]/60 backdrop-blur-sm border-t-4 border-t-blue-700 border-2 border-amber-500/40 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-extrabold text-[#d4af37] uppercase tracking-[0.1em] flex items-center gap-2">
                  <Play size={13} className="text-[#d4af37] fill-[#d4af37]" />
                  <span>Allocation Backlog Queue</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">Awaiting assignment</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#1e5faf]/10 text-slate-500 font-bold uppercase tracking-[0.08em] text-[10px]">
                      <th className="pb-3">Student</th>
                      <th className="pb-3">Student ID</th>
                      <th className="pb-3">Hostel</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e5faf]/5">
                    {pendingAllocations.map((booking) => (
                      <tr key={booking.id} className="hover:bg-[#0f3058]/30 transition-colors">
                        <td className="py-3.5 font-bold text-white">{booking.users?.full_name || 'N/A'}</td>
                        <td className="py-3.5 font-mono text-slate-500 text-[11px]">{booking.users?.student_id || 'N/A'}</td>
                        <td className="py-3.5 text-slate-300">{booking.hostels?.name}</td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleTriggerAutoAllocation(booking.id)}
                            disabled={triggerLoading}
                            className="bg-[#d4af37] hover:bg-[#e0bc45] text-[#06182e] font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1 shadow-sm hover:-translate-y-0.5 uppercase tracking-wider disabled:opacity-50"
                          >
                            {triggerLoading ? <Loader2 size={10} className="animate-spin" /> : 'Allot Bed'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingAllocations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-500 font-medium italic text-[12px]">
                          No students currently in allocation queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Operations */}
            <div className="lg:col-span-4 space-y-6">
              <SystemAlerts />
              <PendingQueues />
              <RecentOperations />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
