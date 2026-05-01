import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, BookOpen, AlertCircle, LogOut, ShieldCheck, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-brand">CampusLink Admin</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/hostels" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            <Building2 size={20} />
            <span>Hostels</span>
          </NavLink>
          <NavLink to="/admin/questions" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            <BookOpen size={20} />
            <span>Past Questions</span>
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            <AlertCircle size={20} />
            <span>Reports</span>
          </NavLink>
          <NavLink to="/admin/announcements" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            <Megaphone size={20} />
            <span>Announcements</span>
          </NavLink>
          
          {user?.role === 'super_admin' && (
            <NavLink to="/admin/admins" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
              <ShieldCheck size={20} />
              <span>Admins</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-flex">
            <h2>Admin Control Center</h2>
            <div className="user-info">
              <span className={`role-tag ${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
        }
        .admin-sidebar {
          width: 260px;
          background: #1e293b;
          color: white;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
        }
        .sidebar-header {
          padding: 2rem 1.5rem;
          border-bottom: 1px solid #334155;
        }
        .sidebar-brand {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--secondary);
        }
        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          color: #94a3b8;
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .sidebar-item:hover {
          background: #334155;
          color: white;
        }
        .sidebar-item.active {
          background: var(--primary);
          color: white;
        }
        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid #334155;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          background: none;
          border: none;
          color: #ef4444;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-size: 1rem;
        }
        .admin-main {
          margin-left: 260px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .admin-header {
          background: white;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid var(--border);
        }
        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .role-tag {
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #f1f5f9;
          color: #64748b;
        }
        .role-tag.super_admin { background: #fef2f2; color: #dc2626; }
        .role-tag.admin { background: #eff6ff; color: #2563eb; }
        .user-email { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; }

        .admin-content {
          padding: 2rem;
          flex: 1;
        }
        @media (max-width: 1024px) {
          .admin-sidebar { width: 80px; }
          .sidebar-item span, .sidebar-brand, .logout-btn span { display: none; }
          .admin-main { margin-left: 80px; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
