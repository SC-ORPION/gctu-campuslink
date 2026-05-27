'use client';

import React, { useState } from 'react';
import { Bell, ShieldCheck, CreditCard, AlertCircle, Info, Check, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'SUCCESS',
      title: 'Room Allocation Slip Issued',
      message: 'Congratulations! Your room allocation slip for Room A-204 at Tesano Palace Hostel has been generated. You can now download it from your Room Slip panel.',
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      type: 'INFO',
      title: 'Payment Verification Received',
      message: 'We have received your GCB transaction proof of payment for GH₵1,500.00. Our finance team is reviewing the transaction reference.',
      time: '1 day ago',
      read: true
    },
    {
      id: '3',
      type: 'WARNING',
      title: 'Hostel Registration Curfew Notice',
      message: 'Please review the updated gate curfew hours (10:00 PM lock) and visitation regulations for the upcoming semester.',
      time: '3 days ago',
      read: true
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <ShieldCheck className="text-emerald-600" size={18} />;
      case 'WARNING': return <AlertCircle className="text-amber-600" size={18} />;
      case 'ALERT': return <AlertCircle className="text-rose-600" size={18} />;
      default: return <Info className="text-blue-600" size={18} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-50/50 border-emerald-100';
      case 'WARNING': return 'bg-amber-50/50 border-amber-100';
      case 'ALERT': return 'bg-rose-50/50 border-rose-100';
      default: return 'bg-blue-50/50 border-blue-100';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bell className="text-indigo-600" size={20} />
            <span>Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Keep track of booking stages, receipt status, and room details.</p>
        </div>

        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#1e5faf]/15 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#06182e]/40 transition-colors"
          >
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            className={`p-5 rounded-2xl border bg-[#0a2240]/60 backdrop-blur-sm hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-shadow flex gap-4 items-start ${!n.read ? 'border-indigo-200 ring-2 ring-indigo-50/50' : 'border-[#1e5faf]/15'}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${getBgColor(n.type)}`}>
              {getIcon(n.type)}
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between gap-4">
                <h3 className={`text-xs font-extrabold ${!n.read ? 'text-slate-900' : 'text-slate-200'}`}>{n.title}</h3>
                <span className="text-[10px] text-slate-400 font-bold flex-shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-semibold">{n.message}</p>
            </div>

            <button 
              onClick={() => deleteNotification(n.id)}
              className="text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-[#06182e]/40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-16 bg-[#0a2240]/60 backdrop-blur-sm border border-[#1e5faf]/15 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <Bell className="text-slate-300 mx-auto mb-3" size={28} />
            <h3 className="text-sm font-black text-white mb-1">Clean Inbox</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">You have read all allocations status feeds and support notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
