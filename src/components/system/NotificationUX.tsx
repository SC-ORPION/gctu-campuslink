'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, Check, BellOff, X } from 'lucide-react';
import { useUIStore } from '../../lib/stores/ui.store';

export default function NotificationUX() {
  const notificationsOpen = useUIStore((state) => state.notificationsOpen);
  const setNotificationsOpen = useUIStore((state) => state.setNotificationsOpen);
  const notifications = useUIStore((state) => state.notifications);
  const markAsRead = useUIStore((state) => state.markAsRead);
  const markAllAsRead = useUIStore((state) => state.markAllAsRead);
  const clearNotifications = useUIStore((state) => state.clearNotifications);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <XCircle size={16} className="text-rose-500" />;
      default: return <Info size={16} className="text-indigo-500" />;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const diff = new Date().getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          {/* Backdrop (mobile-only overlay support) */}
          <div 
            className="fixed inset-0 z-40 lg:hidden bg-slate-900/10"
            onClick={() => setNotificationsOpen(false)}
          />

          {/* Notification Menu Card */}
          <motion.div 
            className="absolute right-0 top-14 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-[#1e5faf]/15 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#1e5faf]/15 dark:border-zinc-800 flex items-center justify-between">
              <div className="text-xs font-bold text-white dark:text-zinc-100">System Notifications</div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  onClick={() => setNotificationsOpen(false)}
                  className="p-0.5 hover:bg-[#0f3058]/30 dark:hover:bg-zinc-800 rounded-md text-slate-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-2">
                  <BellOff size={24} className="text-slate-300 dark:text-zinc-600" />
                  <span>Your inbox is completely clear.</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-3.5 flex gap-3 transition-colors ${notif.read ? 'bg-white dark:bg-zinc-900' : 'bg-[#06182e]/40/50 dark:bg-zinc-800/30'}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate ${notif.read ? 'text-slate-200 dark:text-zinc-300' : 'text-slate-900 dark:text-zinc-100'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">
                          {getRelativeTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="mt-1.5 text-[9px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                        >
                          <Check size={10} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-[#1e5faf]/15 dark:border-zinc-800/80 bg-[#06182e]/40/50 dark:bg-zinc-900/50 flex justify-between">
                <button 
                  onClick={clearNotifications}
                  className="text-[9px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide"
                >
                  Clear all history
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
