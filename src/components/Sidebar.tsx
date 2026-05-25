'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Building, LayoutDashboard, CreditCard, Users, 
  FileText, Shield, User, LogOut, Settings 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    // Clear cookies used by middleware
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user-status=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    await logout();
  };

  // Student Navigation Links
  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Browse Hostels', path: '/hostels', icon: <Building size={18} /> },
    { name: 'My Room Slip', path: '/student/room', icon: <Building size={18} /> },
    { name: 'Submit Payment', path: '/student/payment', icon: <CreditCard size={18} /> },
  ];

  // Admin Navigation Links
  const adminLinks = [
    { name: 'Operations Panel', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Manage Hostels', path: '/admin/hostels', icon: <Building size={18} /> },
    { name: 'Verify Payments', path: '/admin/payments', icon: <CreditCard size={18} /> },
    { name: 'Room Allocations', path: '/admin/allocation', icon: <Building size={18} /> },
    { name: 'Students Profile', path: '/admin/students', icon: <Users size={18} /> },
    { name: 'Incident Reports', path: '/admin/incidents', icon: <FileText size={18} /> },
  ];

  const currentLinks = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* 1. Header Logo */}
      <div>
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Building size={20} />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-none">CampusLink</div>
            <div className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">GCTU Hostels</div>
          </div>
        </div>

        {/* 2. Nav Items */}
        <nav className="space-y-1">
          {currentLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.name} 
                href={link.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer Profile */}
      <div className="pt-6 border-t border-slate-100">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                {user.role === 'admin' ? <Shield size={14} className="text-amber-500" /> : <User size={14} />}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-black text-slate-900 truncate leading-tight">
                  {user.full_name || 'GCTU User'}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {user.role}
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
