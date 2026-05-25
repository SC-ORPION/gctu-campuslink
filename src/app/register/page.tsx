'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Mail, Lock, User, Phone, 
  Loader2, ArrowRight, ShieldCheck, Info 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function RegisterPage() {
  const router = useRouter();

  // State managers
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        setTimeout(() => {
          router.push('/login');
        }, 1500);
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
      <main className="main-viewport container">
        <div className="centered-card-wrapper">
          <motion.div 
            className="auth-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="card-header text-center">
              <div className="brand-logo justify-center mb-4">
                <GraduationCap size={28} className="text-primary-blue" />
                <span>CampusLink</span>
              </div>
              <h2>Create Student Account</h2>
              <p className="card-subtitle">Register to reserve hostels and view allocations</p>
            </div>

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

            <form onSubmit={handleRegister} className="form-content scrollable-card-form">
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
                <button type="button" onClick={() => router.push('/login')} className="toggle-auth-link">
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>

      <style jsx>{`
        .landing-layout {
          min-height: 100vh;
          background-color: var(--background, #f8fafc);
          color: var(--text, #0f172a);
          display: flex;
          flex-direction: column;
          font-family: 'Outfit', sans-serif;
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
          background-color: var(--surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text, #0f172a);
        }
        .text-primary-blue {
          color: var(--primary, #1d4ed8);
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
          color: var(--text, #0f172a);
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }
        .card-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted, #64748b);
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
          color: var(--text, #0f172a);
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
          color: var(--text-muted, #64748b);
        }
        .input-field input {
          width: 100%;
          background-color: var(--background, #f8fafc);
          border: 1.5px solid var(--border, #e2e8f0);
          border-radius: 10px;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text, #0f172a);
          outline: none;
          transition: all 0.2s;
        }
        .input-field input:focus {
          border-color: var(--primary, #1d4ed8);
          background-color: white;
        }
        .custom-dropdown {
          width: 100%;
          background-color: var(--background, #f8fafc);
          border: 1.5px solid var(--border, #e2e8f0);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text, #0f172a);
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-dropdown:focus {
          border-color: var(--primary, #1d4ed8);
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
          background-color: var(--primary, #1d4ed8);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
        }
        .primary-theme:hover {
          background-color: var(--primary-hover, #1e40af);
          transform: translateY(-1px);
        }
        .scrollable-card-form {
          max-height: 55vh;
          overflow-y: auto;
          padding-right: 0.25rem;
        }
        .scrollable-card-form::-webkit-scrollbar {
          width: 6px;
        }
        .scrollable-card-form::-webkit-scrollbar-thumb {
          background-color: var(--border, #e2e8f0);
          border-radius: 10px;
        }
        .toggle-auth-link {
          background: none;
          border: none;
          color: var(--primary, #1d4ed8);
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
        }
        .toggle-auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
