import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ShieldCheck, ChevronLeft, ChevronRight, MessageCircle, Phone } from 'lucide-react';

const HostelCard = ({ hostel }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = hostel.images || [];

  // Autoplay every 2 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);

  const nextImage = (e) => {
    e.preventDefault();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const getPriceRange = () => {
    if (!hostel.rooms || hostel.rooms.length === 0) return 'N/A';
    const prices = hostel.rooms.map(r => r.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `GH₵${min}` : `GH₵${min} - GH₵${max}`;
  };

  return (
    <motion.div 
      className="hostel-card glass-card"
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card-image-container">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImage}
            src={images[currentImage]} 
            alt={hostel.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        </AnimatePresence>
        
        {images.length > 1 && (
          <>
            <button className="carousel-btn prev" onClick={prevImage}><ChevronLeft size={20} /></button>
            <button className="carousel-btn next" onClick={nextImage}><ChevronRight size={20} /></button>
            <div className="carousel-dots">
              {images.map((_, i) => (
                <div key={i} className={`dot ${i === currentImage ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}

        {hostel.verification_status === 'verified' && (
          <div className="verified-badge">
            <ShieldCheck size={14} /> Verified
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-header">
          <h3>{hostel.name}</h3>
          <span className="price-tag">{getPriceRange()}</span>
        </div>
        
        <div className="location">
          <MapPin size={16} />
          <span>{hostel.location}</span>
          <span className="dot-sep">•</span>
          <span className="dist-text">{hostel.distance_from_gate}</span>
        </div>

        <div className="card-tags">
          <span className={`gender-badge ${hostel.gender_type}`}>{hostel.gender_type}</span>
          {hostel.verification_status === 'verified' && <span className="verified-pill">Verified</span>}
        </div>

        <div className="amenities-preview">
          {hostel.rooms[0]?.ac_available && <span className="amenity-badge">AC</span>}
          {hostel.rooms[0]?.wifi_available && <span className="amenity-badge">WiFi</span>}
          {hostel.rooms[0]?.generator_available && <span className="amenity-badge">Generator</span>}
          {hostel.rooms[0]?.borehole_available && <span className="amenity-badge">Water</span>}
        </div>

        <div className="card-actions">
          <button 
            className="btn btn-view" 
            onClick={() => {
              console.log("Navigating to hostel:", hostel.id);
              if (!hostel.id) alert("Error: Hostel ID is missing!");
              window.location.href = `/hostel/${hostel.id}`;
            }}
          >
            View Rooms
          </button>
          <div className="contact-actions">
            {(hostel.contact_type === 'whatsapp' || hostel.contact_type === 'both') && (
              <a href={`https://wa.me/${hostel.contact_value}`} className="contact-btn wa" title="WhatsApp">
                <MessageCircle size={20} />
              </a>
            )}
            {(hostel.contact_type === 'call' || hostel.contact_type === 'both') && (
              <a href={`tel:${hostel.contact_value}`} className="contact-btn call" title="Call">
                <Phone size={20} />
              </a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hostel-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .card-image-container {
          position: relative;
          height: 200px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .card-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.8);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .card-image-container:hover .carousel-btn { opacity: 1; }
        .carousel-btn.prev { left: 10px; }
        .carousel-btn.next { right: 10px; }
        
        .carousel-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
        }
        .dot.active {
          background: white;
          width: 12px;
          border-radius: 3px;
        }

        .verified-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: var(--success);
          color: white;
          padding: 4px 8px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .card-body { padding: 1.25rem; }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .card-header h3 { font-size: 1.125rem; font-weight: 700; color: var(--text); }
        .price-tag { color: var(--primary); font-weight: 700; font-size: 0.875rem; }
        
        .location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .dot-sep { margin: 0 4px; color: #cbd5e1; }
        .dist-text { font-size: 0.8125rem; font-weight: 600; color: var(--primary); }
        
        .card-tags { display: flex; gap: 8px; margin-bottom: 1rem; }
        .gender-badge { font-size: 0.625rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
        .gender-badge.male { background: #eff6ff; color: #2563eb; }
        .gender-badge.female { background: #fff1f2; color: #e11d48; }
        .gender-badge.mixed { background: #f0fdf4; color: #16a34a; }
        .verified-pill { font-size: 0.625rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

        .amenities-preview { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .amenity-badge {
          background: #f1f5f9;
          color: var(--text-muted);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .btn-view {
          flex: 1;
          text-align: center;
          background: var(--primary);
          color: white;
          text-decoration: none;
          padding: 0.625rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.875rem;
        }
        .contact-actions { display: flex; gap: 0.5rem; }
        .contact-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .contact-btn:active { transform: scale(0.9); }
        .contact-btn.wa { background: #22c55e; }
        .contact-btn.call { background: var(--secondary); }
      `}</style>
    </motion.div>
  );
};

export default HostelCard;
