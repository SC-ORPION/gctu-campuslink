'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, CheckCircle2 } from 'lucide-react';

import AllocationTable from './AllocationTable';
import RevokeAllocationModal from './RevokeAllocationModal';

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
      setSelectedAlloc(null);
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
      <div className="premium-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="premium-card-title text-2xl mb-1">Room Allocations</h1>
          <p className="text-sm font-medium text-[#64748B]">Review active roommate blocks, manual assignments, and free capacity counts.</p>
        </div>
        
        {/* Search filter */}
        <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl w-full max-w-sm">
          <Search size={16} className="text-[#94A3B8] ml-1 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search by student, room, building..."
            className="bg-transparent border-none outline-none text-sm font-semibold w-full text-[#0F172A] focus:ring-0 placeholder-[#94A3B8]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {successMsg && (
        <div className="bg-[#D1FAE5] border border-[#059669]/20 text-[#059669] p-4 rounded-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="premium-card animate-pulse h-64 bg-slate-100"></div>
      ) : (
        <AllocationTable 
          allocations={filteredAllocations}
          onOpenRevokeModal={(a) => {
            setSelectedAlloc(a);
            setShowRevokeModal(true);
          }}
        />
      )}

      {/* Revocation Warning Modal */}
      <RevokeAllocationModal 
        isOpen={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedAlloc(null);
        }}
        onConfirm={handleRevokeConfirm}
        studentName={selectedAlloc?.booking?.users?.full_name}
        roomNumber={selectedAlloc?.rooms?.room_number}
        loading={actionLoading}
      />
    </div>
  );
}
