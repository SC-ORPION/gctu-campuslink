export type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export const roles = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const roleRoutes = {
  STUDENT: '/student/dashboard',
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
} as const;

export const permissions = {
  viewHostels: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
  bookHostel: ['STUDENT'],
  verifyPayment: ['ADMIN', 'SUPER_ADMIN'],
  allocateRooms: ['ADMIN', 'SUPER_ADMIN'],
  manageUsers: ['SUPER_ADMIN'],
  viewSystemLogs: ['SUPER_ADMIN'],
};
