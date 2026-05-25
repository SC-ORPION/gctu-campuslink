'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, GraduationCap, Phone, Info, Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [academics, setAcademics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAcademics();
    }
  }, [user]);

  const fetchAcademics = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('student_academics')
        .select('*, faculties(name), departments(name), programs(name)')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setAcademics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container max-w-4xl">
        <button onClick={() => router.push('/student/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm mb-6">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Identity details */}
          <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 bg-primary/15 text-primary text-2xl font-black rounded-3xl flex items-center justify-center">
                {user?.full_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{user?.full_name}</h1>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Student Member
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm font-semibold">
              <div className="flex items-center gap-3">
                <Mail className="text-slate-400" size={18} />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</div>
                  <div className="text-slate-800 font-bold">{user?.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="text-slate-400" size={18} />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student ID</div>
                  <div className="text-slate-800 font-bold">{user?.student_id || 'Not Assigned'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="text-slate-400" size={18} />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gender Preference</div>
                  <div className="text-slate-800 font-bold capitalize">{user?.gender?.toLowerCase() || 'Unspecified'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic link page */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                <GraduationCap size={22} /> Academic Roster
              </h3>

              {academics ? (
                <div className="space-y-4">
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Faculty</div>
                    <div className="text-xs font-black text-slate-200">{academics.faculties.name}</div>
                  </div>
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Department</div>
                    <div className="text-xs font-black text-slate-200">{academics.departments.name}</div>
                  </div>
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Program of Study</div>
                    <div className="text-xs font-black text-slate-200">{academics.programs.name}</div>
                  </div>
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Academic Level</div>
                    <div className="text-xs font-black text-slate-200">Level {academics.level}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-850/50 p-6 rounded-2xl border border-slate-800 text-center text-xs font-semibold text-slate-500">
                  <Info className="mx-auto text-slate-600 mb-2" size={24} />
                  No academic program linked to this student profile yet. Admin will define your faculty upon registration verification.
                </div>
              )}
            </div>

            <div className="mt-8 bg-slate-850 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-bold flex gap-2">
              <ShieldCheck className="text-emerald-500 flex-shrink-0" size={16} />
              <span>GCTU CampusLink enforces secure data validation. To modify academic records, visit registrar offices directly.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
