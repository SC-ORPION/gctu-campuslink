'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 p-0.5 flex-shrink-0 bg-white">
                <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-cover" />
              </div>
              <span>GCTU CampusLink</span>
            </Link>
            <p className="footer-desc">
              Your ultimate companion for navigating campus life at GCTU. 
              Find the perfect hostel and access academic resources with ease.
            </p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/hostels">Browse Hostels</Link></li>
              <li><Link href="/student/dashboard">Student Dashboard</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/login" className="admin-portal-link">Admin Portal</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact Us</h4>
            <ul>
              <li><Mail size={18} /> info@campuslink.gctu.edu.gh</li>
              <li><Phone size={18} /> +233 24 000 0000</li>
              <li><MapPin size={18} /> Tesano, Accra, Ghana</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GCTU CampusLink. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #0f172a;
          color: #f8fafc;
          padding: 4rem 0 2rem;
          margin-top: 6rem;
          border-top: 1px solid #1e293b;
        }
        .footer-grid {
          display: grid;
          gap: 3rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1.5fr;
          }
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #14b8a6;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
        }
        .footer-desc {
          color: #94a3b8;
          max-width: 400px;
          line-height: 1.6;
          font-size: 0.925rem;
        }
        .footer h4 {
          color: white;
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
          font-weight: 800;
        }
        .footer ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer ul li {
          margin-bottom: 0.75rem;
        }
        .footer-links a {
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
          font-size: 0.925rem;
        }
        .footer-links a:hover {
          color: #14b8a6;
        }
        .admin-portal-link {
          color: #14b8a6 !important;
          font-weight: 700 !important;
        }
        .footer-contact li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #94a3b8;
          font-size: 0.925rem;
          margin-bottom: 0.75rem;
        }
        .footer-bottom {
          border-top: 1px solid #1e293b;
          margin-top: 3rem;
          padding-top: 2rem;
          text-align: center;
          color: #64748b;
          font-size: 0.875rem;
        }
      `}</style>
    </footer>
  );
}
