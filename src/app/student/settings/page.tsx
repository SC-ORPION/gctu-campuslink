'use client';

import React, { useState } from 'react';
import { Settings, User, Bell, Shield, KeyRound, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function StudentSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Settings values
  const [phone, setPhone] = useState(user?.phone || '+233 24 123 4567');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] text-left">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="text-indigo-600" size={20} />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage your student preferences, contacts, and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-[#0a2240]/60 backdrop-blur-sm p-4 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] h-fit space-y-1">
          <button className="w-full flex items-center gap-2.5 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black text-left">
            <User size={16} />
            <span>Profile Details</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-3 text-slate-500 hover:text-slate-200 hover:bg-[#06182e]/40 rounded-xl text-xs font-black text-left">
            <Bell size={16} />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-3 text-slate-500 hover:text-slate-200 hover:bg-[#06182e]/40 rounded-xl text-xs font-black text-left">
            <Shield size={16} />
            <span>Privacy & Security</span>
          </button>
        </div>

        {/* Configurations Form */}
        <div className="md:col-span-2 bg-[#0a2240]/60 backdrop-blur-sm p-8 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Readonly Info */}
            <div className="grid grid-cols-2 gap-4 border-b border-[#1e5faf]/15 pb-6 text-left">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Student Name</div>
                <div className="text-xs font-extrabold text-slate-200 mt-1">{user?.name}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Student Index ID</div>
                <div className="text-xs font-extrabold text-slate-200 mt-1">{user?.studentId}</div>
              </div>
            </div>

            {/* Editable Info */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Contact Credentials</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300">Mobile Phone Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300">GCTU Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email}
                  className="w-full bg-[#06182e]/40/50 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* Notification settings */}
            <div className="space-y-4 border-t border-[#1e5faf]/15 pt-6 text-left">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Allocation Alerts</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-[#0f3058]/30 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <div className="text-xs font-bold text-slate-300">Receive email summaries on receipt verification</div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-[#0f3058]/30 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <div className="text-xs font-bold text-slate-300">Receive SMS notifications on roommate matches</div>
                </label>
              </div>
            </div>

            {/* Action controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#1e5faf]/15">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                {loading ? (
                  <>
                    <span>Saving...</span>
                    <Loader2 className="animate-spin" size={14} />
                  </>
                ) : success ? (
                  <>
                    <span>Preferences Saved</span>
                    <Check size={14} />
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
