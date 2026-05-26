'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.message) return;
    
    setStatus('loading');
    
    // Simulate premium API call with dynamic loader
    setTimeout(() => {
      setStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
    }, 1500);
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 animate-fade-in">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={36} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent Successfully!</h3>
        <p className="text-slate-600 max-w-sm mb-8">
          Thank you for reaching out. A support coordinator will contact you shortly via email.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
          <input 
            type="text" 
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            placeholder="John" 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
          <input 
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            placeholder="Doe" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID / Email Address</label>
        <input 
          type="email" 
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
          placeholder="student@gctu.edu.gh" 
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
        <textarea 
          rows="4" 
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none" 
          placeholder="How can we help you?"
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full sm:w-auto shadow-sm"
      >
        {status === 'loading' ? (
          <>
            <span>Sending...</span>
            <Loader2 className="animate-spin" size={18} />
          </>
        ) : (
          <>
            <span>Send Message</span>
            <Send size={18} />
          </>
        )}
      </button>
    </form>
  );
}
