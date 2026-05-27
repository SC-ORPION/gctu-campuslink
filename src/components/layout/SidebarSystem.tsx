'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building, LayoutDashboard, CreditCard, Users, 
  FileText, Shield, User, LogOut, Menu, Settings, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../lib/stores/ui.store';

export default function SidebarSystem() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  const handleLogout = async () => {
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user-status=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    await logout();
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Browse Hostels', path: '/hostels', icon: <Building size={16} /> },
    { name: 'My Room Slip', path: '/allocations', icon: <Building size={16} /> },
    { name: 'Submit Payment', path: '/payments', icon: <CreditCard size={16} /> },
  ];

  const adminLinks = [
    { name: 'Operations Panel', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Manage Hostels', path: '/hostels', icon: <Building size={16} /> },
    { name: 'Verify Payments', path: '/payments', icon: <CreditCard size={16} /> },
    { name: 'Room Allocations', path: '/allocations', icon: <Building size={16} /> },
    { name: 'Students Profile', path: '/students', icon: <Users size={16} /> },
    { name: 'Incident Reports', path: '/incidents', icon: <FileText size={16} /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#D4A017]/30 flex items-center justify-center bg-white">
              <img src="/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white tracking-tight leading-none block">CampusLink</span>
              <span className="text-[9px] font-bold text-[#D4A017] uppercase tracking-widest mt-0.5 block">GCTU Accom.</span>
            </div>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">
              Main Navigation
            </div>
            {links.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#D4A017]/10 text-[#D4A017] font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className={active ? 'text-[#D4A017]' : 'text-slate-500'}>{link.icon}</span>
                  <span>{link.name}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4A017]" />}
                </Link>
              );
            })}
          </div>

          {/* Admin System Section */}
          {user?.role === 'admin' && (
            <div className="space-y-2 border-t border-white/5 pt-6">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">
                System Admin
              </div>
              <Link
                href="/admin/system"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname === '/admin/system'
                    ? 'bg-[#D4A017]/10 text-[#D4A017] font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={pathname === '/admin/system' ? 'text-[#D4A017]' : 'text-slate-500'}>
                  <Shield size={16} />
                </span>
                <span>System Diagnostics</span>
              </Link>
              <Link
                href="/admin/system/ui-showcase"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname === '/admin/system/ui-showcase'
                    ? 'bg-[#D4A017]/10 text-[#D4A017] font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={pathname === '/admin/system/ui-showcase' ? 'text-[#D4A017]' : 'text-slate-500'}>
                  <Eye size={16} />
                </span>
                <span>UI Kit Showcase</span>
              </Link>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          {user && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  {user.role === 'admin' ? (
                    <Shield size={14} className="text-[#D4A017]" />
                  ) : (
                    <User size={14} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-white truncate leading-none">
                    {user.full_name || 'GCTU User'}
                  </div>
                  <div className="text-[10px] font-bold text-[#D4A017] uppercase mt-1 leading-none tracking-widest">
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
