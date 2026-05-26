'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
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
      <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Hostel & Room Manager</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Register new accommodation blocks, adjust pricing schemes, and set gender filters.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-755 text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex items-center gap-2 self-start md:self-auto hover:scale-[1.02]"
        >
          <Plus size={16} /> Register New Hostel
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-zinc-950 p-12 rounded-2xl h-64 border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] animate-pulse flex flex-col gap-4">
          <div className="skeleton-line w-full h-8"></div>
          <div className="skeleton-line w-full h-8"></div>
          <div className="skeleton-line w-2/3 h-6"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-[#1e5faf]/15 dark:border-zinc-900">
            <h3 className="text-xs font-black text-white dark:text-zinc-200 uppercase tracking-widest flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Registered Hostels</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-650 dark:text-zinc-400">
              <thead>
                <tr className="border-b border-[#1e5faf]/15 dark:border-zinc-900 text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                  <th className="p-4">Hostel Name</th>
                  <th className="p-4">Campus Location</th>
                  <th className="p-4">Zone details</th>
                  <th className="p-4">Gender Rules</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-900/50">
                {hostels.map((h) => (
                  <tr key={h.id} className="hover:bg-[#06182e]/40/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4 font-black text-white dark:text-zinc-200">{h.name}</td>
                    <td className="p-4 font-bold text-slate-300 dark:text-zinc-350">{h.location_name}</td>
                    <td className="p-4 font-mono text-slate-400 dark:text-zinc-550">{h.campus}</td>
                    <td className="p-4">
                      <span className="inline-flex bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {h.gender_rule.replace('_ONLY', '').toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="bg-[#06182e]/40 hover:bg-[#0f3058]/30 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-[#1e5faf]/15 dark:border-zinc-800 text-slate-650 dark:text-zinc-300 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                          Edit
                        </button>
                        <button className="bg-red-50 dark:bg-rose-950/20 text-red-650 dark:text-rose-400 border border-red-200 dark:border-rose-900/30 font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-rose-950/50 transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {hostels.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-zinc-650 font-bold italic">
                      No hostels registered in the database. Click 'Register New Hostel' to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0a2240]/60 backdrop-blur-sm max-w-md w-full rounded-2xl border border-[#1e5faf]/15 p-6 shadow-2xl space-y-6 text-left animate-fade-in">
            <div className="flex items-center gap-3 border-b border-[#1e5faf]/15 pb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Register New Hostel</h3>
                <p className="text-xs font-semibold text-slate-400">Add hostel metadata to GCTU directory</p>
              </div>
            </div>

            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">Hostel Brand Name</label>
                <input 
                  type="text" 
                  value={newHostel.name}
                  onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                  placeholder="e.g. Tesano Palace Hostel"
                  className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">Exact Location Address</label>
                <input 
                  type="text" 
                  value={newHostel.location_name}
                  onChange={(e) => setNewHostel({ ...newHostel, location_name: e.target.value })}
                  placeholder="e.g. Tesano, Accra (2 mins walk)"
                  className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">Campus Zone</label>
                  <select 
                    value={newHostel.campus}
                    onChange={(e) => setNewHostel({ ...newHostel, campus: e.target.value })}
                    className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-3 py-3 text-xs text-white focus:outline-none"
                  >
                    <option value="TESANO_MAIN">Tesano Main</option>
                    <option value="TESANO_SOUTH">Tesano South</option>
                    <option value="ABEKA_CAMPUS">Abeka Campus</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">Gender Rules</label>
                  <select 
                    value={newHostel.gender_rule}
                    onChange={(e) => setNewHostel({ ...newHostel, gender_rule: e.target.value })}
                    className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-3 py-3 text-xs text-white focus:outline-none"
                  >
                    <option value="MIXED">Mixed Occupants</option>
                    <option value="MALE_ONLY">Male Only</option>
                    <option value="FEMALE_ONLY">Female Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1e5faf]/15">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-3 bg-[#06182e]/40 border border-[#1e5faf]/15 text-slate-200 rounded-xl font-bold text-xs hover:bg-[#0f3058]/30 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
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
