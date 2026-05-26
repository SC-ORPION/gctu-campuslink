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

  const inputClass = "w-full h-12 bg-white border border-slate-300 rounded-xl pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-slate-400";
  const selectClass = "w-full h-12 bg-white border border-slate-300 rounded-xl px-4 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium appearance-none";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Centered Dual-Panel Auth Shell */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden min-h-[600px]"
      >
        {/* Left Panel: Institutional Messaging */}
        <div 
          className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-slate-900"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('/images/gctu-campus.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Top section: Crest & University Name */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-white p-1">
              <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wider text-white uppercase">GCTU</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">CampusLink Portal</p>
            </div>
          </div>

          {/* Middle section: Promising message */}
          <div className="space-y-4 my-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Official Hostel <br />
              Allocation Portal
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Providing modern infrastructure and secure real-time room booking facilities for all certified students of GCTU.
            </p>
          </div>

          {/* Bottom section: Footer info */}
          <div className="flex justify-between items-center text-xs text-slate-400 border-t border-white/10 pt-6">
            <span>© 2026 GCTU CampusLink</span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-400" /> Secure Encryption
            </span>
          </div>
        </div>

        {/* Right Panel: Auth form in a constrained card structure */}
        <div className="flex flex-col justify-center p-8 lg:p-12 bg-white">
          <div className="w-full max-w-md mx-auto">
            {/* Header branding */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 mx-auto mb-4 lg:hidden">
                <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">GCTU Student Housing System</p>
            </div>

            {/* Error/Success Messages */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl flex gap-3 text-xs font-medium mb-5" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-xl flex gap-3 text-xs font-medium mb-5" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Standardized Form System */}
            {!isSignUp ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className={labelClass}>Email or Student ID</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="student@gctu.edu.gh" value={emailOrId} onChange={(e) => setEmailOrId(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                    <button type="button" className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors" onClick={() => alert("Contact GCTU Housing Administration for credential assistance.")}>Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-12`} required />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-60 text-sm"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Portal Access</span><ArrowRight size={16} /></>}
                </button>

                <div className="text-center mt-6">
                  <button type="button" onClick={() => setIsSignUp(true)} className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                    Don&apos;t have an account? <span className="underline">Register Portal Access</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Student ID</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="GCTU-022201" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" placeholder="student@gctu.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" placeholder="+233 24 000 0000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass} required>
                    <option value="" disabled>Select Gender</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass} required>
                    <option value="" disabled>Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Program</label>
                  <select value={program} onChange={(e) => setProgram(e.target.value)} className={selectClass} required>
                    <option value="" disabled>Select Program</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} required />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-60 text-sm"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create Student Account</span><ArrowRight size={16} /></>}
                </button>

                <div className="text-center mt-5">
                  <button type="button" onClick={() => setIsSignUp(false)} className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                    Already have an account? <span className="underline">Sign In</span>
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
