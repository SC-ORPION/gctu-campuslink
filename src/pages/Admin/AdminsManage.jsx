import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, UserPlus, Trash2, ShieldCheck, Mail, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const AdminsManage = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error("Fetch admins error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (adminId, currentRole) => {
    const newRole = currentRole === 'super_admin' ? 'admin' : 'super_admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', adminId);
      
      if (error) throw error;
      setAdmins(admins.map(a => a.id === adminId ? { ...a, role: newRole } : a));
    } catch (err) {
      alert("Role update failed: " + err.message);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="error-view">
        <Shield size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to manage administrators.</p>
      </div>
    );
  }

  return (
    <div className="manage-view animate-fade-in">
      <div className="view-header">
        <div className="header-text">
          <h1>Administrators</h1>
          <p>Manage platform access and permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert("To add a new admin, create them in the Supabase Auth Dashboard first.")}>
          <UserPlus size={20} /> Provision New Admin
        </button>
      </div>

      <div className="admins-list">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Fetching admin registry...</p>
          </div>
        ) : (
          <div className="admins-grid">
            {admins.map((admin) => (
              <div key={admin.id} className="admin-card glass-card">
                <div className="admin-header">
                  <div className={`role-badge ${admin.role}`}>
                    {admin.role === 'super_admin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                    {admin.role.replace('_', ' ')}
                  </div>
                </div>
                <div className="admin-body">
                  <div className="admin-avatar">
                    {admin.email[0].toUpperCase()}
                  </div>
                  <h3>{admin.email.split('@')[0]}</h3>
                  <div className="admin-meta">
                    <Mail size={14} /> {admin.email}
                  </div>
                  <div className="admin-meta">
                    <Calendar size={14} /> Joined {new Date(admin.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="admin-footer">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleRole(admin.id, admin.role)}
                    disabled={admin.id === user.id}
                  >
                    Change Role
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .admins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .admin-card { padding: 1.5rem; text-align: center; }
        .admin-header { display: flex; justify-content: center; margin-bottom: 1rem; }
        .role-badge { 
          padding: 4px 12px; 
          border-radius: 100px; 
          font-size: 0.75rem; 
          font-weight: 700; 
          text-transform: uppercase; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
        }
        .role-badge.super_admin { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .role-badge.admin { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
        
        .admin-avatar {
          width: 64px;
          height: 64px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 auto 1rem;
        }
        
        .admin-body h3 { margin-bottom: 0.5rem; font-size: 1.125rem; }
        .admin-meta { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem; }
        
        .admin-footer { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
        .btn-sm { padding: 0.5rem 1rem; font-size: 0.8125rem; }

        .error-view { text-align: center; padding: 4rem; color: var(--text-muted); }
        .error-view h2 { color: var(--text); margin: 1rem 0 0.5rem; }
      `}</style>
    </div>
  );
};

export default AdminsManage;
