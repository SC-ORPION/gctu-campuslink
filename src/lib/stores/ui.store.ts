import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface UIState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  notificationsOpen: boolean;
  notifications: Notification[];
  activeNotificationCount: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  searchOpen: false,
  notificationsOpen: false,
  notifications: [
    {
      id: '1',
      title: 'Allocation Confirmed',
      message: 'Your room allocation in Dr. Hilla Limann Hall, Room 402, Bed A has been confirmed.',
      type: 'success',
      timestamp: '2026-05-25T18:30:00Z',
      read: false,
    },
    {
      id: '2',
      title: 'Payment Verification',
      message: 'Your payment slip for GCTU-2026-092 has been uploaded and is in review queue.',
      type: 'info',
      timestamp: '2026-05-25T17:15:00Z',
      read: true,
    }
  ],
  activeNotificationCount: 1,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  addNotification: (notification) => set((state) => {
    const newNotif = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    const updated = [newNotif, ...state.notifications];
    return {
      notifications: updated,
      activeNotificationCount: updated.filter(n => !n.read).length
    };
  }),

  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    return {
      notifications: updated,
      activeNotificationCount: updated.filter(n => !n.read).length
    };
  }),

  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map((n) => ({ ...n, read: true }));
    return {
      notifications: updated,
      activeNotificationCount: 0
    };
  }),

  clearNotifications: () => set({ notifications: [], activeNotificationCount: 0 })
}));
