'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Building, User, Loader2, CheckCircle2, ShieldAlert,
  ArrowRight, Activity, Trash2, Search 
} from 'lucide-react';
import ConfirmActionModal from '../../../components/admin/ConfirmActionModal';

export default function AdminAllocationsPage() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal triggers
  const [selectedAlloc, setSelectedAlloc] = useState<any | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const { data, error } = await supabase
        .from('allocations')
        .select('*, booking:bookings(*, users(*), hostels(name)), rooms(*, buildings(*))')
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllocations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!selectedAlloc) return;
    setActionLoading(true);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/admin/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          allocationId: selectedAlloc.id,
          adminId: 'd60f4e19-906d-4950-8bdf-4a6c6e7e012a', // Mock admin UUID
          reason: 'Revoked room assignment manually'
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to revoke allocation.');
      }
      setSuccessMsg('Bed assignment revoked successfully! Roster spaces restored.');
      setShowRevokeModal(false);
      await fetchAllocations();
    } catch (err: any) {
      alert(err.message || 'Revocation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAllocations = allocations.filter((a: any) => {
    const student = a.booking?.users;
    const name = student?.full_name?.toLowerCase() || '';
    const sid = student?.student_id?.toLowerCase() || '';
    const rnum = a.rooms?.room_number?.toLowerCase() || '';
    const bname = a.rooms?.buildings?.name?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    return name.includes(query) || sid.includes(query) || rnum.includes(query) || bname.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bed Assignments & Occupancies</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Review active roommate blocks, manual assignments, and free capacity counts.</p>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl max-w-xs w-full">
          <Search size={16} className="text-slate-400 ml-1" />
          <input 
            type="text" 
            placeholder="Search by student, room, building..."
            className="bg-transparent border-none outline-none text-xs font-semibold w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="skeleton h-64 w-full"></div>
      ) : (
        <div className="dense-table-wrapper animate-fade-in">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Hostel Block</th>
                <th>Building Name</th>
                <th>Room Number</th>
                <th>Occupants</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((a) => {
                const student = a.booking?.users;
                return (
                  <tr key={a.id}>
                    <td className="font-extrabold text-slate-800">{student?.full_name || 'N/A'}</td>
                    <td className="font-mono text-slate-400">{student?.student_id || 'N/A'}</td>
                    <td>{a.booking?.hostels?.name}</td>
                    <td className="font-bold text-slate-600">{a.rooms?.buildings?.name}</td>
                    <td className="font-bold text-blue-600">Room {a.rooms?.room_number}</td>
                    <td>
                      <span className="badge badge-primary">
                        {a.rooms?.current_occupancy} / {a.rooms?.capacity} beds
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedAlloc(a);
                          setShowRevokeModal(true);
                        }}
                        className="bg-red-50 text-red-600 border border-red-150 font-bold text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors uppercase tracking-wide flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 size={11} /> Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold italic">
                    No active roommate allocations recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Revocation Warning Checkpoint Modal */}
      <ConfirmActionModal 
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Student Room Assignment?"
        description="Evicting student from dorm reservation"
        warningText={`WARNING: Revoking this allocation will immediately evict ${selectedAlloc?.booking?.users?.full_name || 'the student'} from Room ${selectedAlloc?.rooms?.room_number}. Roster occupancy counts will be instantly updated.`}
        confirmText="Confirm Eviction"
        loading={actionLoading}
      />
    </div>
  );
}
