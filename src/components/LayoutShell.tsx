'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // If unauthenticated guest, load children natively (e.g. login/register pages)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout-shell">
      {/* 1. Sidebar Panel */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 2. Main Content Canvas */}
      <div className="app-main-content">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-40 mb-4 -mx-4 -mt-8">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 leading-none">CampusLink</span>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded uppercase">GCTU</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            {user.role === 'admin' ? <Shield size={14} className="text-amber-500" /> : <User size={14} />}
          </div>
        </header>

        {/* Desktop Header Navigation bar (Optional stats or status details info) */}
        <header className="hidden lg:flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">GCTU CampusLink</div>
            <div className="text-sm font-extrabold text-slate-700 mt-1">Hostel Cockpit Operations</div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
              Authorized: {user.role}
            </span>
          </div>
        </header>

        {/* 3. Core Page Content */}
        <main className="flex-1 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
