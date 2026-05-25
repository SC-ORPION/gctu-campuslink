'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, GraduationCap, Building2, User, LogOut, LayoutDashboard, Shield, CreditCard, Home, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  // Base navigation links for all users
  const guestLinks = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Hostels', path: '/hostels', icon: <Building2 size={18} /> },
  ];

  // Links for students
  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'My Room', path: '/student/room', icon: <Building2 size={18} /> },
    { name: 'Upload Payment', path: '/student/payment', icon: <CreditCard size={18} /> },
  ];

  // Links for admins
  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Verify Payments', path: '/admin/payments', icon: <CreditCard size={18} /> },
    { name: 'Allocations', path: '/admin/allocation', icon: <Building2 size={18} /> },
    { name: 'Students', path: '/admin/students', icon: <User size={18} /> },
    { name: 'Incidents', path: '/admin/incidents', icon: <FileText size={18} /> },
  ];

  const getActiveLinks = () => {
    if (!user) return guestLinks;
    if (user.role === 'admin') return adminLinks;
    return studentLinks;
  };

  const activeLinks = getActiveLinks();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link href="/" className="logo">
            <div className="logo-icon-wrapper overflow-hidden p-0.5">
              <img src="/src/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div className="logo-text">
              <span className="brand-name">GCTU</span>
              <span className="brand-link">CampusLink</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="desktop-links">
            {activeLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  href={link.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="link-icon-inline">{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {user ? (
              <div className="user-profile-wrapper">
                <span className="user-badge">
                  {user.role === 'admin' ? <Shield size={14} className="text-amber-500" /> : <User size={14} />}
                  <span className="user-name-text">{user.full_name.split(' ')[0]}</span>
                </span>
                <button onClick={handleLogout} className="btn-logout" title="Log Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-login">
                Portal Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {activeLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.name} 
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="mobile-link-icon">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="mobile-menu-footer">
            {user ? (
              <div className="mobile-user-row">
                <div className="mobile-user-info">
                  <span className="mobile-user-name">{user.full_name}</span>
                  <span className="mobile-user-role">{user.role}</span>
                </div>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="mobile-btn-logout">
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="mobile-btn-login">
                Portal Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 72px;
          transition: all 0.3s ease;
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 72px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }
        .logo-icon-wrapper {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(29, 78, 216, 0.2);
        }
        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .brand-name {
          font-weight: 900;
          font-size: 1.35rem;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .brand-link {
          font-weight: 700;
          font-size: 0.8rem;
          color: #14b8a6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .desktop-links {
          display: none;
          gap: 1.5rem;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .desktop-links {
            display: flex;
          }
        }
        .nav-item {
          text-decoration: none;
          color: #64748b;
          font-weight: 700;
          font-size: 0.925rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
        }
        .nav-item:hover {
          color: #1d4ed8;
          background: rgba(29, 78, 216, 0.04);
        }
        .nav-item.active {
          color: #1d4ed8;
          background: rgba(29, 78, 216, 0.06);
        }
        .link-icon-inline {
          display: flex;
          align-items: center;
        }
        .user-profile-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 0.75rem;
          border-left: 1px solid #e2e8f0;
        }
        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.85rem;
          color: #334155;
        }
        .user-name-text {
          max-width: 90px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-logout {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .btn-logout:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        .btn-login {
          background: #1d4ed8;
          color: white;
          text-decoration: none;
          padding: 0.625rem 1.25rem;
          font-weight: 700;
          font-size: 0.9rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15);
          transition: all 0.2s;
        }
        .btn-login:hover {
          background: #1e40af;
          transform: translateY(-1px);
        }
        .mobile-toggle {
          background: none;
          border: none;
          color: #0f172a;
          display: block;
          padding: 0.25rem;
        }
        @media (min-width: 1024px) {
          .mobile-toggle {
            display: none;
          }
        }
        .mobile-menu {
          position: fixed;
          top: 72px;
          left: 0;
          width: 100%;
          height: 0;
          background: white;
          overflow: hidden;
          transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }
        .mobile-menu.open {
          height: calc(100vh - 72px);
        }
        .mobile-menu-content {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          height: 100%;
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          text-decoration: none;
          color: #475569;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 14px;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }
        .mobile-nav-item.active {
          background: rgba(29, 78, 216, 0.06);
          color: #1d4ed8;
        }
        .mobile-menu-footer {
          margin-top: auto;
          border-top: 1px solid #f1f5f9;
          padding-top: 1.5rem;
        }
        .mobile-user-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mobile-user-info {
          display: flex;
          flex-direction: column;
        }
        .mobile-user-name {
          font-weight: 800;
          color: #0f172a;
          font-size: 1.05rem;
        }
        .mobile-user-role {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .mobile-btn-logout {
          background: rgba(239, 68, 68, 0.05);
          color: #ef4444;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .mobile-btn-login {
          display: block;
          text-align: center;
          background: #1d4ed8;
          color: white;
          text-decoration: none;
          padding: 1rem;
          font-weight: 700;
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15);
        }
      `}</style>
    </nav>
  );
}
