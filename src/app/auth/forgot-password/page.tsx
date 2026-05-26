'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="bg-[#06182e]/40 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-[#0a2240]/60 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#1e5faf]/15">
        {status === 'success' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Check Your Email</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              We have sent a password reset link to <span className="font-semibold text-white">{email}</span> if it is registered in our system.
            </p>
            <a 
              href="/auth/login" 
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all w-full shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            >
              Back to Login
            </a>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Forgot Password?</h2>
              <p className="text-slate-300">
                Enter your university email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-200 mb-2">Student Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gctu.edu.gh"
                    className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl pl-10 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                {status === 'loading' ? (
                  <>
                    <span>Sending Link...</span>
                    <Loader2 className="animate-spin" size={18} />
                  </>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>

              <div className="text-center mt-6">
                <a 
                  href="/auth/login" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Login</span>
                </a>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
