'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Shield, Building, CreditCard, X, ArrowRight, CornerDownRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '../../lib/stores/ui.store';
import { useAuth } from '../../context/AuthContext';

interface SearchResult {
  id: string;
  title: string;
  category: 'students' | 'rooms' | 'payments' | 'hostels';
  subtitle: string;
  url: string;
}

export default function GlobalSearchUX() {
  const router = useRouter();
  const searchOpen = useUIStore((state) => state.searchOpen);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const { user } = useAuth();
  
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Command K trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [searchOpen]);

  // Simulated search data
  const mockDataset: SearchResult[] = [
    { id: 'h1', title: 'Dr. Hilla Limann Hall', category: 'hostels', subtitle: 'Main Campus - 120 rooms remaining', url: '/student/hostels' },
    { id: 'h2', title: 'Prof. Alabi Hostel', category: 'hostels', subtitle: 'Off Campus - Premium rooms', url: '/student/hostels' },
    { id: 's1', title: 'Abraham Doe', category: 'students', subtitle: 'GCTU002401 - Active Student profile', url: '/admin/students' },
    { id: 's2', title: 'Sarah Lamptey', category: 'students', subtitle: 'GCTU003921 - Pending Verification', url: '/admin/students' },
    { id: 'p1', title: 'GCTU-2026-092 Slip', category: 'payments', subtitle: 'Abraham Doe - GHC 4,500.00 verified', url: '/admin/payments' },
    { id: 'p2', title: 'GCTU-2026-104 Slip', category: 'payments', subtitle: 'Sarah Lamptey - GHC 4,500.00 pending', url: '/admin/payments' },
    { id: 'r1', title: 'Limann Hall - Room 402', category: 'rooms', subtitle: '4-in-1 room (3/4 occupied)', url: '/admin/allocations' },
    { id: 'r2', title: 'Alabi Hall - Room 102', category: 'rooms', subtitle: '2-in-1 premium room (1/2 occupied)', url: '/admin/allocations' },
  ];

  // Filter based on query & role (only admins can search administrative categories)
  const filteredResults = query.trim() === '' 
    ? [] 
    : mockDataset.filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) || 
                             item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
                             item.category.toLowerCase().includes(query.toLowerCase());
        
        if (user?.role === 'admin') {
          return matchesQuery;
        } else {
          // Students can only search hostels and room slips
          return matchesQuery && (item.category === 'hostels' || item.category === 'rooms');
        }
      });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'students': return <User size={14} className="text-indigo-600" />;
      case 'payments': return <CreditCard size={14} className="text-emerald-600" />;
      case 'rooms': return <Building size={14} className="text-amber-600" />;
      default: return <Building size={14} className="text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 overflow-hidden">
          {/* Overlay */}
          <motion.div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
          />

          {/* Dialog Content */}
          <motion.div 
            className="bg-white dark:bg-zinc-900 border border-[#1e5faf]/15 dark:border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Search Input Box */}
            <div className="relative border-b border-[#1e5faf]/15 dark:border-zinc-800 flex items-center px-4 py-4">
              <Search size={18} className="text-slate-400 dark:text-zinc-500 mr-3" />
              <input 
                ref={inputRef}
                type="text" 
                className="w-full text-base bg-transparent border-none outline-none text-white dark:text-zinc-100 placeholder-slate-400 font-medium"
                placeholder="Search hostels, rooms, allocations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-md hover:bg-[#0f3058]/30 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Results Canvas */}
            <div className="max-h-[360px] overflow-y-auto p-2">
              {query === '' ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Type to start searching. Try searching <span className="underline">hostels</span> or halls.
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  No records found matching "{query}"
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  {/* Category groupings */}
                  {['hostels', 'rooms', 'students', 'payments'].map(cat => {
                    const items = filteredResults.filter(r => r.category === cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-1.5">
                          {cat}
                        </div>
                        {items.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => {
                              router.push(item.url);
                              setSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#06182e]/40 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-[#0f3058]/30 dark:bg-zinc-800 flex items-center justify-center">
                                {getCategoryIcon(item.category)}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-white dark:text-zinc-100">{item.title}</div>
                                <div className="text-[10px] text-slate-400 dark:text-zinc-500">{item.subtitle}</div>
                              </div>
                            </div>
                            <CornerDownRight size={12} className="text-slate-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Commands */}
            <div className="bg-[#06182e]/40 dark:bg-zinc-900/50 px-4 py-2.5 border-t border-[#1e5faf]/15 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
              <div className="flex items-center gap-4">
                <span><kbd className="bg-white dark:bg-zinc-800 border dark:border-zinc-700 px-1 py-0.5 rounded shadow-[0_4px_24px_rgba(0,0,0,0.3)]">↑↓</kbd> Navigate</span>
                <span><kbd className="bg-white dark:bg-zinc-800 border dark:border-zinc-700 px-1 py-0.5 rounded shadow-[0_4px_24px_rgba(0,0,0,0.3)]">Enter</kbd> Select</span>
              </div>
              <div>
                <span>Press <kbd className="bg-white dark:bg-zinc-800 border dark:border-zinc-700 px-1 py-0.5 rounded shadow-[0_4px_24px_rgba(0,0,0,0.3)]">Esc</kbd> to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
