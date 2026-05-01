import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, ShieldCheck, ChevronLeft, ChevronRight, 
  MessageCircle, Phone, ArrowLeft, Wifi, Wind, 
  Utensils, Droplets, Shield, User, Bath, Maximize2, X, Loader2,
  Zap, Shirt, Monitor, Navigation, Video, Globe, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const HostelDetail = () => {
  const { id } = useParams();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportData, setReportData] = useState({ subject: 'Incorrect Price', description: '' });

  useEffect(() => {
    console.log("Detail page loaded for ID:", id);
    fetchHostel();
  }, [id]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReporting(true);
    try {
      const { error } = await supabase.from('reports').insert([{
        hostel_id: id,
        subject: reportData.subject,
        description: reportData.description,
        status: 'pending'
      }]);
      if (error) throw error;
      alert("Thank you. Our admins will investigate this listing.");
      setShowReportModal(false);
      setReportData({ subject: 'Incorrect Price', description: '' });
    } catch (err) {
      alert("Report failed: " + err.message);
    } finally {
      setReporting(false);
    }
  };

  const fetchHostel = async () => {
    try {
      setLoading(true);
      console.log("Fetching hostel details...");
      const { data, error } = await supabase
        .from('hostels')
        .select('*, rooms(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      console.log("Hostel data received:", data);
      setHostel(data);
    } catch (err) {
      console.error("Fetch hostel error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-state-full" style={{ padding: '10rem 0', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem' }} />
      <p>Loading hostel details...</p>
    </div>
  );

  if (!hostel) return (
    <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
      <h2>Hostel not found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The listing you are looking for might have been moved or deleted.</p>
      <Link to="/hostels" className="btn btn-primary">Back to Listings</Link>
    </div>
  );

  const images = hostel.images || [];
  const nextImage = () => images.length > 0 && setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => images.length > 0 && setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="detail-page animate-fade-in">
      <div className="container">
        <Link to="/hostels" className="back-link">
          <ArrowLeft size={18} /> Back to Hostels
        </Link>

        <div className="detail-grid">
          {/* Left Column: Visuals */}
          <div className="visuals-column">
            <div className="main-carousel">
              <AnimatePresence mode="wait">
                {images.length > 0 ? (
                  <motion.img 
                    key={currentImage}
                    src={images[currentImage]} 
                    alt={hostel.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                ) : (
                  <div className="no-image-placeholder">No images available</div>
                )}
              </AnimatePresence>
              
              {images.length > 1 && (
                <>
                  <button className="nav-btn prev" onClick={prevImage}><ChevronLeft /></button>
                  <button className="nav-btn next" onClick={nextImage}><ChevronRight /></button>
                </>
              )}
              
              {images.length > 0 && (
                <button className="zoom-btn" onClick={() => setZoomImage(images[currentImage])}>
                  <Maximize2 size={20} />
                </button>
              )}
            </div>
            
            <div className="thumbnail-grid">
              {images.map((img, i) => (
                <div 
                  key={i} 
                  className={`thumb ${i === currentImage ? 'active' : ''}`}
                  onClick={() => setCurrentImage(i)}
                >
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="info-column">
            <div className="header">
              {hostel.verification_status === 'verified' && (
                <span className="verified-badge">
                  <ShieldCheck size={14} /> Verified Listing
                </span>
              )}
              <h1>{hostel.name}</h1>
              <div className="location-row">
                <div className="location">
                  <MapPin size={18} /> {hostel.location}
                </div>
                <div className="institutional-meta">
                  <span className={`gender-badge ${hostel.gender_type}`}>{hostel.gender_type}</span>
                  <span className="dist-tag"><Navigation size={14}/> {hostel.distance_from_gate}</span>
                </div>
              </div>
            </div>

            <div className="description">
              <h3>About this Hostel</h3>
              <p>{hostel.description}</p>
              
              <div className="tour-actions">
                {hostel.video_url && (
                  <a href={hostel.video_url} target="_blank" rel="noreferrer" className="btn btn-outline">
                    <Video size={18} /> Watch Video Tour
                  </a>
                )}
                {hostel.map_url && (
                  <a href={hostel.map_url} target="_blank" rel="noreferrer" className="btn btn-outline">
                    <Globe size={18} /> Find on Maps
                  </a>
                )}
              </div>
            </div>

            <div className="contact-card glass-card">
              <h3>Interested?</h3>
              <p>Contact the owner directly for bookings or viewing.</p>
              <div className="contact-btns">
                {(hostel.contact_type === 'whatsapp' || hostel.contact_type === 'both') && (
                  <a href={`https://wa.me/${hostel.contact_value}`} className="btn btn-whatsapp">
                    <MessageCircle size={20} /> Chat on WhatsApp
                  </a>
                )}
                {(hostel.contact_type === 'call' || hostel.contact_type === 'both') && (
                  <a href={`tel:${hostel.contact_value}`} className="btn btn-call">
                    <Phone size={20} /> Call Manager
                  </a>
                )}
              </div>
              
              <div className="report-link-container">
                <button className="report-btn-text" onClick={() => setShowReportModal(true)}>
                  <AlertTriangle size={14} /> Report an issue with this listing
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        <AnimatePresence>
          {showReportModal && (
            <div className="modal-overlay">
              <motion.div 
                className="modal-content glass-card small"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="modal-header">
                  <h2>Report an Issue</h2>
                  <button className="close-btn" onClick={() => setShowReportModal(false)}><X /></button>
                </div>
                <form onSubmit={handleReportSubmit}>
                  <p className="modal-hint">Is there something wrong with this listing? Let the administrators know.</p>
                  <div className="form-group">
                    <label>What is the issue?</label>
                    <select required value={reportData.subject} onChange={e => setReportData({...reportData, subject: e.target.value})}>
                      <option value="Incorrect Price">Incorrect Price</option>
                      <option value="Hostel Full">Hostel is Full</option>
                      <option value="Wrong Location">Wrong Location</option>
                      <option value="Owner Unreachable">Owner Unreachable</option>
                      <option value="Fraudulent Content">Fraudulent Content</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      required 
                      rows="4" 
                      placeholder="Please provide more details..." 
                      value={reportData.description}
                      onChange={e => setReportData({...reportData, description: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-full" disabled={reporting}>
                    {reporting ? <Loader2 className="animate-spin" /> : 'Submit Report'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Room Variants Section */}
        <section className="rooms-section">
          <h2>Room Variants & Pricing</h2>
          <div className="rooms-grid">
            {hostel.rooms.map((room) => (
              <div key={room.id} className="room-card glass-card">
                <div className="room-header">
                  <h3>{room.room_label}</h3>
                  <div className="price">GH₵{room.price}<span>/year</span></div>
                </div>
                
                <div className="room-features">
                  <div className="feature">
                    <User size={16} /> <span>{room.occupancy} in a room</span>
                  </div>
                  <div className="feature">
                    <Bath size={16} /> <span>{room.bathroom_type === 'ensuite' ? 'Self-contained' : 'Shared Bathroom'}</span>
                  </div>
                  {room.ac_available && (
                    <div className="feature highlight">
                      <Wind size={16} /> <span>AC Available</span>
                    </div>
                  )}
                  {room.wifi_available && (
                    <div className="feature highlight">
                      <Wifi size={16} /> <span>WiFi Included</span>
                    </div>
                  )}
                  {room.generator_available && (
                    <div className="feature">
                      <Zap size={16} /> <span>Standby Generator</span>
                    </div>
                  )}
                  {room.borehole_available && (
                    <div className="feature">
                      <Droplets size={16} /> <span>Water Supply</span>
                    </div>
                  )}
                  {room.security_available && (
                    <div className="feature">
                      <Shield size={16} /> <span>24/7 Security</span>
                    </div>
                  )}
                  {room.kitchen_available && (
                    <div className="feature">
                      <Utensils size={16} /> <span>Kitchen Access</span>
                    </div>
                  )}
                  {room.laundry_available && (
                    <div className="feature">
                      <Shirt size={16} /> <span>Laundry Service</span>
                    </div>
                  )}
                  {room.study_desk_available && (
                    <div className="feature">
                      <Monitor size={16} /> <span>Study Desk</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Image Zoom Overlay */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            className="zoom-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
          >
            <button className="close-zoom"><X size={32} /></button>
            <motion.img 
              src={zoomImage} 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .detail-page { padding: 3rem 0; background: #f8fafc; min-height: 100vh; }
        
        .loading-state-full {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          color: var(--text-muted);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
          color: var(--primary);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          text-decoration: none;
          margin-bottom: 2rem;
          font-weight: 500;
        }
        .back-link:hover { color: var(--primary); }

        .detail-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 3rem;
          margin-bottom: 4rem;
        }

        .main-carousel {
          position: relative;
          height: 450px;
          background: #e2e8f0;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .main-carousel img { width: 100%; height: 100%; object-fit: cover; }
        
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .nav-btn.prev { left: 1.5rem; }
        .nav-btn.next { right: 1.5rem; }
        
        .zoom-btn {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumbnail-grid {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }
        .thumb {
          flex: 0 0 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .thumb.active { border-color: var(--primary); }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }

        .header h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .location-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .location { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 1.125rem; }
        
        .institutional-meta { display: flex; gap: 12px; align-items: center; }
        .gender-badge { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 6px; }
        .gender-badge.male { background: #eff6ff; color: #2563eb; }
        .gender-badge.female { background: #fff1f2; color: #e11d48; }
        .gender-badge.mixed { background: #f0fdf4; color: #16a34a; }
        .dist-tag { font-size: 0.875rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 6px; }

        .tour-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .btn-outline { border: 1px solid var(--border); background: white; color: var(--text); padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; text-decoration: none; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s; }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: #f8fafc; }

        .verified-badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 100px; font-size: 0.875rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 1rem; }

        .description { margin-bottom: 3rem; }
        .description h3 { margin-bottom: 1rem; }
        .description p { line-height: 1.7; color: #475569; font-size: 1.125rem; }

        .contact-card { padding: 2rem; border: 1px solid var(--primary); background: #f0f7ff; }
        .contact-card h3 { margin-bottom: 0.5rem; }
        .contact-card p { margin-bottom: 2rem; color: #64748b; }
        .contact-btns { display: flex; flex-direction: column; gap: 1rem; }
        .btn-whatsapp { background: #22c55e; color: white; }
        .btn-call { background: var(--secondary); color: white; }

        .rooms-section { border-top: 1px solid var(--border); padding-top: 4rem; }
        .rooms-section h2 { margin-bottom: 2.5rem; font-size: 2rem; }
        .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
        .room-card { padding: 2rem; border-left: 4px solid var(--primary); }
        .room-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .room-header h3 { font-size: 1.25rem; color: var(--text); }
        .price { font-size: 1.5rem; font-weight: 800; color: var(--primary); }
        .price span { font-size: 0.875rem; color: var(--text-muted); font-weight: 400; }
        
        .room-features { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .feature { display: flex; align-items: center; gap: 0.75rem; color: #475569; font-size: 0.9375rem; }
        .feature.highlight { color: var(--primary); font-weight: 600; }

        .zoom-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .zoom-overlay img { max-width: 100%; max-height: 90vh; border-radius: 8px; }
        .close-zoom { position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: white; cursor: pointer; }

        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr; }
          .main-carousel { height: 350px; }
        }
        .report-link-container { margin-top: 1.5rem; text-align: center; border-top: 1px solid var(--border); padding-top: 1rem; }
        .report-btn-text { background: none; border: none; color: var(--text-muted); font-size: 0.8125rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 0 auto; transition: color 0.2s; }
        .report-btn-text:hover { color: var(--error); }

        .modal-content.small { max-width: 440px; padding: 2rem; }
        .modal-hint { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.5rem; }
        .w-full { width: 100%; margin-top: 1rem; }
      `}</style>
    </div>
  );
};

export default HostelDetail;
