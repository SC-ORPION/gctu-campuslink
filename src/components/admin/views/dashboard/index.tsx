'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ShieldCheck, Loader2, Play, ArrowRight 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="premium-card relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] border-[#1E293B] !border-l-4 !border-l-[#D4A017] !rounded-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A017]/10 rounded-full blur-[80px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A017]/30 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Admin Control Terminal</h1>
            <p className="text-sm text-[#94A3B8] mt-1 font-medium">
              Consolidated operational metrics and allocation engine controls.
            </p>
          </div>
          <span className="status-badge success border border-[#059669]/20 self-start md:self-auto">
            <ShieldCheck size={14} className="mr-1.5" /> Authorized Session
          </span>
        </div>
      </motion.div>

      {loading ? (
        <div className="premium-card animate-pulse">
          <div className="skeleton-line w-full h-8 mb-4 rounded-lg bg-slate-200" />
          <div className="skeleton-line w-3/4 h-8 mb-4 rounded-lg bg-slate-200" />
          <div className="skeleton-line w-1/2 h-6 rounded-lg bg-slate-200" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-8"
        >
          {/* Occupancy Stats */}
          <OccupancyOverview />

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#D1FAE5] border border-[#059669]/20 text-[#059669] p-4 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <ShieldCheck size={16} />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Allocation Queue */}
            <div className="lg:col-span-8 premium-card">
              <div className="premium-card-header">
                <h3 className="premium-card-title flex items-center gap-2">
                  <Play size={18} className="text-[#D4A017] fill-[#D4A017]" />
                  <span>Allocation Backlog Queue</span>
                </h3>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Awaiting assignment</span>
              </div>

              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Hostel</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAllocations.map((booking) => (
                      <tr key={booking.id}>
                        <td className="font-semibold">{booking.users?.full_name || 'N/A'}</td>
                        <td className="font-mono text-[#64748B] text-xs">{booking.users?.student_id || 'N/A'}</td>
                        <td className="text-[#475569]">{booking.hostels?.name}</td>
                        <td className="text-right">
                          <button
                            onClick={() => handleTriggerAutoAllocation(booking.id)}
                            disabled={triggerLoading}
                            className="btn btn-accent h-8 px-4 text-xs"
                          >
                            {triggerLoading ? <Loader2 size={14} className="animate-spin" /> : 'Allot Bed'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingAllocations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-[#64748B] font-medium text-sm">
                          No students currently in allocation queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Operations */}
            <div className="lg:col-span-4 space-y-8">
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
