'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, Users, CreditCard, Activity, 
  ArrowRight, ShieldCheck, Loader2, Play 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import AdminStatCard from '../../../components/admin/AdminStatCard';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalHostels: 0,
    occupiedBeds: 0,
    totalCapacity: 0,
    pendingPayments: 0,
  });
  const [pendingAllocations, setPendingAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    try {
      // 1. Total Registered Students count
      const { count: studentCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // 2. Active Hostels count
      const { count: hostelCount } = await supabase
        .from('hostels')
        .select('*', { count: 'exact', head: true });

      // 3. Occupancy Rate Check
      const { data: rooms } = await supabase
        .from('rooms')
        .select('capacity, current_occupancy');
      const capacitySum = rooms?.reduce((acc, r) => acc + r.capacity, 0) || 0;
      const occupiedSum = rooms?.reduce((acc, r) => acc + r.current_occupancy, 0) || 0;

      // 4. Pending Slip Verifications count
      const { count: pendingPayCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // 5. Fetch Pending Allocations (confirmed booking but no active allocations)
      const { data: pendingAllocData } = await supabase
        .from('bookings')
        .select('*, users(*), hostels(name)')
        .eq('status', 'CONFIRMED')
        .limit(5);

      setMetrics({
        totalStudents: studentCount || 0,
        totalHostels: hostelCount || 0,
        occupiedBeds: occupiedSum,
        totalCapacity: capacitySum,
        pendingPayments: pendingPayCount || 0,
      });

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
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">Admin Control Terminal</h1>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Consolidated operational metrics and allocation engine controls.</p>
        </div>
        <span className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 align-middle self-start md:self-auto shadow-sm">
          <ShieldCheck size={12} className="text-blue-500" /> Authorized Admin Session
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="skeleton h-20"></div>
          <div className="skeleton h-20"></div>
          <div className="skeleton h-20"></div>
          <div className="skeleton h-20"></div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* 2. Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard 
              title="Registered Students" 
              value={metrics.totalStudents} 
              icon={<Users size={16} />} 
              colorClass="bg-blue-50 text-blue-600 border border-blue-100" 
            />
            <AdminStatCard 
              title="Active Hostels" 
              value={metrics.totalHostels} 
              icon={<Building size={16} />} 
              colorClass="bg-teal-50 text-teal-600 border border-teal-100" 
            />
            <AdminStatCard 
              title="Bed Occupancy Roster" 
              value={`${metrics.occupiedBeds} / ${metrics.totalCapacity}`} 
              explanation="Beds Occupied" 
              icon={<Activity size={16} />} 
              colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100" 
            />
            <AdminStatCard 
              title="Unverified Payments Queue" 
              value={metrics.pendingPayments} 
              icon={<CreditCard size={16} />} 
              colorClass="bg-amber-50 text-amber-600 border border-amber-100" 
            />
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
              <ShieldCheck size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 3. Grid split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Box: Active allocation queue */}
            <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Play size={14} className="text-blue-600 animate-pulse" /> Allocation Backlog Queue
                </h3>
                <span className="text-[9px] font-bold text-slate-400">Next 5 students in standby</span>
              </div>

              <div className="dense-table-wrapper">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Hostel Requested</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAllocations.map((booking) => (
                      <tr key={booking.id}>
                        <td className="font-extrabold text-slate-800">{booking.users?.full_name || 'N/A'}</td>
                        <td className="font-mono text-slate-400">{booking.users?.student_id || 'N/A'}</td>
                        <td>{booking.hostels?.name}</td>
                        <td>
                          <button
                            onClick={() => handleTriggerAutoAllocation(booking.id)}
                            disabled={triggerLoading}
                            className="bg-blue-600 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg hover:bg-blue-750 transition-colors flex items-center gap-1 shadow-sm uppercase tracking-wide"
                          >
                            {triggerLoading ? <Loader2 size={10} className="animate-spin" /> : 'Trigger Allocation Process'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingAllocations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-400 font-bold italic">
                          No students currently waiting in allocation queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Box: Quick Shortcuts */}
            <div className="lg:col-span-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">Command Shortcuts</h3>
                <div className="space-y-2">
                  <Link href="/admin/payments" className="flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg transition-all">
                    <span className="font-black text-xs">Verify Payment Requests</span>
                    <ArrowRight size={12} className="text-blue-500" />
                  </Link>
                  <Link href="/admin/allocation" className="flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg transition-all">
                    <span className="font-black text-xs">Reassign Room Allotments</span>
                    <ArrowRight size={12} className="text-blue-500" />
                  </Link>
                  <Link href="/admin/students" className="flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg transition-all">
                    <span className="font-black text-xs">Block Student Access Console</span>
                    <ArrowRight size={12} className="text-blue-500" />
                  </Link>
                </div>
              </div>

              <div className="mt-6 bg-slate-800 p-3 rounded-lg border border-slate-700/50 text-[9px] text-slate-500 font-bold leading-normal">
                🔒 SECURITY REQUIREMENT: Every action taken by university coordinators is permanently logged in secure audit logs. Roster actions are irreversible.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
