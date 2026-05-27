'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarSystem from './SidebarSystem';
import TopbarSystem from './TopbarSystem';
import GlobalSearchUX from '../system/GlobalSearchUX';
import { useAuth } from '../../context/AuthContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="app-shell justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0F172A] rounded-full animate-spin"></div>
          <span className="text-[11px] font-bold text-[#475569] uppercase tracking-widest">
            Restoring session...
          </span>
        </div>
      </div>
    );
  }

  // Guest layout (landing, auth pages)
  if (!user) {
    return <>{children}</>;
  }

  // Authenticated layout
  return (
    <div className="app-shell">
      <SidebarSystem />

      <div className="app-main-wrapper">
        <TopbarSystem />
        <main className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <GlobalSearchUX />
    </div>
  );
}
