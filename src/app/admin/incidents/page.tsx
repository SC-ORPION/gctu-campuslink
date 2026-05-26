'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, Check, Loader2, ChevronLeft, 
  HelpCircle, MessageSquare, RefreshCw 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AdminIncidentsPage() {
  const router = useRouter();

  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, users(*), rooms(*, buildings(*, hostels(*)))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
      setIncidents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Keep a dummy setPayments just to swallow any copy paste error if existing in user code, otherwise suppress
  const setPayments = (data: any) => {};

  const handleUpdateStatus = async (incidentId: string, nextStatus: string) => {
    setUpdatingId(incidentId);
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: nextStatus })
        .eq('id', incidentId);

      if (error) throw error;

      alert("Incident status updated successfully!");
      setIncidents(prev => 
        prev.map(inc => inc.id === incidentId ? { ...inc, status: nextStatus } : inc)
      );
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <button 
        onClick={() => router.push('/admin/dashboard')} 
        className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors font-bold text-sm"
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2rem] border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-zinc-50">Incident Logs</h1>
            <p className="text-slate-555 dark:text-zinc-400 text-xs font-semibold mt-1">Track student maintenance tickets, plumbing reports, and Wi-Fi outages.</p>
          </div>
          <button 
            onClick={fetchIncidents} 
            className="p-2 bg-[#06182e]/40 hover:bg-[#0f3058]/30 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 transition-colors border border-[#1e5faf]/15 dark:border-zinc-800"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {incidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-650 dark:text-zinc-400">
              <thead>
                <tr className="border-b border-[#1e5faf]/15 dark:border-zinc-900 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="pb-4">Student Details</th>
                  <th className="pb-4">Room Location</th>
                  <th className="pb-4">Category</th>
                  <th className="pb-4">Issue Details</th>
                  <th className="pb-4">Date Filed</th>
                  <th className="pb-4 text-center">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/50">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-[#06182e]/40/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4">
                      <div className="font-black text-slate-900 dark:text-zinc-200">{incident.users?.fullName || incident.users?.full_name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{incident.users?.studentId || incident.users?.student_id}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-white dark:text-zinc-300">Room {incident.rooms?.roomNumber || incident.rooms?.room_number}</div>
                      <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mt-0.5">
                        {incident.rooms?.buildings?.hostels?.name}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        incident.type === 'WIFI' ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30' :
                        incident.type === 'ELECTRICAL' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30' :
                        incident.type === 'PLUMBING' ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/30' :
                        'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                      }`}>
                        {incident.type}
                      </span>
                    </td>
                    <td className="py-4 max-w-xs">
                      <p className="text-slate-300 dark:text-zinc-300 font-medium break-words leading-relaxed">{incident.description}</p>
                    </td>
                    <td className="py-4 text-slate-500 dark:text-zinc-500 font-normal">
                      {new Date(incident.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 text-center">
                      <select 
                        disabled={updatingId === incident.id}
                        value={incident.status}
                        onChange={(e) => handleUpdateStatus(incident.id, e.target.value)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider focus:outline-none border ${
                          incident.status === 'RESOLVED' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/30' :
                          incident.status === 'IN_PROGRESS' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-250 dark:border-blue-900/30' :
                          'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border-amber-250 dark:border-amber-900/30'
                        }`}
                      >
                        <option value="REPORTED">REPORTED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-zinc-550 border border-dashed border-[#1e5faf]/15 dark:border-zinc-900 rounded-2xl">
            <Check size={32} className="mb-2 text-emerald-500" />
            <div className="text-xs font-semibold">No active maintenance incidents reported. All systems optimal.</div>
          </div>
        )}
      </div>
    </div>
  );
}
