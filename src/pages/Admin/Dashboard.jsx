import React, { useState, useEffect } from 'react';
import { 
  Building2, BookOpen, Bell, AlertTriangle, 
  TrendingUp, Users, Clock, ChevronRight,
  Loader2, CheckCircle2, MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    hostels: 0,
    questions: 0,
    announcements: 0,
    reports: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch Counts in Parallel
      const [hostels, questions, announcements, reports] = await Promise.all([
        supabase.from('hostels').select('*', { count: 'exact', head: true }),
        supabase.from('past_questions').select('*', { count: 'exact', head: true }),
        supabase.from('announcements').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats({
        hostels: hostels.count || 0,
        questions: questions.count || 0,
        announcements: announcements.count || 0,
        reports: reports.count || 0
      });

      // Fetch Recent Reports for the feed
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentReports(reportsData || []);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Hostels', value: stats.hostels, icon: <Building2 />, color: 'blue', link: '/admin/hostels' },
    { label: 'Past Questions', value: stats.questions, icon: <BookOpen />, color: 'green', link: '/admin/questions' },
    { label: 'Announcements', value: stats.announcements, icon: <Bell />, color: 'purple', link: '/admin/announcements' },
    { label: 'Active Reports', value: stats.reports, icon: <AlertTriangle />, color: 'orange', link: '/admin/reports' },
  ];

  if (loading) return (
    <div className="dashboard-loading">
      <Loader2 className="animate-spin" size={40} />
      <p>Syncing Command Center...</p>
    </div>
  );

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="welcome-section">
        <h1>Welcome Back, Admin</h1>
        <p>Here's what's happening across CampusLink today.</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <Link to={stat.link} key={stat.label} className={`stat-card card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
            <div className="stat-trend">
              <TrendingUp size={16} /> Live
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Reports Panel */}
        <div className="dashboard-panel card">
          <div className="panel-header">
            <h3><MessageSquare size={18} /> Recent Student Reports</h3>
            <Link to="/admin/reports" className="view-all">View All <ChevronRight size={16}/></Link>
          </div>
          <div className="panel-content">
            {recentReports.length > 0 ? (
              recentReports.map(report => (
                <div key={report.id} className="report-item">
                  <div className={`status-dot ${report.status}`}></div>
                  <div className="report-details">
                    <p className="report-msg">{report.issue_description}</p>
                    <span className="report-meta">
                      <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {report.status === 'resolved' && <CheckCircle2 size={16} className="resolved-icon" />}
                </div>
              ))
            ) : (
              <div className="empty-state">No reports recorded.</div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="dashboard-panel card secondary">
          <div className="panel-header">
            <h3>Quick Management</h3>
          </div>
          <div className="quick-actions">
            <Link to="/admin/hostels" className="action-btn">
              <PlusSquare /> Add New Hostel Listing
            </Link>
            <Link to="/admin/announcements" className="action-btn">
              <Send /> Post Campus Announcement
            </Link>
            <Link to="/admin/questions" className="action-btn">
              <Upload /> Upload Past Question
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-view { display: flex; flex-direction: column; gap: 2.5rem; }
        .welcome-section h1 { font-size: 2rem; font-weight: 800; color: var(--text); margin-bottom: 0.5rem; }
        .welcome-section p { color: var(--text-muted); }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
        .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; position: relative; transition: all 0.3s; text-decoration: none; border: 1px solid var(--border); }
        .stat-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: var(--shadow-lg); }
        
        .stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
        .stat-icon svg { width: 28px; height: 28px; }
        
        .blue .stat-icon { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .green .stat-icon { background: linear-gradient(135deg, #10b981, #059669); }
        .purple .stat-icon { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
        .orange .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
        
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 600; }
        .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text); }
        .stat-trend { position: absolute; top: 1.25rem; right: 1.5rem; font-size: 0.75rem; color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px; }

        .dashboard-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
        .dashboard-panel { padding: 1.5rem; min-height: 400px; display: flex; flex-direction: column; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .panel-header h3 { font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; }
        .view-all { font-size: 0.875rem; color: var(--primary); font-weight: 600; text-decoration: none; display: flex; align-items: center; }

        .report-item { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; border-radius: 12px; background: #f8fafc; margin-bottom: 1rem; position: relative; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; }
        .status-dot.pending { background: var(--warning); box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1); }
        .status-dot.resolved { background: var(--success); }
        .report-msg { font-size: 0.9375rem; font-weight: 500; margin-bottom: 0.25rem; line-height: 1.5; }
        .report-meta { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .resolved-icon { color: var(--success); position: absolute; right: 1.25rem; top: 1.25rem; }

        .quick-actions { display: flex; flex-direction: column; gap: 1rem; }
        .action-btn { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: var(--text); font-weight: 600; transition: all 0.2s; }
        .action-btn:hover { background: #eff6ff; border-color: var(--primary); color: var(--primary); }

        .dashboard-loading { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

// Internal icons for quick actions
const PlusSquare = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8M8 12h8"/></svg>;
const Send = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
const Upload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;

export default Dashboard;
