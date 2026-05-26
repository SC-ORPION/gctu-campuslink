'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Phone, 
  Loader2, ArrowRight, ShieldCheck, Info 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      if (!fullName || !studentId || !email || !phoneNumber || !gender || !department || !program || !password || !confirmPassword)
        throw new Error('Please fill out all registration fields.');
      if (password !== confirmPassword) throw new Error('Passwords do not match.');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, student_id: studentId, gender, phone_number: phoneNumber, department, program, role: 'student' } }
      });
      if (signUpError) throw signUpError;
      if (data?.user) {
        setSuccessMsg('Account created! Redirecting to sign in...');
        setTimeout(() => { router.push('/auth/login'); }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#06182e]/80 border border-[#1e5faf]/20 rounded-xl py-3 pl-11 pr-4 text-[13px] text-white focus:outline-none focus:border-[#d4af37] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] transition-all font-medium placeholder:text-slate-600";
  const selectClass = "w-full bg-[#06182e]/80 border border-[#1e5faf]/20 rounded-xl py-3 px-4 text-[13px] text-white focus:outline-none focus:border-[#d4af37] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] transition-all font-medium appearance-none";
  const labelClass = "block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-[0.06em]";

  return (
    <div className="landing-layout min-h-screen flex items-center justify-center py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(42,117,209,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(42,117,209,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-[#0a2240]/70 backdrop-blur-xl border border-[#1e5faf]/20 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#d4af37]/30 mx-auto mb-4 shadow-lg">
            <img src="/assets/gctu-logo.jpg" alt="GCTU Crest" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight mb-1">Create Student Account</h2>
          <p className="text-[11px] text-slate-400 font-medium">GCTU Accommodation Platform</p>
        </div>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div className="bg-rose-500/8 border border-rose-500/15 text-rose-400 p-3 rounded-xl flex gap-3 text-[12px] font-semibold mb-4" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Info size={16} className="flex-shrink-0 mt-0.5" /><span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div className="bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 p-3 rounded-xl flex gap-3 text-[12px] font-semibold mb-4" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" /><span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleRegister} className="space-y-3.5 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
          <div><label className={labelClass}>Full Name</label><div className="relative"><User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required /></div></div>
          <div><label className={labelClass}>Student ID</label><div className="relative"><User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="text" placeholder="GCTU-022201" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputClass} required /></div></div>
          <div><label className={labelClass}>Email</label><div className="relative"><Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="email" placeholder="student@gctu.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required /></div></div>
          <div><label className={labelClass}>Phone</label><div className="relative"><Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="tel" placeholder="+233 24 000 0000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} required /></div></div>
          <div><label className={labelClass}>Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass} required><option value="" disabled>Select Gender</option>{GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div><label className={labelClass}>Department</label><select value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass} required><option value="" disabled>Select Department</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className={labelClass}>Program</label><select value={program} onChange={(e) => setProgram(e.target.value)} className={selectClass} required><option value="" disabled>Select Program</option>{PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className={labelClass}>Password</label><div className="relative"><Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required /></div></div>
          <div><label className={labelClass}>Confirm Password</label><div className="relative"><Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} required /></div></div>

          <button type="submit" disabled={loading} className="w-full bg-[#d4af37] hover:bg-[#e0bc45] text-[#06182e] font-extrabold py-3.5 rounded-xl shadow-lg shadow-[#d4af37]/15 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 mt-2 hover:-translate-y-0.5 text-[13px] uppercase tracking-wider disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
          </button>

          <div className="text-center mt-5">
            <button type="button" onClick={() => router.push('/auth/login')} className="text-[12px] font-bold text-[#4a9eff] hover:text-white transition-colors">
              Already have an account? <span className="underline">Sign In</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
