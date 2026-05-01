import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, BookOpen, ArrowRight, ShieldCheck, Zap, Globe, MapPin } from 'lucide-react';
import gctuStairs from '../assets/gctu-stairs.jpg';
import gctuAdmin from '../assets/gctu-admin.jpg';
import gctuGate from '../assets/gctu-gate.jpg';
import gctuBuilding from '../assets/gctu-building.jpg';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: `url(${gctuGate})` }}>
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <motion.div 
            className="hero-text-centered"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.span variants={itemVariants} className="badge gold">GCTU Official Partner</motion.span>
            <motion.h1 variants={itemVariants}>
              Your Campus Life, <br />
              <span className="text-white">Simplified.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="hero-subtext">
              The premium platform for GCTU student resources and accommodation. 
              Find the perfect hostel and access years of academic resources instantly.
            </motion.p>
            <motion.div variants={itemVariants} className="hero-actions">
              <Link to="/hostels" className="btn btn-primary btn-large">
                Find a Hostel <ArrowRight size={18} />
              </Link>
              <Link to="/past-questions" className="btn btn-white btn-large">
                Academic Hub
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why CampusLink?</h2>
            <p>The premium platform for GCTU student resources and accommodation.</p>
          </div>
          
          <div className="grid grid-cols-3">
            <div className="feature-card glass-card">
              <div className="icon-wrapper primary">
                <Zap size={24} />
              </div>
              <h3>Instant Access</h3>
              <p>No account creation required. Browse hostels and download questions immediately.</p>
            </div>
            <div className="feature-card glass-card">
              <div className="icon-wrapper secondary">
                <ShieldCheck size={24} />
              </div>
              <h3>Verified Listings</h3>
              <p>Every hostel on our platform is manually verified by our admin team for quality and safety.</p>
            </div>
            <div className="feature-card glass-card">
              <div className="icon-wrapper primary">
                <Globe size={24} />
              </div>
              <h3>GCTU Centric</h3>
              <p>Tailored specifically for the Ghana Communication Technology University ecosystem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card animate-scale-in">
            <div className="cta-content">
              <h2>Need Help Finding a Place?</h2>
              <p>Explore our curated list of student-friendly hostels around GCTU campus.</p>
              <Link to="/hostels" className="btn btn-secondary">Explore Hostels</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section-new" style={{ backgroundImage: `url(${gctuBuilding})` }}>
        <div className="cta-overlay"></div>
        <div className="container cta-content-relative">
          <motion.div 
            className="cta-card-premium"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to find your new home?</h2>
            <p>Join thousands of GCTU students who use CampusLink to streamline their campus journey.</p>
            <div className="cta-btns">
              <Link to="/hostels" className="btn btn-primary btn-large">Browse Hostels</Link>
              <Link to="/past-questions" className="btn btn-white btn-large">Academic Hub</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <style>{`
        .home-container {
          overflow-x: hidden;
        }
        .hero { 
          position: relative;
          min-height: 85vh; 
          display: flex; 
          align-items: center; 
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          padding: 6rem 0;
          color: white;
          overflow: hidden;
        }
        .badge {
          display: inline-block;
          padding: 0.5rem 1.25rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          color: white;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.8125rem;
          margin-bottom: 2rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .badge.gold {
          background: rgba(234, 179, 8, 0.2);
          color: #fde047;
          border: 1px solid rgba(234, 179, 8, 0.3);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%);
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
        }
        .hero-text-centered {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .hero-text-centered h1 {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .hero-subtext {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 3rem;
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .text-white { color: white; }

        .hero-actions {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          margin-top: 1rem;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.875rem 1.75rem;
          border-radius: 12px;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-decoration: none;
        }
        .btn-large {
          padding: 1.125rem 2.5rem;
          font-size: 1.125rem;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(29, 78, 216, 0.3);
          background: #1d4ed8;
        }
        .btn-white {
          background: white;
          color: var(--primary);
          border: none;
        }
        .btn-white:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2);
        }
        .btn-secondary {
          background: var(--secondary);
          color: white;
        }

        .text-white { color: white; }

        @media (max-width: 768px) {
          .hero-actions { flex-direction: column; width: 100%; }
          .btn-large { width: 100%; }
        }

        .features { padding: 6rem 0; }
        .section-header { text-align: center; margin-bottom: 4rem; }
        .section-header h2 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
        .section-header p { color: var(--text-muted); font-size: 1.125rem; }

        .feature-card {
          padding: 2.5rem;
          text-align: left;
          transition: transform 0.3s ease;
        }
        .feature-card:hover { transform: translateY(-10px); }
        .icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .icon-wrapper.primary { background: #eff6ff; color: var(--primary); }
        .icon-wrapper.secondary { background: #f0fdfa; color: var(--secondary); }
        .feature-card h3 { font-size: 1.25rem; margin-bottom: 1rem; }
        .feature-card p { color: var(--text-muted); line-height: 1.6; }

        .cta-section-new { 
          position: relative;
          padding: 8rem 0; 
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: white;
          overflow: hidden;
        }
        .cta-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.85) 100%);
          z-index: 1;
        }
        .cta-content-relative {
          position: relative;
          z-index: 2;
        }
        .cta-card-premium {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .cta-card-premium h2 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }
        .cta-card-premium p {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .cta-btns {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .cta-btns { flex-direction: column; }
          .grid-cols-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Home;
