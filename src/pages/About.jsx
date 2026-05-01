import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Heart, Users, Target, ShieldCheck } from 'lucide-react';

import gctuCampus2 from '../assets/gctu-campus-2.jpg';
import gctuAdmin from '../assets/gctu-admin.jpg';

const About = () => {
  return (
    <div className="about-page animate-fade-in">
      {/* Hero Section */}
      <section className="about-hero" style={{ backgroundImage: `url(${gctuAdmin})` }}>
        <div className="hero-overlay"></div>
        <div className="container hero-content-relative">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Connecting GCTU Students <br />to Better Living</h1>
            <p>CampusLink is the bridge between students and the resources they need to thrive at GCTU.</p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-text">
              <div className="badge">Our Mission</div>
              <h2>Removing the friction from campus navigation.</h2>
              <p>
                Searching for a hostel shouldn't be a full-time job. Downloading past questions 
                shouldn't require jumping through hoops. We built CampusLink to simplify the 
                student experience at GCTU, providing a single, trusted point of access for 
                verified accommodation and academic support.
              </p>
              
              <div className="values-list">
                <div className="value-item">
                  <div className="value-icon"><ShieldCheck /></div>
                  <div>
                    <h4>Trust & Verification</h4>
                    <p>We manually verify every hostel to protect students from scams.</p>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon"><Heart /></div>
                  <div>
                    <h4>Student First</h4>
                    <p>Every feature is designed with student needs and budget in mind.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mission-visual">
              <div className="visual-card glass-card">
                <div className="mission-img-wrapper">
                  <img src={gctuCampus2} alt="GCTU Campus Life" className="mission-img" />
                </div>
                <div className="stats">
                  <div>
                    <h3>10+</h3>
                    <p>Verified Hostels</p>
                  </div>
                  <div>
                    <h3>500+</h3>
                    <p>Past Questions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team/Support Section */}
      <section className="support">
        <div className="container">
          <div className="support-card glass-card">
            <div className="support-content">
              <h2>Official Platform for Students</h2>
              <p>
                CampusLink is an independent utility platform dedicated to serving the 
                GCTU student body. We work closely with hostel managers and academic 
                reps to keep our data fresh and reliable.
              </p>
              <div className="support-actions">
                <button className="btn btn-primary">Contact Support</button>
                <button className="btn btn-outline">Partnerships</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .about-page { padding-bottom: 4rem; }
        
        .about-hero { 
          position: relative;
          padding: 8rem 0; 
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: white;
          text-align: center;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%);
          z-index: 1;
        }
        .hero-content-relative {
          position: relative;
          z-index: 2;
        }
        .hero-content h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; margin-bottom: 1.5rem; line-height: 1.1; }
        .hero-content p { font-size: 1.25rem; opacity: 0.8; max-width: 600px; margin: 0 auto; }

        .mission { padding: 8rem 0; }
        .mission-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 6rem; align-items: center; }
        
        .badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: var(--primary); border-radius: 100px; font-weight: 700; font-size: 0.75rem; margin-bottom: 1.5rem; text-transform: uppercase; }
        .mission-text h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; color: var(--text); }
        .mission-text p { font-size: 1.125rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 3rem; }

        .values-list { display: flex; flex-direction: column; gap: 2rem; }
        .value-item { display: flex; gap: 1.5rem; }
        .value-icon { width: 48px; height: 48px; border-radius: 12px; background: #eff6ff; color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .value-item h4 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.25rem; }
        .value-item p { font-size: 0.9375rem; margin-bottom: 0; }

        .mission-visual { position: relative; }
        .visual-card { 
          padding: 2.5rem; 
          text-align: center; 
          background: white; 
          border: 1px solid var(--border);
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }
        .mission-img-wrapper {
          width: 100%;
          height: 200px;
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: 2rem;
        }
        .mission-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .stats { display: flex; justify-content: center; gap: 3rem; }
        .stats h3 { font-size: 2.5rem; font-weight: 800; color: var(--text); }
        .stats p { color: var(--text-muted); font-weight: 600; font-size: 0.875rem; }

        .support { padding: 4rem 0; }
        .support-card { 
          padding: 5rem; 
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); 
          color: white; 
          text-align: center;
        }
        .support-content { max-width: 700px; margin: 0 auto; }
        .support-content h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; }
        .support-content p { font-size: 1.125rem; opacity: 0.9; margin-bottom: 3rem; line-height: 1.7; }
        .support-actions { display: flex; justify-content: center; gap: 1.5rem; }
        .support-actions .btn-primary { background: white; color: var(--primary); }
        .support-actions .btn-outline { border: 1px solid rgba(255, 255, 255, 0.4); color: white; background: rgba(255, 255, 255, 0.1); }

        @media (max-width: 1024px) {
          .mission-grid { grid-template-columns: 1fr; gap: 4rem; text-align: center; }
          .value-item { text-align: left; }
          .mission-visual { order: -1; }
          .support-card { padding: 3rem 1.5rem; }
          .support-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default About;
