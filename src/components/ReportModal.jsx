import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ReportModal = ({ isOpen, onClose, targetId, type }) => {
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const reasons = {
    hostel: ['Fake Listing', 'Incorrect Price', 'Wrong Location', 'Out of Date', 'Other'],
    past_question: ['Broken Link', 'Wrong Course', 'Low Quality', 'Copyright Issue', 'Other'],
    general: ['Bug/Error', 'Suggestion', 'Contact Request', 'Other']
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('reports')
        .insert([{
          subject: `${type.toUpperCase()}: ${reason}`,
          description: message,
          status: 'pending'
        }]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !submitted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-container glass-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button className="close-btn" onClick={onClose}><X size={24} /></button>

            {!submitted ? (
              <div className="modal-content">
                <div className="modal-header">
                  <div className="icon-box warning">
                    <AlertTriangle size={24} />
                  </div>
                  <h2>Report an Issue</h2>
                  <p>Help us keep CampusLink accurate and reliable.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Reason for reporting</label>
                    <select 
                      required 
                      value={reason} 
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="" disabled>Select a reason</option>
                      {reasons[type]?.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Additional Details (Optional)</label>
                    <textarea 
                      placeholder="Please provide more information..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-submit"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : (
                      <>
                        <Send size={18} /> Submit Report
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="modal-success">
                <div className="icon-box success">
                  <CheckCircle size={48} />
                </div>
                <h2>Thank You!</h2>
                <p>Your report has been submitted successfully. Our team will review it shortly.</p>
                <button className="btn btn-primary" onClick={onClose}>Close</button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .modal-container {
          width: 100%;
          max-width: 480px;
          padding: 2.5rem;
          background: white;
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .modal-header { text-align: center; margin-bottom: 2rem; }
        .icon-box {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        .icon-box.warning { background: #fffbeb; color: var(--warning); }
        .icon-box.success { background: #f0fdf4; color: var(--success); }
        
        h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        p { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.5; }

        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; color: var(--text); }
        select, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: #f8fafc;
          font-family: inherit;
          font-size: 0.9375rem;
          outline: none;
          transition: border-color 0.2s;
        }
        select:focus, textarea:focus { border-color: var(--primary); }

        .btn-submit {
          width: 100%;
          background: var(--primary);
          color: white;
          padding: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-weight: 600;
          border: none;
        }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .modal-success { text-align: center; }
        .modal-success .btn-primary { margin-top: 2rem; width: 100%; background: var(--primary); color: white; padding: 0.75rem; border: none; font-weight: 600; border-radius: 8px; }
      `}</style>
    </AnimatePresence>
  );
};

export default ReportModal;
