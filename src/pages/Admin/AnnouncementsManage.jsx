import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Trash2, Bell, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AnnouncementsManage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'General', is_priority: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('announcements').insert([formData]);
      if (error) throw error;
      setShowModal(false);
      setFormData({ title: '', content: '', category: 'General', is_priority: false });
      fetchAnnouncements();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="manage-view animate-fade-in">
      <div className="view-header">
        <div className="header-text">
          <h1>Student Announcements</h1>
          <p>Post updates and important notifications for the student body.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Create Announcement
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>Loading notifications...</p>
        </div>
      ) : (
        <div className="announcements-list">
          {announcements.length === 0 ? (
            <div className="empty-state glass-card">
              <Megaphone size={48} />
              <h3>No announcements yet</h3>
              <p>Start by creating your first student notification.</p>
            </div>
          ) : (
            <div className="announcement-cards">
              {announcements.map((item) => (
                <div key={item.id} className={`announcement-card glass-card ${item.is_priority ? 'priority' : ''}`}>
                  <div className="card-top">
                    <span className={`category-tag ${item.category.toLowerCase()}`}>{item.category}</span>
                    <button className="delete-btn" onClick={() => deleteAnnouncement(item.id)}><Trash2 size={18} /></button>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                  <div className="card-footer">
                    <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content glass-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="modal-header">
                <h2>New Announcement</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}><X /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Exam Timetable Released"
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option>General</option>
                      <option>Academic</option>
                      <option>Hostel Update</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={formData.is_priority} 
                        onChange={e => setFormData({...formData, is_priority: e.target.checked})}
                      />
                      Mark as Priority
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <textarea 
                    required 
                    rows="4" 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="Provide details for the students..."
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : 'Post Announcement'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .announcement-cards { display: grid; gap: 1.5rem; }
        .announcement-card { padding: 1.5rem; position: relative; border-left: 4px solid var(--primary); }
        .announcement-card.priority { border-left-color: #ef4444; background: #fff1f2; }
        
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .category-tag { padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .category-tag.general { background: #f1f5f9; color: #475569; }
        .category-tag.academic { background: #eff6ff; color: #2563eb; }
        .category-tag.hostel { background: #f0fdf4; color: #16a34a; }
        .category-tag.emergency { background: #fef2f2; color: #dc2626; }
        
        .announcement-card h3 { margin-bottom: 0.5rem; font-size: 1.25rem; }
        .announcement-card p { color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem; }
        .card-footer { color: #94a3b8; font-size: 0.8125rem; font-weight: 500; }
        
        .delete-btn { background: none; border: none; color: #94a3b8; cursor: pointer; transition: color 0.2s; }
        .delete-btn:hover { color: #ef4444; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: center; }
        .checkbox label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .w-full { width: 100%; margin-top: 1rem; }
      `}</style>
    </div>
  );
};

export default AnnouncementsManage;
