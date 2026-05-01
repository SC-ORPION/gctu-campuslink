import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Bell, Calendar, ChevronRight, Info, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Academic', 'Hostel Update', 'General', 'Emergency'];
  const filtered = filter === 'All' ? announcements : announcements.filter(a => a.category === filter);

  return (
    <div className="announcements-page animate-fade-in">
      <div className="container">
        <header className="page-header">
          <div className="badge"><Bell size={14} /> Student Notifications</div>
          <h1>Announcements & Updates</h1>
          <p>Stay informed about everything happening at GCTU.</p>
        </header>

        <div className="filter-bar">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="content-section">
          {loading ? (
            <div className="loading-pane">
              <Loader2 className="animate-spin" size={48} />
              <p>Fetching latest updates...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-pane glass-card">
              <Info size={48} />
              <h3>No announcements in this category</h3>
              <p>Check back later for new updates.</p>
            </div>
          ) : (
            <div className="announcements-grid">
              {filtered.map((item, index) => (
                <motion.div 
                  key={item.id}
                  className={`announcement-item glass-card ${item.is_priority ? 'priority' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="item-header">
                    <span className={`cat-label ${item.category.toLowerCase().replace(' ', '-')}`}>
                      {item.category}
                    </span>
                    {item.is_priority && <span className="priority-tag"><AlertCircle size={14} /> Priority</span>}
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.content}</p>
                  <div className="item-footer">
                    <span className="timestamp">
                      <Calendar size={14} /> {new Date(item.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .announcements-page { padding: 4rem 0; background: #f8fafc; min-height: 100vh; }
        .page-header { text-align: center; margin-bottom: 4rem; }
        .page-header h1 { font-size: 3rem; font-weight: 800; margin: 1rem 0; color: var(--text); }
        .page-header p { font-size: 1.25rem; color: var(--text-muted); }
        
        .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: #eff6ff; color: var(--primary); border-radius: 100px; font-weight: 700; font-size: 0.8125rem; }

        .filter-bar { display: flex; justify-content: center; gap: 1rem; margin-bottom: 3rem; flex-wrap: wrap; }
        .filter-btn { padding: 8px 20px; border-radius: 100px; border: 1px solid var(--border); background: white; color: var(--text-muted); font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .filter-btn:hover { border-color: var(--primary); color: var(--primary); }
        .filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 12px rgba(29, 78, 216, 0.2); }

        .announcements-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 900px; margin: 0 auto; }
        .announcement-item { padding: 2.5rem; position: relative; border-left: 5px solid transparent; }
        .announcement-item.priority { border-left-color: #ef4444; }
        
        .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .cat-label { padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .cat-label.academic { background: #eff6ff; color: #2563eb; }
        .cat-label.hostel-update { background: #f0fdf4; color: #16a34a; }
        .cat-label.emergency { background: #fef2f2; color: #dc2626; }
        .cat-label.general { background: #f8fafc; color: #64748b; }
        
        .priority-tag { display: flex; align-items: center; gap: 4px; color: #ef4444; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }

        .announcement-item h2 { font-size: 1.75rem; font-weight: 800; margin-bottom: 1rem; color: var(--text); }
        .announcement-item p { font-size: 1.125rem; line-height: 1.7; color: #475569; margin-bottom: 2rem; }
        
        .item-footer { display: flex; align-items: center; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
        .timestamp { display: flex; align-items: center; gap: 6px; color: #94a3b8; font-size: 0.875rem; font-weight: 600; }

        .loading-pane, .empty-pane { padding: 6rem; text-align: center; color: var(--text-muted); }
        .animate-spin { animation: spin 1s linear infinite; color: var(--primary); margin-bottom: 1.5rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .announcement-item { padding: 1.5rem; }
          .page-header h1 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default Announcements;
