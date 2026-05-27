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
    <header className="app-topbar">

      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {user?.role === 'admin' ? 'Workstation' : 'Cockpit'}
          </span>
          <span className="text-slate-300 text-xs">/</span>
          <span className="text-[11px] font-bold text-slate-800">Console</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Admin Indicators */}
        {user?.role === 'admin' && (
          <div className="hidden sm:flex items-center gap-3 border-r border-slate-200 pr-4">
            <div className="status-badge success">
              <Cpu size={12} className="mr-1" />
              Queue: {queueHealth}
            </div>
            {pendingPayments > 0 && (
              <div className="status-badge warning">
                <Layers size={12} className="mr-1" />
                {pendingPayments} Pending
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <button
          onClick={toggleSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-slate-500 text-sm font-medium"
        >
          <Search size={16} />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden lg:inline bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-bold ml-2">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative"
          >
            <Bell size={20} />
            {activeNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#D4A017] rounded-full ring-2 ring-white" />
            )}
          </button>
          <NotificationUX />
        </div>

        {/* Role Badge */}
        <span className={`status-badge ${user?.role === 'admin' ? 'warning' : 'info'}`}>
          {user?.role}
        </span>
      </div>
    </header>
  );
}
