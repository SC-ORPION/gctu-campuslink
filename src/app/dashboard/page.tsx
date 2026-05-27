'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../components/admin/views/dashboard';
import StudentDashboard from '../../components/student/views/dashboard';

export default function DashboardUnifiedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  return (
    <div className="p-8 text-center text-slate-400">
      Unauthorized Access.
    </div>
  );
}
