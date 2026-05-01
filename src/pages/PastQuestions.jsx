import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Download, Eye, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PastQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: 'All',
    semester: 'All'
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      console.log("Fetching questions...");
      const { data, error } = await supabase
        .from('past_questions')
        .select('*');
      
      if (error) {
        console.error("Questions Error:", error);
        throw error;
      }
      console.log("Questions received:", data);
      setQuestions(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['All', '100', '200', '300', '400'];
  const semesters = ['All', '1', '2'];

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.course_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            q.course_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = filters.level === 'All' || q.level?.toString() === filters.level;
      const matchesSemester = filters.semester === 'All' || q.semester?.toString() === filters.semester;
      
      return matchesSearch && matchesLevel && matchesSemester;
    });
  }, [questions, searchTerm, filters]);

  return (
    <div className="questions-page">
      <section className="hero-compact">
        <div className="container">
          <h1>Past Questions Hub</h1>
          <p>Access GCTU academic resources and past examination papers instantly.</p>
          
          <div className="search-box glass-card">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="Enter course code or course title (e.g., BITE 302)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="main-content">
        <div className="container">
          <div className="content-layout">
            {/* Filters Sidebar */}
            <aside className="filters-sidebar">
              <div className="filter-group">
                <h3>Level</h3>
                <div className="filter-options">
                  {levels.map(l => (
                    <button 
                      key={l}
                      className={`filter-btn ${filters.level === l ? 'active' : ''}`}
                      onClick={() => setFilters({...filters, level: l})}
                    >
                      {l === 'All' ? 'All Levels' : `Level ${l}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <h3>Semester</h3>
                <div className="filter-options">
                  {semesters.map(s => (
                    <button 
                      key={s}
                      className={`filter-btn ${filters.semester === s ? 'active' : ''}`}
                      onClick={() => setFilters({...filters, semester: s})}
                    >
                      {s === 'All' ? 'All Semesters' : `Semester ${s}`}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Questions List */}
            <div className="questions-list">
              <div className="list-header">
                <h2>{filteredQuestions.length} Documents Found</h2>
              </div>

              <div className="grid-stack">
                {filteredQuestions.map((q, i) => (
                  <motion.div 
                    key={q.id} 
                    className="question-card glass-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="card-info">
                      <div className="file-icon">
                        <FileText size={24} />
                      </div>
                      <div className="details">
                        <span className="course-code">{q.course_code}</span>
                        <h3>{q.course_title}</h3>
                        <div className="meta">
                          <span>Level {q.level}</span>
                          <span className="dot"></span>
                          <span>Semester {q.semester}</span>
                          <span className="dot"></span>
                          <span>Year {q.year}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button className="action-btn view" title="View PDF">
                        <Eye size={20} />
                      </button>
                      <button className="action-btn download" title="Download PDF">
                        <Download size={20} />
                        <span>Download</span>
                      </button>
                    </div>
                  </motion.div>
                ))}

                {filteredQuestions.length === 0 && (
                  <div className="empty-state glass-card">
                    <FileText size={48} className="empty-icon" />
                    <h3>No results found</h3>
                    <p>We couldn't find any questions matching your criteria. Try searching for a different course code.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .questions-page { background: #f8fafc; min-height: 100vh; padding-bottom: 4rem; }
        .hero-compact { 
          padding: 4rem 0; 
          background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
          color: white;
          text-align: center;
        }
        .hero-compact h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 800; }
        .hero-compact p { font-size: 1.125rem; opacity: 0.9; margin-bottom: 2.5rem; }
        
        .search-box {
          max-width: 700px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          padding: 0.5rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }
        .search-icon { opacity: 0.7; margin-right: 1rem; }
        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 1.125rem;
          padding: 0.75rem 0;
          outline: none;
        }
        .search-box input::placeholder { color: rgba(255, 255, 255, 0.6); }

        .main-content { padding: 3rem 0; }
        .content-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 3rem;
        }

        .filter-group { margin-bottom: 2.5rem; }
        .filter-group h3 { font-size: 0.875rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 1.25rem; }
        .filter-options { display: flex; flex-direction: column; gap: 0.5rem; }
        .filter-btn {
          text-align: left;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-weight: 500;
          transition: all 0.2s;
        }
        .filter-btn:hover { background: #f1f5f9; color: var(--text); }
        .filter-btn.active { background: var(--primary); color: white; }

        .list-header { margin-bottom: 1.5rem; }
        .list-header h2 { font-size: 1.25rem; color: var(--text-muted); font-weight: 600; }

        .grid-stack { display: flex; flex-direction: column; gap: 1rem; }
        .question-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: white;
          border: 1px solid var(--border);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .question-card:hover { transform: translateX(5px); box-shadow: var(--shadow-md); border-color: var(--primary); }
        
        .card-info { display: flex; align-items: center; gap: 1.5rem; }
        .file-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: #eff6ff;
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .course-code { font-weight: 700; color: var(--primary); font-size: 0.875rem; }
        .question-card h3 { font-size: 1.125rem; margin-top: 0.25rem; }
        .meta { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-muted); }
        .dot { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }

        .card-actions { display: flex; gap: 0.75rem; }
        .action-btn {
          height: 44px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.view { width: 44px; background: #f1f5f9; color: var(--text); }
        .action-btn.download {
          padding: 0 1.25rem;
          background: var(--secondary);
          color: white;
          font-weight: 600;
          gap: 0.5rem;
        }
        .action-btn:hover { opacity: 0.9; transform: scale(1.02); }

        .empty-state { padding: 4rem; text-align: center; }
        .empty-icon { color: #e2e8f0; margin-bottom: 1.5rem; }
        .empty-state h3 { margin-bottom: 0.5rem; }
        .empty-state p { color: var(--text-muted); max-width: 400px; margin: 0 auto; }

        @media (max-width: 1024px) {
          .content-layout { grid-template-columns: 1fr; }
          .filters-sidebar { order: 2; display: flex; overflow-x: auto; padding-bottom: 1rem; gap: 2rem; }
          .filter-group { margin-bottom: 0; min-width: 200px; }
          .filter-options { flex-direction: row; }
        }
        @media (max-width: 640px) {
          .question-card { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .card-actions { width: 100%; }
          .action-btn.download { flex: 1; }
        }
      `}</style>
    </div>
  );
};

export default PastQuestions;
