'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, Check, Loader2, ChevronLeft, 
  HelpCircle, MessageSquare, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminIncidentsPage() {
  const router = useRouter();

  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch raw incidents first
      const { data: rawIncidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (incidentsError) throw incidentsError;

      if (!rawIncidents || rawIncidents.length === 0) {
        setIncidents([]);
        return;
      }

      // 2. Extract unique user and room IDs
      const userIds = Array.from(new Set(rawIncidents.map(i => i.user_id).filter(Boolean)));
      const roomIdSet = new Set(rawIncidents.map(i => i.room_id).filter(Boolean));
      const roomIds = Array.from(roomIdSet) as string[];

      // 3. Fetch users, rooms, buildings, hostels in parallel
      const [usersRes, roomsRes] = await Promise.all([
        userIds.length > 0 
          ? supabase.from('users').select('*').in('id', userIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        roomIds.length > 0
          ? supabase.from('rooms').select('*').in('id', roomIds)
          : Promise.resolve({ data: [] as any[], error: null })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (roomsRes.error) throw roomsRes.error;

      const usersMap = new Map((usersRes.data || []).map(u => [u.id, u]));
      const roomsList = roomsRes.data || [];

      // 4. Fetch buildings for these rooms
      const buildingIds = Array.from(new Set(roomsList.map(r => r.building_id).filter(Boolean)));
      const buildingsRes = buildingIds.length > 0
        ? await supabase.from('buildings').select('*').in('id', buildingIds)
        : { data: [] as any[], error: null };

      if (buildingsRes.error) throw buildingsRes.error;
      const buildingsList = buildingsRes.data || [];

      // 5. Fetch hostels for these buildings
      const hostelIds = Array.from(new Set(buildingsList.map(b => b.hostel_id).filter(Boolean)));
      const hostelsRes = hostelIds.length > 0
        ? await supabase.from('hostels').select('*').in('id', hostelIds)
        : { data: [] as any[], error: null };

      if (hostelsRes.error) throw hostelsRes.error;
      const hostelsMap = new Map((hostelsRes.data || []).map(h => [h.id, h]));

      // 6. Build building and room maps
      const buildingsMap = new Map(buildingsList.map(b => [
        b.id, 
        { ...b, hostels: hostelsMap.get(b.hostel_id) || null }
      ]));

      const roomsMap = new Map(roomsList.map(r => [
        r.id, 
        { ...r, buildings: buildingsMap.get(r.building_id) || null }
      ]));

      // 7. Merge everything in memory
      const compiledIncidents = rawIncidents.map(incident => ({
        ...incident,
        users: usersMap.get(incident.user_id) || null,
        rooms: roomsMap.get(incident.room_id) || null
      }));

      setIncidents(compiledIncidents);
    } catch (err: any) {
      console.error('Caught error in fetchIncidents:', err);
      setError({
        message: err.message || 'Unknown database error',
        code: err.code || 'UNKNOWN',
        details: err.details || '',
        hint: err.hint || ''
      });
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

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <button 
        onClick={() => router.push('/dashboard')} 
        className="flex items-center gap-2 text-gold/80 hover:text-gold transition-colors font-semibold text-sm"
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      <div className="premium-card space-y-6 !p-6 bg-[#0a192f] border-slate-800">
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="premium-card-title text-2xl mb-1 text-white font-bold">Incident Logs</h1>
            <p className="text-xs font-semibold text-slate-400">Real-time audit of student maintenance tickets, plumbing reports, and Wi-Fi outages.</p>
          </div>
          <button 
            onClick={fetchIncidents} 
            className="btn btn-secondary h-9 w-9 p-0 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {error ? (
          <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-950/20 backdrop-blur-md text-left space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="flex-shrink-0" size={24} />
              <h3 className="text-base font-bold">Database Access Blocked</h3>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              We encountered a database error while attempting to fetch incident reports. This usually happens when the Row Level Security (RLS) policies on the <code className="bg-rose-950/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">incidents</code> table are missing or not fully applied.
            </p>
            <div className="bg-[#020C1B] text-slate-300 p-4 rounded-xl font-mono text-[11px] leading-relaxed select-all space-y-1 border border-slate-800">
              <div><strong className="text-rose-400">Message:</strong> {error.message}</div>
              {error.code && error.code !== 'UNKNOWN' && <div><strong className="text-gold">Code:</strong> {error.code}</div>}
              {error.details && <div><strong className="text-indigo-400">Details:</strong> {error.details}</div>}
              {error.hint && <div><strong className="text-teal-400">Hint:</strong> {error.hint}</div>}
            </div>
            <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-xl text-xs text-amber-300 font-medium space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <HelpCircle size={14} /> Action Required:
              </p>
              <p className="leading-relaxed">
                Please make sure to apply the staged migration <span className="font-bold">20260529_fix_user_creation.sql</span> to your Supabase project's database via the Supabase Dashboard SQL Editor to establish correct RLS policies and table schema.
              </p>
            </div>
          </div>
        ) : incidents.length > 0 ? (
          <div className="premium-table-container max-h-[460px] overflow-y-auto custom-scrollbar border border-slate-800 rounded-xl bg-[#020C1B]">
            <table className="premium-table">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="text-slate-400 font-bold">Student Details</th>
                  <th className="text-slate-400 font-bold">Room Location</th>
                  <th className="text-slate-400 font-bold">Category</th>
                  <th className="text-slate-400 font-bold">Issue Details</th>
                  <th className="text-slate-400 font-bold">Date Filed</th>
                  <th className="text-center text-slate-400 font-bold">Resolution</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => {
                  const studentName = incident.users?.fullName || incident.users?.full_name || 'Student';
                  return (
                    <tr key={incident.id} className="hover:bg-white/5 border-b border-slate-850 transition-colors">
                      <td className="border-b border-slate-800/50">
                        <div className="flex items-center gap-3">
                          {incident.users?.avatar_url ? (
                            <img 
                              src={incident.users.avatar_url} 
                              alt="" 
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-black text-gold shadow-inner">
                              {getInitials(studentName)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-100 text-[13px]">{studentName}</div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{incident.users?.studentId || incident.users?.student_id || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-800/50">
                        <div className="font-bold text-slate-200 text-xs">
                          {incident.rooms ? `Room ${incident.rooms.room_number}` : 'General / unassigned'}
                        </div>
                        {incident.rooms?.buildings?.hostels?.name && (
                          <div className="text-[9px] font-black text-gold uppercase tracking-wider mt-0.5">
                            {incident.rooms.buildings.hostels.name}
                          </div>
                        )}
                      </td>
                      <td className="border-b border-slate-800/50">
                        <span className={`status-badge text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          incident.type === 'WIFI' ? 'bg-gold/10 text-gold border-gold/20' :
                          incident.type === 'ELECTRICAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          incident.type === 'PLUMBING' ? 'bg-gold/10 text-gold border-gold/20' :
                          incident.type === 'MAINTENANCE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {incident.type}
                        </span>
                      </td>
                      <td className="max-w-[280px] border-b border-slate-800/50">
                        <p className="text-slate-300 text-xs font-semibold leading-relaxed break-words line-clamp-2" title={incident.description}>
                          {incident.description}
                        </p>
                      </td>
                      <td className="text-slate-400 font-medium text-[11px] border-b border-slate-800/50">
                        {new Date(incident.created_at).toLocaleDateString()}
                        <span className="text-[9px] text-slate-500 block mt-0.5 font-normal">
                          {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="text-center border-b border-slate-800/50">
                        <select 
                          disabled={updatingId === incident.id}
                          value={incident.status}
                          onChange={(e) => handleUpdateStatus(incident.id, e.target.value)}
                          className={`py-1 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all duration-200 outline-none cursor-pointer ${
                            incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :
                            incident.status === 'IN_PROGRESS' ? 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                        >
                          <option value="REPORTED" className="bg-[#0a192f] text-white">REPORTED</option>
                          <option value="IN_PROGRESS" className="bg-[#0a192f] text-white">IN PROGRESS</option>
                          <option value="RESOLVED" className="bg-[#0a192f] text-white">RESOLVED</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-[#020C1B]">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-sm animate-pulse">
              <Check size={24} />
            </div>
            <div className="text-sm font-bold text-slate-200">All Operations Clear</div>
            <div className="text-xs font-semibold text-slate-400 mt-1 max-w-[280px] text-center leading-relaxed">
              No active maintenance tickets reported by students. Hostel infrastructure status optimal.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
