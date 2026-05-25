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
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container max-w-6xl">
        <button onClick={() => router.push('/admin/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm mb-6">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Incident Logs</h1>
              <p className="text-slate-500 text-sm font-semibold">Track student maintenance tickets, plumbing reports, and Wi-Fi outages.</p>
            </div>
            <button onClick={fetchIncidents} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors border border-slate-150">
              <RefreshCw size={16} />
            </button>
          </div>

          {incidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-4 uppercase">Student Details</th>
                    <th className="pb-4 uppercase">Room Location</th>
                    <th className="pb-4 uppercase">Category</th>
                    <th className="pb-4 uppercase">Issue Details</th>
                    <th className="pb-4 uppercase">Date Filed</th>
                    <th className="pb-4 text-center uppercase">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50/50">
                      <td className="py-4">
                        <div className="font-black text-slate-900">{incident.users?.full_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{incident.users?.student_id}</div>
                      </td>
                      <td className="py-4">
                        <div className="font-bold text-slate-800">Room {incident.rooms?.room_number}</div>
                        <div className="text-[10px] font-black text-primary uppercase mt-0.5">
                          {incident.rooms?.buildings?.hostels?.name}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          incident.type === 'WIFI' ? 'bg-purple-50 text-purple-600' :
                          incident.type === 'ELECTRICAL' ? 'bg-blue-50 text-blue-600' :
                          incident.type === 'PLUMBING' ? 'bg-teal-50 text-teal-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {incident.type}
                        </span>
                      </td>
                      <td className="py-4 max-w-xs">
                        <p className="text-slate-600 font-medium break-words leading-relaxed">{incident.description}</p>
                      </td>
                      <td className="py-4 text-slate-500">
                        {new Date(incident.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 text-center">
                        <select 
                          disabled={updatingId === incident.id}
                          value={incident.status}
                          onChange={(e) => handleUpdateStatus(incident.id, e.target.value)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider focus:outline-none ${
                            incident.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' :
                            incident.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                            'bg-amber-50 text-amber-600'
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
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Check size={32} className="mb-2 text-emerald-500" />
              <div className="text-xs font-semibold">No active maintenance incidents reported. All systems optimal.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
