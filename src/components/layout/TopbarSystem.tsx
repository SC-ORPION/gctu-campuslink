'use client';

import React from 'react';
import { Menu, Search, Bell, Cpu, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../lib/stores/ui.store';
import NotificationUX from '../system/NotificationUX';

export default function TopbarSystem() {
  const { user } = useAuth();

  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const toggleSearch = useUIStore((state) => state.toggleSearch);
  const toggleNotifications = useUIStore((state) => state.toggleNotifications);
  const activeNotificationCount = useUIStore((state) => state.activeNotificationCount);

  const queueHealth = 'OPTIMAL';
  const pendingPayments = 3;

  return (
    <header className="h-16 border-b border-[#1e5faf]/15 bg-[#0a2240]/80 backdrop-blur-xl flex items-center justify-between px-5 sticky top-0 z-40">

      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-[#0f3058] transition-colors"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">
            {user?.role === 'admin' ? 'Workstation' : 'Cockpit'}
          </span>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-[10px] font-bold text-slate-300">Console</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Admin Indicators */}
        {user?.role === 'admin' && (
          <div className="hidden sm:flex items-center gap-2 border-r border-[#1e5faf]/15 pr-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15">
              <Cpu size={10} className="text-emerald-400" />
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">
                Queue: {queueHealth}
              </span>
            </div>
            {pendingPayments > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/8 border border-amber-500/15">
                <Layers size={10} className="text-amber-400" />
                <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider">
                  {pendingPayments} Pending
                </span>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <button
          onClick={toggleSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f3058]/40 hover:bg-[#0f3058]/60 border border-[#1e5faf]/15 transition-colors text-slate-400 text-xs font-semibold"
        >
          <Search size={13} className="text-slate-500" />
          <span className="hidden md:inline text-[11px]">Search</span>
          <kbd className="hidden lg:inline bg-[#06182e] border border-[#1e5faf]/15 px-1.5 py-0.5 rounded text-[9px] text-slate-500 font-bold ml-1">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 rounded-xl text-slate-400 hover:bg-[#0f3058]/50 transition-colors relative"
          >
            <Bell size={16} />
            {activeNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d4af37] rounded-full ring-2 ring-[#0a2240]" />
            )}
          </button>
          <NotificationUX />
        </div>

        {/* Role Badge */}
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-[0.1em] ${
          user?.role === 'admin'
            ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
            : 'bg-[#4a9eff]/10 text-[#4a9eff] border border-[#4a9eff]/20'
        }`}>
          {user?.role}
        </span>
      </div>
    </header>
  );
}
