import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, CheckCircle, Clock, 
  Trash2, Eye, Filter, Search, MessageSquare, Loader2 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ReportsManage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', id);
      
      if (error) throw error;
      setReports(reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    } catch (err) {
      alert("Resolve failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setReports(reports.filter(r => r.id !== id));
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  return (
    <div className="manage-view animate-fade-in">
      <div className="view-header">
        <div className="header-text">
          <h1>User Reports</h1>
          <p>Review and resolve issues reported by students.</p>
        </div>
      </div>

      <div className="toolbar glass-card">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search reports..." />
        </div>
      </div>

      <div className="reports-list">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state glass-card">
            <p>No reports found.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="report-card card">
              <div className="report-main">
                <div className={`report-type-icon ${report.status}`}>
                  {report.status === 'pending' ? <Clock size={20} /> : <CheckCircle size={20} />}
                </div>
                <div className="report-details">
                  <div className="report-top">
                    <span className="type-tag">{report.subject}</span>
                    <span className="report-date">{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                  <h3>{report.subject}</h3>
                  <div className="report-message">
                    <MessageSquare size={16} />
                    <p>"{report.description}"</p>
                  </div>
                </div>
                <div className="report-actions">
                  {report.status === 'pending' ? (
                    <button className="btn btn-resolve" onClick={() => handleResolve(report.id)}>
                      Mark Resolved
                    </button>
                  ) : (
                    <span className="resolved-status">
                      <CheckCircle size={16} /> Resolved
                    </span>
                  )}
                  <button className="icon-btn delete" onClick={() => handleDelete(report.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .manage-view { padding-bottom: 2rem; }
        .view-header { margin-bottom: 2.5rem; }
        .view-header h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.25rem; }
        .view-header p { color: var(--text-muted); }

        .toolbar { padding: 1rem; margin-bottom: 2rem; background: white; }
        .search-bar { display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--border); width: 100%; max-width: 400px; }
        .search-bar input { border: none; background: transparent; outline: none; flex: 1; font-size: 0.875rem; }

        .reports-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .report-card { padding: 1.5rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); }
        .report-main { display: flex; gap: 1.5rem; }
        
        .report-type-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .report-type-icon.pending { background: #fff7ed; color: #f97316; }
        .report-type-icon.resolved { background: #f0fdf4; color: #22c55e; }

        .report-details { flex: 1; }
        .report-top { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .type-tag { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--primary); background: #eff6ff; padding: 2px 8px; border-radius: 4px; }
        .report-date { font-size: 0.8125rem; color: var(--text-muted); }
        
        .report-details h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.25rem; }
        .report-target { font-size: 0.875rem; color: var(--text); margin-bottom: 1rem; }
        .report-message { display: flex; gap: 0.75rem; background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #f1f5f9; color: #475569; }
        .report-message p { font-style: italic; font-size: 0.9375rem; line-height: 1.5; }

        .report-actions { display: flex; flex-direction: column; gap: 1rem; align-items: flex-end; justify-content: space-between; }
        .btn-resolve { background: var(--secondary); color: white; border: none; padding: 0.625rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.875rem; cursor: pointer; white-space: nowrap; }
        .resolved-status { color: var(--success); font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
        
        .icon-btn.delete { width: 34px; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); }
        .icon-btn.delete:hover { border-color: var(--error); color: var(--error); }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 0;
          color: var(--text-muted);
          gap: 1.5rem;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
          color: var(--primary);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-state {
          padding: 4rem;
          text-align: center;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .report-main { flex-direction: column; }
          .report-type-icon { display: none; }
          .report-actions { flex-direction: row; align-items: center; }
        }
      `}</style>
    </div>
  );
};

export default ReportsManage;
