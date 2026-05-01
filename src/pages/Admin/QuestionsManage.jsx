import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, FileText, Trash2, 
  ExternalLink, X, Upload, Loader2,
  FileCheck, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const QuestionsManage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    level: '100',
    semester: '1',
    year: '2023/2024'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('past_questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error("Fetch questions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please select a PDF file first.");
    
    setSubmitting(true);
    try {
      // 1. Upload to Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${formData.course_code.replace(/\s/g, '_')}_${Date.now()}.${fileExt}`;
      const filePath = `papers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from('past_questions')
        .insert([{
          ...formData,
          file_url: publicUrl
        }]);

      if (dbError) throw dbError;

      setIsModalOpen(false);
      setSelectedFile(null);
      fetchQuestions();
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record and its hosted file?')) return;
    try {
      const { error } = await supabase.from('past_questions').delete().eq('id', id);
      if (error) throw error;
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.course_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-view animate-fade-in">
      <div className="view-header">
        <div className="header-text">
          <h1>Past Questions Registry</h1>
          <p>Host and index academic exam papers for students.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Upload New Paper
        </button>
      </div>

      <div className="toolbar glass-card">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Filter by course code or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="questions-table card">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Syncing Registry...</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Course Details</th>
                <th>Academic Session</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div className="file-info">
                      <div className="icon-box"><FileText size={20} /></div>
                      <div>
                        <p className="course-code">{q.course_code}</p>
                        <p className="course-name">{q.course_name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="meta-cell">
                      Level {q.level} • Sem {q.semester} • {q.year}
                    </div>
                  </td>
                  <td>{new Date(q.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-btns">
                      <a href={q.file_url} target="_blank" rel="noreferrer" className="icon-btn view">
                        <ExternalLink size={18} />
                      </a>
                      <button className="icon-btn delete" onClick={() => handleDelete(q.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content glass-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h2>Host Academic Resource</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}><X /></button>
              </div>

              <form className="question-form" onSubmit={handleFileUpload}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Course Code</label>
                    <input required value={formData.course_code} onChange={e => setFormData({...formData, course_code: e.target.value})} placeholder="e.g. BITE 302" />
                  </div>
                  <div className="form-group">
                    <label>Course Title</label>
                    <input required value={formData.course_name} onChange={e => setFormData({...formData, course_name: e.target.value})} placeholder="e.g. Software Engineering" />
                  </div>
                  <div className="form-group">
                    <label>Target Level</label>
                    <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                      <option>100</option><option>200</option><option>300</option><option>400</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                      <option>1</option><option>2</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Academic Year</label>
                    <input required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="e.g. 2023/2024" />
                  </div>
                  <div className="form-group full">
                    <label>PDF Document</label>
                    <label className={`file-drop-zone ${selectedFile ? 'has-file' : ''}`}>
                      <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0])} />
                      {selectedFile ? (
                        <>
                          <FileCheck size={32} color="var(--success)" />
                          <p>{selectedFile.name}</p>
                          <span>Click to change file</span>
                        </>
                      ) : (
                        <>
                          <Upload size={32} />
                          <p>Click to select PDF paper</p>
                          <span>Maximum size: 10MB</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" /> : 'Start Hosting'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .questions-table { background: white; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 1rem 1.5rem; background: #f8fafc; text-align: left; font-size: 0.75rem; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
        
        .file-info { display: flex; align-items: center; gap: 1rem; }
        .icon-box { width: 40px; height: 40px; background: #eff6ff; color: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .course-code { font-weight: 700; color: var(--text); }
        .course-name { font-size: 0.8125rem; color: var(--text-muted); }
        
        .meta-cell { font-size: 0.875rem; font-weight: 500; }
        .action-btns { display: flex; gap: 0.5rem; }
        .icon-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); transition: all 0.2s; text-decoration: none; }
        .icon-btn.view:hover { color: var(--primary); border-color: var(--primary); background: #eff6ff; }
        .icon-btn.delete:hover { color: var(--error); border-color: var(--error); background: #fef2f2; }

        .file-drop-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 2.5rem; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .file-drop-zone:hover { border-color: var(--primary); background: #f8fafc; }
        .file-drop-zone.has-file { border-color: var(--success); background: #f0fdf4; }
        .file-drop-zone p { font-weight: 600; font-size: 0.9375rem; }
        .file-drop-zone span { font-size: 0.75rem; color: var(--text-muted); }

        .loading-state { padding: 4rem; text-align: center; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default QuestionsManage;
