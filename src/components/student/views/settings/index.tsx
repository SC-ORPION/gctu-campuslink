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
      <div className="premium-card p-6 text-left">
        <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
          <Settings className="text-[#1D4ED8]" size={20} />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs text-[#64748B] mt-1">Manage your student preferences, contacts, and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="premium-card p-4 h-fit space-y-1">
          <button className="w-full flex items-center gap-2.5 px-4 py-3 bg-[#EFF6FF] text-[#1D4ED8] rounded-xl text-xs font-bold text-left">
            <User size={16} />
            <span>Profile Details</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-3 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold text-left">
            <Bell size={16} />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-3 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold text-left">
            <Shield size={16} />
            <span>Privacy & Security</span>
          </button>
        </div>

        {/* Configurations Form */}
        <div className="md:col-span-2 premium-card p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Readonly Info */}
            <div className="grid grid-cols-2 gap-4 border-b border-[#E2E8F0] pb-6 text-left">
              <div>
                <div className="text-[10px] font-bold text-[#64748B] uppercase">Student Name</div>
                <div className="text-xs font-bold text-[#0F172A] mt-1">{user?.name}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#64748B] uppercase">Student Index ID</div>
                <div className="text-xs font-bold text-[#0F172A] mt-1">{user?.studentId}</div>
              </div>
            </div>

            {/* Editable Info */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Contact Credentials</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#64748B]">Mobile Phone Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#64748B]">GCTU Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email}
                  className="form-input bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Notification settings */}
            <div className="space-y-4 border-t border-[#E2E8F0] pt-6 text-left">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Allocation Alerts</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 text-[#1D4ED8] bg-[#F8FAFC] border-[#CBD5E1] rounded focus:ring-[#1D4ED8]"
                  />
                  <div className="text-xs font-medium text-[#475569]">Receive email summaries on receipt verification</div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="w-4 h-4 text-[#1D4ED8] bg-[#F8FAFC] border-[#CBD5E1] rounded focus:ring-[#1D4ED8]"
                  />
                  <div className="text-xs font-medium text-[#475569]">Receive SMS notifications on roommate matches</div>
                </label>
              </div>
            </div>

            {/* Action controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary px-6 py-3"
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
