'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ShieldCheck, Loader2, Play, ArrowRight, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import SystemAlerts from './SystemAlerts';
import OccupancyOverview from './OccupancyOverview';
import PendingQueues from './PendingQueues';
import RecentOperations from './RecentOperations';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [pendingAllocations, setPendingAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    totalHostels: 0,
    allocatedStudents: 0,
    totalCapacity: 0,
    registeredStudents: 0,
    unverifiedPayments: 0,
    unassignedAllocations: 0,
  });

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch backlog queue
      const { data: pendingAllocData } = await supabase
        .from('bookings')
        .select('*, users(*), hostels(name)')
        .eq('status', 'CONFIRMED')
        .limit(5);

      setPendingAllocations(pendingAllocData || []);

      // 2. Fetch total hostels
      const { count: hostelsCount } = await supabase
        .from('hostels')
        .select('id', { count: 'exact' });

      // 3. Fetch registered students
      const { count: studentsCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'student');

      // 4. Fetch allocated students
      const { count: allocatedCount } = await supabase
        .from('allocations')
        .select('id', { count: 'exact' })
        .is('revoked_at', null);

      // 5. Fetch total capacity from rooms
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('capacity');
      const capacitySum = roomsData?.reduce((sum, r) => sum + (r.capacity || 0), 0) || 0;

      // 6. Fetch unverified payments (bookings with status PENDING_VERIFICATION)
      const { count: unverifiedPayCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING_VERIFICATION');

      // 7. Fetch unassigned allocations (bookings with status CONFIRMED)
      const { count: unassignedCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('status', 'CONFIRMED');

      setMetrics({
        totalHostels: hostelsCount || 0,
        allocatedStudents: allocatedCount || 0,
        totalCapacity: capacitySum || 0,
        registeredStudents: studentsCount || 0,
        unverifiedPayments: unverifiedPayCount || 0,
        unassignedAllocations: unassignedCount || 0,
      });

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
      {/* Welcome Banner - Deep Navy styled to match Student Dashboard */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0A192F] p-6 md:p-8 rounded-2xl shadow-sm border border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} /> Official GCTU Administrative Portal
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white m-0">Admin Control Terminal</h1>
          <p className="text-xs md:text-sm text-slate-300 font-medium flex items-center gap-2 m-0">
            <User size={16} className="text-yellow-500" /> Welcome back, {user?.full_name || 'System Admin'}
          </p>
        </div>
        <div className="flex gap-4 items-center self-start md:self-auto relative z-10">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">Session Role</p>
            <p className="text-md font-bold text-yellow-500 tracking-tight m-0 uppercase">{user?.role || 'Admin'}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-500 text-[#0A192F] flex items-center justify-center text-lg font-black shadow-sm">
            {getInitials(user?.full_name || '')}
          </div>
        </div>
      </header>

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
          <OccupancyOverview 
            totalHostels={metrics.totalHostels}
            allocatedStudents={metrics.allocatedStudents}
            totalCapacity={metrics.totalCapacity}
            registeredStudents={metrics.registeredStudents}
          />

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-600/20 text-emerald-700 p-4 rounded-lg text-sm font-semibold flex items-center gap-2"
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
                  <Play size={18} className="text-gold fill-gold" />
                  <span>Allocation Backlog Queue</span>
                </h3>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Awaiting assignment</span>
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
                        <td className="font-mono text-text-muted text-xs">{booking.users?.student_id || 'N/A'}</td>
                        <td className="text-text-secondary">{booking.hostels?.name}</td>
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
                        <td colSpan={4} className="text-center py-10 text-text-muted font-medium text-sm">
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
              <PendingQueues 
                unverifiedPayments={metrics.unverifiedPayments}
                unassignedAllocations={metrics.unassignedAllocations}
              />
              <RecentOperations />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
