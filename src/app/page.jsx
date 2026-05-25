'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Mail, Lock, User, Phone, Eye, EyeOff, 
  Loader2, ArrowRight, ShieldCheck, Info, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Home() {
  const router = useRouter();
  const { login, logout, user: currentUser } = useAuth();

  // State managers
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

  // Dropdown options
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

  // If already logged in, redirect automatically
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [currentUser, router]);

  const handleToggleState = (register) => {
    setIsRegisterMode(register);
    setIsAdminMode(false);
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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!emailOrId || !password) {
        throw new Error('Please enter both your Email/Student ID and Password.');
      }

      // Check if they entered a Student ID instead of an email
      let finalEmail = emailOrId.trim();
      if (!finalEmail.includes('@')) {
        // Look up email by student_id in public users table
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
        // Fetch profile
        const { data: profile, error: profileErr } = await supabase
          .from('users')
          .select('role, status')
          .eq('id', result.user.id)
          .single();

        if (profileErr || !profile) {
          await logout();
          throw new Error('Failed to retrieve your verified GCTU profile records.');
        }

        // Status block guard
        if (profile.status === 'BLOCKED') {
          await logout();
          throw new Error('Access Denied: This account has been permanently blocked by the system.');
        }

        // Admin mode guard
        if (isAdminMode && profile.role !== 'admin') {
          await logout();
          throw new Error('Access Denied: Student accounts cannot access the Admin Portal.');
        }

        // Success redirection
        if (profile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
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
        setIsRegisterMode(false);
        setPassword('');
        setConfirmPassword('');
        setEmailOrId(email);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Registration failed. Please check your form details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-layout">
      {/* 1. TOP NAVBAR */}
      <header className="top-navbar">
        <div className="container nav-content">
          <div className="brand-logo" onClick={() => handleToggleState(false)}>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
              <img src="/src/assets/gctu-logo.jpg" alt="GCTU" className="w-full h-full object-cover" />
            </div>
            <span>CampusLink</span>
          </div>
          <div className="nav-actions">
            <button 
              onClick={() => handleToggleState(false)} 
              className={`nav-btn ${!isRegisterMode && !isAdminMode ? 'active' : ''}`}
            >
              Login
            </button>
            <button 
              onClick={() => handleToggleState(true)} 
              className={`nav-btn-bordered ${isRegisterMode ? 'active-bordered' : ''}`}
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER AREA */}
      <main className="main-viewport container">
        <div className="centered-card-wrapper">
          <motion.div 
            className="auth-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Card Alerts */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  className="card-alert error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Info size={14} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div 
                  className="card-alert success"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ShieldCheck size={14} className="flex-shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {!isRegisterMode ? (
              // ==========================================
              // LOGIN STATE CARD
              // ==========================================
              <form onSubmit={handleLogin} className="form-content">
                <div className="card-header text-center">
                  <h2>
                    {isAdminMode ? 'Admin Portal Access' : 'Welcome to CampusLink'}
                  </h2>
                  <p className="card-subtitle">
                    {isAdminMode ? 'Provide verified staff credentials to sign in.' : 'Hostel Allocation System'}
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
                      <button 
                        type="button" 
                        className="forgot-pwd-btn"
                        onClick={() => alert("Please contact GCTU academic coordinators to reset your institutional login credentials.")}
                      >
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
                      <button 
                        type="button" 
                        className="pwd-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`submit-action-btn ${isAdminMode ? 'admin-theme' : 'primary-theme'}`}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {isAdminMode ? 'Sign Into Admin Panel' : 'Sign In'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // ==========================================
              // REGISTRATION STATE CARD
              // ==========================================
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
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Student ID Number</label>
                    <div className="input-field">
                      <User size={16} className="field-icon" />
                      <input 
                        type="text" 
                        placeholder="GCTU-022201" 
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Email Address</label>
                    <div className="input-field">
                      <Mail size={16} className="field-icon" />
                      <input 
                        type="email" 
                        placeholder="student@gctu.edu.gh" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Phone Number</label>
                    <div className="input-field">
                      <Phone size={16} className="field-icon" />
                      <input 
                        type="tel" 
                        placeholder="+233 24 000 0000" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  {/* Dropdowns */}
                  <div className="field-group">
                    <label>Gender</label>
                    <select 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)} 
                      required
                      className="custom-dropdown"
                    >
                      <option value="" disabled>Select Gender</option>
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Department</label>
                    <select 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                      required
                      className="custom-dropdown"
                    >
                      <option value="" disabled>Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Academic Program</label>
                    <select 
                      value={program} 
                      onChange={(e) => setProgram(e.target.value)} 
                      required
                      className="custom-dropdown"
                    >
                      <option value="" disabled>Select Program</option>
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Password</label>
                    <div className="input-field">
                      <Lock size={16} className="field-icon" />
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Confirm Password</label>
                    <div className="input-field">
                      <Lock size={16} className="field-icon" />
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                      />
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
              </form>
            )}
          </motion.div>

          {/* 3. SECONDARY INFO PANEL */}
          <div className="secondary-info-bullets">
            <div className="bullet-item">
              <CheckCircle2 size={16} className="text-primary-blue" />
              <span>Apply for hostel in minutes</span>
            </div>
            <div className="bullet-item">
              <CheckCircle2 size={16} className="text-primary-blue" />
              <span>Secure allocation system</span>
            </div>
            <div className="bullet-item">
              <CheckCircle2 size={16} className="text-primary-blue" />
              <span>Real-time room updates</span>
            </div>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
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
          
          <div className="admin-low-visibility-gate mt-4">
            <button 
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setIsRegisterMode(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="admin-gate-btn"
            >
              {isAdminMode ? 'Back to Student Login' : 'Admin Access'}
            </button>
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
          position: sticky;
          top: 0;
          z-index: 100;
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

        .nav-btn.active, .nav-btn:hover {
          color: var(--primary);
        }

        .nav-btn-bordered {
          background: none;
          border: 1.5px solid var(--primary);
          color: var(--primary);
          font-weight: 700;
          font-size: 0.875rem;
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn-bordered:hover, .nav-btn-bordered.active-bordered {
          background-color: var(--primary);
          color: white;
        }

        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 1rem;
        }

        .centered-card-wrapper {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .auth-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: var(--shadow-md);
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
          max-height: 60vh;
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

        .secondary-info-bullets {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .bullet-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text-muted);
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

        .admin-gate-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.725rem;
          font-weight: 600;
          cursor: pointer;
          opacity: 0.65;
          transition: all 0.2s;
        }

        .admin-gate-btn:hover {
          opacity: 1;
          color: var(--primary);
        }

        @media (max-width: 640px) {
          .secondary-info-bullets {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .auth-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
