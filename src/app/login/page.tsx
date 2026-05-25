'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Mail, Lock, User, Phone, Eye, EyeOff, 
  Loader2, ArrowRight, ShieldCheck, Info, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, user: currentUser } = useAuth();

  // URL state checking
  const isAdminParam = searchParams.get('admin') === 'true';

  // State managers
  const [isAdminMode, setIsAdminMode] = useState(isAdminParam);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Options lists
  const GENDER_OPTIONS = ['MALE', 'FEMALE'];
  
  const DEPARTMENTS = [
    'Computer Engineering',
    'Information Technology',
    'Computer Science',
    'Electrical Engineering',
    'Business Administration'
  ];

  const PROGRAMS = [
    'BSc Computer Engineering',
    'BSc Information Technology',
    'BSc Computer Science',
    'BSc Mobile Computing',
    'BSc Software Engineering'
  ];

  // Param sync
  useEffect(() => {
    setIsAdminMode(searchParams.get('admin') === 'true');
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [searchParams]);

  // Already authenticated guard
  useEffect(() => {
    if (currentUser) {
      // Sync cookies
      const role = currentUser.role || 'student';
      const status = currentUser.status || 'ACTIVE';
      document.cookie = `user-role=${role}; path=/; max-age=86400; SameSite=Lax;`;
      document.cookie = `user-status=${status}; path=/; max-age=86400; SameSite=Lax;`;

      if (status === 'BLOCKED') {
        router.push('/blocked');
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [currentUser, router]);

  const toggleMode = (admin: boolean) => {
    setIsAdminMode(admin);
    setIsSignUp(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmailOrId('');
    setPassword('');
    setFullName('');
    setStudentId('');
    setEmail('');
    setPhoneNumber('');
    setGender('');
    setDepartment('');
    setProgram('');
    setConfirmPassword('');
    
    const url = admin ? '/login?admin=true' : '/login';
    window.history.pushState({}, '', url);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!emailOrId || !password) {
        throw new Error('Please fill in your Email or Student ID and Password.');
      }

      let finalEmail = emailOrId.trim();
      if (!finalEmail.includes('@')) {
        const { data: userProfile, error: lookupErr } = await supabase
          .from('users')
          .select('email')
          .eq('student_id', finalEmail)
          .single();

        if (lookupErr || !userProfile?.email) {
          throw new Error('No user profile found matching this Student ID.');
        }
        finalEmail = userProfile.email;
      }

      const result = await login(finalEmail, password);
      if (result?.user) {
        const { data: profile, error: profileErr } = await supabase
          .from('users')
          .select('role, status')
          .eq('id', result.user.id)
          .single();

        if (profileErr || !profile) {
          await logout();
          throw new Error('Failed to retrieve your verified GCTU profile records.');
        }

        // Set cookies so middleware route guards work seamlessly
        document.cookie = `user-role=${profile.role}; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `user-status=${profile.status}; path=/; max-age=86400; SameSite=Lax;`;

        if (profile.status === 'BLOCKED') {
          router.push('/blocked');
          return;
        }

        if (isAdminMode && profile.role !== 'admin') {
          await logout();
          // Clear cookies
          document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'user-status=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          throw new Error('Access Denied: Student accounts cannot access the Admin Portal.');
        }

        if (profile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!fullName || !studentId || !email || !phoneNumber || !gender || !department || !program || !password || !confirmPassword) {
        throw new Error('Please fill out all registration fields.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_id: studentId,
            gender: gender,
            phone_number: phoneNumber,
            department: department,
            program: program,
            role: 'student'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        setSuccessMsg('Account created successfully! You can now log into your Student Cockpit.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        setEmailOrId(email);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-layout">
      {/* Navbar */}
      <header className="top-navbar">
        <div className="container nav-content">
          <div className="brand-logo" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
              <img src="/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-cover" />
            </div>
            <span>CampusLink</span>
          </div>
          <div className="nav-actions">
            <button 
              onClick={() => router.push('/')} 
              className="nav-btn"
            >
              Home
            </button>
          </div>
        </div>
      </header>

      {/* Main card */}
      <main className="main-viewport container">
        <div className="centered-card-wrapper">
          <motion.div 
            className="auth-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header Tabs */}
            <div className="selector-tabs-row mb-6">
              <button 
                onClick={() => toggleMode(false)}
                className={`selector-tab-btn ${!isAdminMode ? 'active' : ''}`}
              >
                Student Portal
              </button>
              <button 
                onClick={() => toggleMode(true)}
                className={`selector-tab-btn ${isAdminMode ? 'active-admin' : ''}`}
              >
                Admin Portal
              </button>
            </div>

            {/* Notification triggers */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div className="card-alert error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Info size={14} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div className="card-alert success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ShieldCheck size={14} className="flex-shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSignUp ? (
              // Login Content
              <form onSubmit={handleLogin} className="form-content">
                <div className="card-header text-center">
                  <h2>{isAdminMode ? 'Admin Portal Access' : 'Student Cockpit Log In'}</h2>
                  <p className="card-subtitle">
                    {isAdminMode ? 'Provide verified staff credentials to sign in.' : 'Log in with your university student credentials.'}
                  </p>
                </div>

                <div className="form-fields space-y-4">
                  <div className="field-group">
                    <label>Email or Student ID</label>
                    <div className="input-field">
                      <Mail size={16} className="field-icon" />
                      <input 
                        type="text" 
                        placeholder={isAdminMode ? 'admin@campuslink.gctu.edu.gh' : 'student@gctu.edu.gh / GCTU-000000'}
                        value={emailOrId}
                        onChange={(e) => setEmailOrId(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="mb-0">Password</label>
                      <button type="button" className="forgot-pwd-btn" onClick={() => alert("Contact academic coordinators to reset credentials.")}>
                        Forgot Password?
                      </button>
                    </div>
                    <div className="input-field">
                      <Lock size={16} className="field-icon" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                      <button type="button" className="pwd-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={`submit-action-btn ${isAdminMode ? 'admin-theme' : 'primary-theme'}`}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {isAdminMode ? 'Sign Into Admin Panel' : 'Sign In'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {!isAdminMode && (
                  <div className="text-center mt-6">
                    <button type="button" onClick={() => setIsSignUp(true)} className="toggle-auth-link">
                      Don't have an account? Register here
                    </button>
                  </div>
                )}
              </form>
            ) : (
              // Signup Content
              <form onSubmit={handleRegister} className="form-content scrollable-card-form">
                <div className="card-header text-center">
                  <h2>Create Student Account</h2>
                  <p className="card-subtitle">Register to reserve hostels and view allocations</p>
                </div>

                <div className="form-fields space-y-4">
                  <div className="field-group">
                    <label>Full Name</label>
                    <div className="input-field">
                      <User size={16} className="field-icon" />
                      <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Student ID Number</label>
                    <div className="input-field">
                      <User size={16} className="field-icon" />
                      <input type="text" placeholder="GCTU-022201" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Email Address</label>
                    <div className="input-field">
                      <Mail size={16} className="field-icon" />
                      <input type="email" placeholder="student@gctu.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Phone Number</label>
                    <div className="input-field">
                      <Phone size={16} className="field-icon" />
                      <input type="tel" placeholder="+233 24 000 0000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} required className="custom-dropdown">
                      <option value="" disabled>Select Gender</option>
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} required className="custom-dropdown">
                      <option value="" disabled>Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Academic Program</label>
                    <select value={program} onChange={(e) => setProgram(e.target.value)} required className="custom-dropdown">
                      <option value="" disabled>Select Program</option>
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Password</label>
                    <div className="input-field">
                      <Lock size={16} className="field-icon" />
                      <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Confirm Password</label>
                    <div className="input-field">
                      <Lock size={16} className="field-icon" />
                      <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="submit-action-btn primary-theme">
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Create Student Account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="text-center mt-6">
                  <button type="button" onClick={() => setIsSignUp(false)} className="toggle-auth-link">
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer-layout">
        <div className="container text-center">
          <div className="footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>About</a>
            <span className="dot">•</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Support</a>
            <span className="dot">•</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
            <span className="dot">•</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-layout {
          min-height: 100vh;
          background-color: var(--background);
          color: var(--text);
          display: flex;
          flex-direction: column;
          font-family: 'Outfit', sans-serif;
        }
        .top-navbar {
          background-color: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 1.25rem 0;
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text);
          cursor: pointer;
        }
        .text-primary-blue {
          color: var(--primary);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .nav-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-btn:hover {
          color: var(--primary);
        }
        .main-viewport {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 3rem 1rem;
        }
        .centered-card-wrapper {
          width: 100%;
          max-width: 480px;
        }
        .auth-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: var(--shadow-md);
        }
        .selector-tabs-row {
          display: grid;
          grid-template-cols: 1fr 1fr;
          background-color: var(--background);
          border: 1px solid var(--border);
          padding: 0.25rem;
          border-radius: 10px;
        }
        .selector-tab-btn {
          background: none;
          border: none;
          padding: 0.625rem;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .selector-tab-btn.active {
          background-color: var(--primary);
          color: white;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
        }
        .selector-tab-btn.active-admin {
          background-color: #ea580c;
          color: white;
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.15);
        }
        .card-alert {
          padding: 0.875rem 1.25rem;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .card-alert.error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }
        .card-alert.success {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }
        .card-header h2 {
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }
        .card-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 2rem;
          font-weight: 500;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .field-group label {
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .input-field {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }
        .input-field input {
          width: 100%;
          background-color: var(--background);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
          outline: none;
          transition: all 0.2s;
        }
        .input-field input:focus {
          border-color: var(--primary);
          background-color: white;
        }
        .pwd-toggle-btn, .forgot-pwd-btn {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .forgot-pwd-btn {
          position: static;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
        }
        .forgot-pwd-btn:hover {
          text-decoration: underline;
        }
        .custom-dropdown {
          width: 100%;
          background-color: var(--background);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-dropdown:focus {
          border-color: var(--primary);
          background-color: white;
        }
        .submit-action-btn {
          width: 100%;
          border: none;
          padding: 0.95rem;
          border-radius: 10px;
          color: white;
          font-weight: 800;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
          transition: all 0.2s;
        }
        .primary-theme {
          background-color: var(--primary);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
        }
        .primary-theme:hover {
          background-color: var(--primary-hover);
          transform: translateY(-1px);
        }
        .admin-theme {
          background-color: #ea580c;
          box-shadow: 0 4px 10px rgba(234, 88, 12, 0.15);
        }
        .admin-theme:hover {
          background-color: #c2410c;
          transform: translateY(-1px);
        }
        .scrollable-card-form {
          max-height: 50vh;
          overflow-y: auto;
          padding-right: 0.25rem;
        }
        .scrollable-card-form::-webkit-scrollbar {
          width: 6px;
        }
        .scrollable-card-form::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 10px;
        }
        .toggle-auth-link {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
        }
        .toggle-auth-link:hover {
          text-decoration: underline;
        }
        .footer-layout {
          background-color: var(--surface);
          border-top: 1px solid var(--border);
          padding: 2rem 0;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
        }
        .footer-links a {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: var(--text);
        }
        .dot {
          color: var(--border);
          font-size: 0.75rem;
        }
        @media (max-width: 640px) {
          .auth-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
