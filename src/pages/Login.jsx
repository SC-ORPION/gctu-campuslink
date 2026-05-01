import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page animate-fade-in">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="logo">
            <GraduationCap size={40} />
          </div>
          <h1>Admin Portal</h1>
          <p>Sign in to manage CampusLink resources</p>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              required
              placeholder="admin@gctu.edu.gh" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? Contact the Super Admin.</p>
        </div>
      </div>

      <style>{`
        .login-page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #f1f5f9 0%, #e2e8f0 100%);
          padding: 1.5rem;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem;
          background: white;
        }
        .login-header { text-align: center; margin-bottom: 2.5rem; }
        .logo { 
          width: 64px; 
          height: 64px; 
          background: #eff6ff; 
          color: var(--primary); 
          border-radius: 16px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin: 0 auto 1.5rem; 
        }
        h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
        p { color: var(--text-muted); font-size: 0.9375rem; }

        .error-alert {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }

        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.875rem; color: var(--text); }
        input {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: #f8fafc;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }
        input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1); }

        .login-footer { margin-top: 2.5rem; text-align: center; border-top: 1px solid var(--border); padding-top: 1.5rem; }
        .login-footer p { font-size: 0.8125rem; }
      `}</style>
    </div>
  );
};

export default Login;
