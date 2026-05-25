'use client';

import React from 'react';
import { ShieldAlert, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function BlockedPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    // Clear cookies used by middleware
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user-status=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    await logout();
    router.push('/login');
  };

  return (
    <div className="blocked-container">
      <div className="blocked-card">
        <div className="alert-icon-glow">
          <ShieldAlert size={48} className="text-red-500 animate-pulse" />
        </div>
        <h1 className="blocked-title">Access Restricted</h1>
        <p className="blocked-message">
          Your GCTU student accommodation profile has been permanently restricted by the hostel administrators. 
          You are barred from logging in, booking new hostels, or viewing allocations.
        </p>

        <div className="info-box">
          <HelpCircle size={16} className="text-red-700 flex-shrink-0" />
          <span>If you believe this is an error or wish to appeal, please contact the Dean of Students office.</span>
        </div>

        <button onClick={handleSignOut} className="signout-action-btn">
          <LogOut size={16} />
          <span>Return to Portal Login</span>
        </button>
      </div>

      <style jsx>{`
        .blocked-container {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          padding: 2rem 1rem;
          font-family: var(--font-outfit), 'Outfit', sans-serif;
        }
        .blocked-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border: 1px solid #fee2e2;
          border-radius: 20px;
          padding: 3rem 2.5rem;
          text-align: center;
          box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.05);
        }
        .alert-icon-glow {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #fef2f2;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          border: 1px solid #fee2e2;
        }
        .blocked-title {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 0.75rem;
          letter-spacing: -0.025em;
        }
        .blocked-message {
          font-size: 0.925rem;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 2rem;
          font-weight: 500;
        }
        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background-color: #fef2f2;
          border: 1px solid #fee2e2;
          color: #991b1b;
          border-radius: 12px;
          padding: 1rem;
          font-size: 0.825rem;
          font-weight: 700;
          text-align: left;
          margin-bottom: 2.5rem;
        }
        .signout-action-btn {
          width: 100%;
          border: none;
          padding: 1rem;
          background-color: #0f172a;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .signout-action-btn:hover {
          background-color: #1e293b;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
