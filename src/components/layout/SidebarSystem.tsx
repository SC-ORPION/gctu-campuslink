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
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Browse Hostels', path: '/student/hostels', icon: <Building size={16} /> },
    { name: 'My Room Slip', path: '/student/allocation', icon: <Building size={16} /> },
    { name: 'Submit Payment', path: '/student/payment', icon: <CreditCard size={16} /> },
  ];

  const adminLinks = [
    { name: 'Operations Panel', path: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Manage Hostels', path: '/admin/hostels', icon: <Building size={16} /> },
    { name: 'Verify Payments', path: '/admin/payments', icon: <CreditCard size={16} /> },
    { name: 'Room Allocations', path: '/admin/allocations', icon: <Building size={16} /> },
    { name: 'Students Profile', path: '/admin/students', icon: <Users size={16} /> },
    { name: 'Incident Reports', path: '/admin/incidents', icon: <FileText size={16} /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden bg-[#06182e]/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] flex w-64 flex-col bg-[#0a2240] border-r border-[#1e5faf]/15 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-[#1e5faf]/15">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#d4af37]/30 flex items-center justify-center">
              <img src="/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight leading-none block">CampusLink</span>
              <span className="text-[8px] font-bold text-[#d4af37] uppercase tracking-[0.12em] mt-0.5 block">GCTU Accom.</span>
            </div>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-[#0f3058] transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.12em] px-3 mb-3">
              Main Navigation
            </div>
            {links.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                    active
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/15'
                      : 'text-slate-400 hover:bg-[#0f3058]/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className={active ? 'text-[#d4af37]' : 'text-slate-500'}>{link.icon}</span>
                  <span>{link.name}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4af37]" />}
                </Link>
              );
            })}
          </div>

          {/* Admin System Section */}
          {user?.role === 'admin' && (
            <div className="space-y-1 border-t border-[#1e5faf]/10 pt-5">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.12em] px-3 mb-3">
                System Admin
              </div>
              <Link
                href="/admin/system"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                  pathname === '/admin/system'
                    ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/15'
                    : 'text-slate-400 hover:bg-[#0f3058]/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className={pathname === '/admin/system' ? 'text-[#d4af37]' : 'text-slate-500'}>
                  <Shield size={16} />
                </span>
                <span>System Diagnostics</span>
              </Link>
              <Link
                href="/admin/system/ui-showcase"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                  pathname === '/admin/system/ui-showcase'
                    ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/15'
                    : 'text-slate-400 hover:bg-[#0f3058]/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className={pathname === '/admin/system/ui-showcase' ? 'text-[#d4af37]' : 'text-slate-500'}>
                  <Eye size={16} />
                </span>
                <span>UI Kit Showcase</span>
              </Link>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#1e5faf]/15 bg-[#06182e]/30">
          {user && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#0f3058] border border-[#1e5faf]/20 flex items-center justify-center flex-shrink-0">
                  {user.role === 'admin' ? (
                    <Shield size={13} className="text-[#d4af37]" />
                  ) : (
                    <User size={13} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate leading-none">
                    {user.full_name || 'GCTU User'}
                  </div>
                  <div className="text-[9px] font-bold text-[#d4af37] uppercase mt-1 leading-none tracking-wider">
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#f43f5e] hover:bg-[#f43f5e]/10 transition-all"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
