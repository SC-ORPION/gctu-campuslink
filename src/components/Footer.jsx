import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <GraduationCap size={32} />
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
              <li><Link to="/hostels">Browse Hostels</Link></li>
              <li><Link to="/past-questions">Past Questions</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/report">Report an Issue</Link></li>
              <li><Link to="/login" style={{ color: 'var(--secondary)', fontWeight: '600' }}>Admin Portal</Link></li>
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

      <style>{`
        .footer {
          background: #0f172a;
          color: #f8fafc;
          padding: 4rem 0 2rem;
          margin-top: 4rem;
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
          color: var(--secondary);
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .footer-desc {
          color: #94a3b8;
          max-width: 400px;
          line-height: 1.6;
        }
        .footer h4 {
          color: white;
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
        }
        .footer ul {
          list-style: none;
        }
        .footer ul li {
          margin-bottom: 0.75rem;
        }
        .footer-links a {
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: var(--secondary);
        }
        .footer-contact li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #94a3b8;
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
};

export default Footer;
