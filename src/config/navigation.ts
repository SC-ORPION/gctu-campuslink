import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  KeyRound, 
  Bell, 
  User, 
  Settings, 
  Users, 
  ShieldCheck, 
  Terminal
} from 'lucide-react';

export const studentNavigation = [
  {
    name: 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Book Hostels',
    href: '/student/hostels',
    icon: Building2
  },
  {
    name: 'Payments',
    href: '/student/payment',
    icon: CreditCard
  },
  {
    name: 'My Room',
    href: '/student/allocation',
    icon: KeyRound
  },
  {
    name: 'Notifications',
    href: '/student/notifications',
    icon: Bell
  },
  {
    name: 'Profile',
    href: '/student/profile',
    icon: User
  },
  {
    name: 'Settings',
    href: '/student/settings',
    icon: Settings
  }
];

export const adminNavigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Students Manager',
    href: '/admin/students',
    icon: Users
  },
  {
    name: 'Hostels Manager',
    href: '/admin/hostels',
    icon: Building2
  },
  {
    name: 'Verify Payments',
    href: '/admin/payments',
    icon: CreditCard
  },
  {
    name: 'Room Allocations',
    href: '/admin/allocations',
    icon: KeyRound
  },
  {
    name: 'System Config',
    href: '/admin/settings',
    icon: Settings
  },
  {
    name: 'System Performance',
    href: '/admin/system',
    icon: Terminal
  }
];
