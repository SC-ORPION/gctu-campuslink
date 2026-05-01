import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, GraduationCap, Building2, BookOpen, Info, Bell } from 'lucide-react';
import logo from '../assets/gctu-logo.jpg';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(0);

  useEffect(() => {
    fetchCount();
    // Real-time listener for new announcements
    const subscription = supabase
      .channel('announcement_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchCount = async () => {
    const { count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true });
    setAnnouncementCount(count || 0);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <GraduationCap size={20} /> },
    { name: 'Hostels', path: '/hostels', icon: <Building2 size={20} /> },
    { name: 'Past Questions', path: '/past-questions', icon: <BookOpen size={20} /> },
    { 
      name: 'Announcements', 
      path: '/announcements', 
      icon: <Bell size={20} />,
      badge: announcementCount
    },
    { name: 'About', path: '/about', icon: <Info size={20} /> },
  ];

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="logo">
            <img src={logo} alt="GCTU Logo" className="logo-img" />
            <div className="logo-text">
              <span className="brand-name">GCTU</span>
              <span className="brand-link">CampusLink</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="desktop-links">
            {navLinks.map((link) => (
              <NavLink 
                key={link.name} 
                to={link.path}
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              >
                {link.name}
                {link.badge > 0 && <span className="badge-count">{link.badge}</span>}
              </NavLink>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <NavLink 
            key={link.name} 
            to={link.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}
          >
            <div className="mobile-link-icon">
              {link.icon}
              {link.badge > 0 && <span className="mobile-badge">{link.badge}</span>}
            </div>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </div>

      <style>{`
        .navbar {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 72px;
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
          color: var(--primary);
        }
        .logo-img {
          height: 48px;
          width: auto;
          border-radius: 4px;
        }
        .logo-icon {
          color: var(--primary);
        }
        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .brand-name {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text);
        }
        .brand-link {
          font-weight: 500;
          font-size: 0.875rem;
          color: var(--secondary);
        }
        .desktop-links {
          display: none;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .desktop-links {
            display: flex;
          }
        }
        .nav-item {
          text-decoration: none;
          color: var(--text-muted);
          font-weight: 500;
          transition: color var(--duration-micro) ease;
          position: relative;
        }
        .nav-item:hover {
          color: var(--primary);
        }
        .nav-item.active {
          color: var(--primary);
        }
        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: -24px;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--primary);
          border-radius: 3px 3px 0 0;
        }
        .badge-count {
          position: absolute;
          top: -8px;
          right: -15px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 100px;
          border: 2px solid var(--surface);
        }
        .mobile-link-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 100px;
          border: 2px solid white;
        }
        .mobile-toggle {
          background: none;
          border: none;
          color: var(--text);
          display: block;
        }
        @media (min-width: 768px) {
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
          background: var(--surface);
          overflow: hidden;
          transition: height var(--duration-normal) var(--ease-out);
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid var(--border);
        }
        .mobile-menu.open {
          height: calc(100vh - 72px);
          padding: 1rem;
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          text-decoration: none;
          color: var(--text);
          font-size: 1.125rem;
          font-weight: 500;
          border-radius: var(--radius-md);
        }
        .mobile-nav-item.active {
          background: #eff6ff;
          color: var(--primary);
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
