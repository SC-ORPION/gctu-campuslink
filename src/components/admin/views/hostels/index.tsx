'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Plus, Edit, Trash2, ShieldCheck, HelpCircle } from 'lucide-react';

interface Hostel {
  id: string;
  name: string;
  location_name: string;
  campus: string;
  gender_rule: string;
}

export default function AdminHostelsPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHostel, setNewHostel] = useState({
    name: '',
    location_name: '',
    campus: 'TESANO_MAIN',
    gender_rule: 'MIXED'
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      const { data, error } = await supabase
        .from('hostels')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHostels(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostel.name || !newHostel.location_name) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('hostels')
        .insert([{
          name: newHostel.name.trim(),
          location_name: newHostel.location_name.trim(),
          campus: newHostel.campus,
          gender_rule: newHostel.gender_rule
        }]);

      if (error) throw error;

      setShowCreateModal(false);
      setNewHostel({ name: '', location_name: '', campus: 'TESANO_MAIN', gender_rule: 'MIXED' });
      await fetchHostels();
    } catch (err: any) {
      alert(err.message || 'Failed to create hostel.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="premium-card flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="premium-card-title text-2xl mb-1">Hostel & Room Manager</h1>
          <p className="text-sm font-medium text-[#64748B]">Register new accommodation blocks, adjust pricing schemes, and set gender filters.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary self-start md:self-auto"
        >
          <Plus size={16} /> Register New Hostel
        </button>
      </div>

      {loading ? (
        <div className="premium-card h-64 animate-pulse bg-slate-100 flex flex-col gap-4"></div>
      ) : (
        <div className="premium-table-container text-left">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-2">
              <Building2 size={16} className="text-[#1D4ED8]" />
              <span>Registered Hostels</span>
            </h3>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Hostel Name</th>
                <th>Campus Location</th>
                <th>Zone details</th>
                <th>Gender Rules</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hostels.map((h) => (
                <tr key={h.id}>
                  <td className="font-semibold text-[#0F172A]">{h.name}</td>
                  <td className="font-bold text-[#475569]">{h.location_name}</td>
                  <td className="font-mono text-[#64748B] text-xs">{h.campus}</td>
                  <td>
                    <span className="status-badge info">
                      {h.gender_rule.replace('_ONLY', '').toLowerCase()}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-secondary h-8 px-3 text-xs">
                        Edit
                      </button>
                      <button className="btn h-8 px-3 text-xs bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20 hover:bg-[#FEE2E2]">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {hostels.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#64748B] font-medium text-sm">
                    No hostels registered in the database. Click 'Register New Hostel' to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6 text-left animate-fade-in">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Register New Hostel</h3>
                <p className="text-sm font-medium text-[#64748B]">Add hostel metadata to GCTU directory</p>
              </div>
            </div>

            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Hostel Brand Name</label>
                <input 
                  type="text" 
                  value={newHostel.name}
                  onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                  placeholder="e.g. Tesano Palace Hostel"
                  className="form-input"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Exact Location Address</label>
                <input 
                  type="text" 
                  value={newHostel.location_name}
                  onChange={(e) => setNewHostel({ ...newHostel, location_name: e.target.value })}
                  placeholder="e.g. Tesano, Accra (2 mins walk)"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Campus Zone</label>
                  <select 
                    value={newHostel.campus}
                    onChange={(e) => setNewHostel({ ...newHostel, campus: e.target.value })}
                    className="form-input"
                  >
                    <option value="TESANO_MAIN">Tesano Main</option>
                    <option value="TESANO_SOUTH">Tesano South</option>
                    <option value="ABEKA_CAMPUS">Abeka Campus</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Gender Rules</label>
                  <select 
                    value={newHostel.gender_rule}
                    onChange={(e) => setNewHostel({ ...newHostel, gender_rule: e.target.value })}
                    className="form-input"
                  >
                    <option value="MIXED">Mixed Occupants</option>
                    <option value="MALE_ONLY">Male Only</option>
                    <option value="FEMALE_ONLY">Female Only</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn flex-1 bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={actionLoading}
                >
                  Register Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
