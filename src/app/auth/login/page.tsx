'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, 
  Loader2, ArrowRight, ShieldCheck, Info 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, user: currentUser } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('campuslink_remembered_email');
      if (savedEmail) setEmailOrId(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (!emailOrId || !password) throw new Error('Please fill in your Email or Student ID and Password.');
      let finalEmail = emailOrId.trim();
      if (!finalEmail.includes('@')) {
        const { data: userProfile, error: lookupErr } = await supabase
          .from('users').select('email').eq('student_id', finalEmail).single();
        if (lookupErr || !userProfile?.email) throw new Error('No user profile found matching this Student ID.');
        finalEmail = userProfile.email;
      }
      const result = await login(finalEmail, password);
      if (result?.user) {
        if (typeof window !== 'undefined') localStorage.setItem('campuslink_remembered_email', emailOrId);
        const { data: profile, error: profileErr } = await supabase
          .from('users').select('role, status').eq('id', result.user.id).single();
        if (profileErr || !profile) { await logout(); throw new Error('Failed to retrieve profile.'); }
        document.cookie = `user-role=${profile.role}; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `user-status=${profile.status}; path=/; max-age=86400; SameSite=Lax;`;
        if (profile.status === 'BLOCKED') { router.push('/blocked'); return; }
        if (profile.role === 'admin') router.push('/admin/dashboard');
        else router.push('/student/dashboard');
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
      if (!fullName || !studentId || !email || !phoneNumber || !gender || !department || !program || !password || !confirmPassword)
        throw new Error('Please fill out all registration fields.');
      if (password !== confirmPassword) throw new Error('Passwords do not match.');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, student_id: studentId, gender, phone_number: phoneNumber, department, program, role: 'student' } }
      });
      if (signUpError) throw signUpError;
      if (data?.user) {
        setSuccessMsg('Account created successfully! You can now sign in.');
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Soft Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-amber-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="premium-card w-full max-w-5xl p-0 overflow-hidden flex flex-col lg:flex-row relative z-10"
      >
        {/* Left Panel: Institutional Messaging */}
        <div 
          className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-[#0F172A] w-1/2"
        >
          <div className="absolute inset-0 opacity-20 bg-[url('/assets/gctu-campus-2.jpg')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/80 to-[#0F172A]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-16">
              <div className="w-12 h-12 rounded-xl bg-white p-1">
                <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-widest text-white uppercase font-['Outfit']">GCTU</h1>
                <p className="text-[10px] text-[#D4A017] font-bold tracking-widest uppercase">CampusLink Portal</p>
              </div>
            </div>

            <div className="space-y-4 my-auto">
              <h2 className="text-4xl font-bold tracking-tight text-white leading-tight font-['Outfit']">
                Official Hostel <br />
                Allocation Portal
              </h2>
              <p className="text-[#94A3B8] leading-relaxed max-w-sm font-medium">
                Providing modern infrastructure and secure real-time room booking facilities for all certified students of GCTU.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex justify-between items-center text-xs text-[#64748B] border-t border-[#1E293B] pt-6 mt-16 font-medium">
            <span>© {new Date().getFullYear()} GCTU CampusLink</span>
            <span className="flex items-center gap-1.5 text-[#059669]">
              <ShieldCheck size={14} /> Secure Authentication
            </span>
          </div>
        </div>

        {/* Right Panel: Auth form */}
        <div className="flex flex-col justify-center p-8 lg:p-12 w-full lg:w-1/2 bg-white">
          <div className="w-full max-w-sm mx-auto">
            {/* Header branding for mobile */}
            <div className="text-center mb-8 lg:hidden">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E2E8F0] mx-auto mb-4 bg-white p-1">
                <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-contain" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2 font-['Outfit']">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            <p className="text-sm text-[#64748B] font-medium mb-8">
              Access the GCTU Student Housing System
            </p>

            {/* Error/Success Messages */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div className="bg-[#FEE2E2] text-[#DC2626] px-4 py-3 rounded-lg flex gap-3 text-sm font-medium mb-6" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Info size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div className="bg-[#D1FAE5] text-[#059669] px-4 py-3 rounded-lg flex gap-3 text-sm font-medium mb-6" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            {!isSignUp ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="form-group">
                  <label className="form-label">Email or Student ID</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type="text" placeholder="student@gctu.edu.gh" value={emailOrId} onChange={(e) => setEmailOrId(e.target.value)} className="form-input pl-12" required />
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="form-label mb-0">Password</label>
                    <button type="button" className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]" onClick={() => alert("Contact GCTU Housing Administration for credential assistance.")}>Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input pl-12 pr-12" required />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary w-full mt-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Portal Access</span><ArrowRight size={18} /></>}
                </button>

                <div className="text-center mt-6">
                  <button type="button" onClick={() => setIsSignUp(true)} className="text-sm font-medium text-[#475569] hover:text-[#0F172A]">
                    Don&apos;t have an account? <span className="text-[#2563EB] font-semibold">Register Portal Access</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-input pl-12" required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type="text" placeholder="GCTU-022201" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="form-input pl-12" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type="email" placeholder="student@gctu.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input pl-12" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type="tel" placeholder="+233 24 000 0000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="form-input pl-12" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="form-input bg-white" required>
                    <option value="" disabled>Select Gender</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="form-input bg-white" required>
                    <option value="" disabled>Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select value={program} onChange={(e) => setProgram(e.target.value)} className="form-input bg-white" required>
                    <option value="" disabled>Select Program</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input pl-12" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input pl-12" required />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary w-full mt-4"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Create Student Account</span><ArrowRight size={18} /></>}
                </button>

                <div className="text-center mt-6">
                  <button type="button" onClick={() => setIsSignUp(false)} className="text-sm font-medium text-[#475569] hover:text-[#0F172A]">
                    Already have an account? <span className="text-[#2563EB] font-semibold">Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
