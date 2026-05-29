'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building, LayoutDashboard, CreditCard, Users, 
  FileText, Shield, User, LogOut, Menu, Settings, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../lib/stores/ui.store';
import { supabase } from '../../lib/supabase';

export default function SidebarSystem() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  const [pendingPayments, setPendingPayments] = useState(0);
  const [pendingAllocations, setPendingAllocations] = useState(0);
  const [pendingIncidents, setPendingIncidents] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchCounts = async () => {
        try {
          const { count: payCount } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'PENDING_VERIFICATION');
          setPendingPayments(payCount || 0);

          const { count: allocCount } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'CONFIRMED');
          setPendingAllocations(allocCount || 0);

          const { count: incidentCount } = await supabase
            .from('incidents')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'REPORTED');
          setPendingIncidents(incidentCount || 0);
        } catch (e) {
          console.error('[Sidebar Counts Load]', e);
        }
      };

      fetchCounts();

      // Set up real-time subscription for instant badge updates
      const paymentsSub = supabase
        .channel('sidebar-counts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchCounts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchCounts())
        .subscribe();

      return () => {
        paymentsSub.unsubscribe();
      };
    }
  }, [user]);

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
    { name: 'Report Incident', path: '/incidents', icon: <FileText size={16} /> },
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
      <aside className={`app-sidebar transition-transform duration-300 ${sidebarOpen ? 'open translate-x-0' : '-translate-x-full lg:translate-x-0'} glass-panel-dark border-r border-white/5`}>

        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gold/30 flex items-center justify-center bg-white shadow-glow-gold">
              <img src="/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white tracking-tight leading-none block">CampusLink</span>
              <span className="text-[9px] font-bold text-gold uppercase tracking-widest mt-0.5 block">GCTU Accom.</span>
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
              
              let badgeCount = 0;
              if (user?.role === 'admin') {
                if (link.name === 'Verify Payments') badgeCount = pendingPayments;
                if (link.name === 'Room Allocations') badgeCount = pendingAllocations;
                if (link.name === 'Incident Reports') badgeCount = pendingIncidents;
              }

              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gold/10 text-gold font-semibold shadow-[inset_2px_0_0_0_#FFC107]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className={active ? 'text-gold drop-shadow-[0_0_8px_rgba(255,193,7,0.5)]' : 'text-slate-500'}>{link.icon}</span>
                  <span>{link.name}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full leading-none animate-pulse">
                      {badgeCount}
                    </span>
                  )}
                  {active && badgeCount === 0 && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shadow-glow-gold" />}
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
                    ? 'bg-gold/10 text-gold font-semibold shadow-[inset_2px_0_0_0_#FFC107]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={pathname === '/admin/system' ? 'text-gold drop-shadow-[0_0_8px_rgba(255,193,7,0.5)]' : 'text-slate-500'}>
                  <Shield size={16} />
                </span>
                <span>System Diagnostics</span>
              </Link>
              <Link
                href="/admin/system/ui-showcase"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname === '/admin/system/ui-showcase'
                    ? 'bg-gold/10 text-gold font-semibold shadow-[inset_2px_0_0_0_#FFC107]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={pathname === '/admin/system/ui-showcase' ? 'text-gold drop-shadow-[0_0_8px_rgba(255,193,7,0.5)]' : 'text-slate-500'}>
                  <Eye size={16} />
                </span>
                <span>UI Kit Showcase</span>
              </Link>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/15 space-y-3">
          {user && (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  {user.role === 'admin' ? (
                    <Shield size={14} className="text-gold" />
                  ) : (
                    <User size={14} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-white truncate leading-none">
                    {user.full_name || 'GCTU User'}
                  </div>
                  <div className="text-[10px] font-bold text-gold uppercase mt-1 leading-none tracking-widest">
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-white/5 hover:border-red-500/20 transition-all duration-200"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
