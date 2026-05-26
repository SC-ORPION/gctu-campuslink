'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#1e5faf]/15 p-0.5 flex-shrink-0 bg-[#0a2240]/60 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-slate-900">GCTU CampusLink</span>
            </Link>
            <p className="footer-desc">
              Your ultimate companion for navigating campus life at GCTU. 
              Find the perfect hostel and access academic resources with ease.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/student/hostels">Browse Hostels</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/support">Contact Us</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="footer-links">
            <h4>Legal</h4>
            <ul>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/auth/login" className="admin-portal-link">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <ul>
              <li><Mail size={18} className="text-indigo-600" /> <span>info@campuslink.gctu.edu.gh</span></li>
              <li><Phone size={18} className="text-indigo-600" /> <span>+233 24 000 0000</span></li>
              <li><MapPin size={18} className="text-indigo-600" /> <span>Tesano, Accra, Ghana</span></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GCTU CampusLink. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #ffffff;
          color: #0f172a;
          padding: 5rem 0 2rem;
          margin-top: 4rem;
          border-top: 1px solid #e2e8f0;
        }
        .footer-grid {
          display: grid;
          gap: 3rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1fr 1.5fr;
          }
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .footer-desc {
          color: #64748b;
          max-width: 320px;
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .footer h4 {
          color: #0f172a;
          margin-bottom: 1.5rem;
          font-size: 1.05rem;
          font-weight: 800;
        }
        .footer ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer ul li {
          margin-bottom: 0.875rem;
        }
        .footer-links a {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
          font-size: 0.95rem;
        }
        .footer-links a:hover {
          color: #4f46e5;
        }
        .admin-portal-link {
          color: #4f46e5 !important;
          font-weight: 700 !important;
        }
        .footer-contact li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          color: #64748b;
          font-size: 0.95rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .footer-bottom {
          border-top: 1px solid #f1f5f9;
          margin-top: 4rem;
          padding-top: 2rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 500;
        }
      `}</style>
    </footer>
  );
}
