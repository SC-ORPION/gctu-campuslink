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
      <div className="min-h-screen bg-[#06182e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="premium-spinner" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
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
    <div className="min-h-screen bg-[#06182e] text-slate-100 flex">
      <SidebarSystem />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <TopbarSystem />
        <main className="flex-grow p-5 md:p-8 max-w-[1440px] w-full mx-auto">
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
