'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminComponent from '../../components/admin/views/settings';
import StudentComponent from '../../components/student/views/settings';

export default function SettingsUnifiedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <AdminComponent />;
  }
  if (user?.role === 'student') {
    return <StudentComponent />;
  }
  return (
    <div className="p-8 text-center text-slate-400">
      Unauthorized Access.
    </div>
  );
}
