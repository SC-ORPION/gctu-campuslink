'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, ShieldCheck, Check, Loader2, Paintbrush, FileText, Image as ImageIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'settlements' | 'customizer'>('settlements');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Settlement settings
  const [bankName, setBankName] = useState('GCB Bank PLC');
  const [accountNumber, setAccountNumber] = useState('GCTU-HOSTELS-0192837');
  const [hostelFee, setHostelFee] = useState('1500');
  const [autoAllocation, setAutoAllocation] = useState(true);

  // Customizer settings (Branding, Text, Colors, Images)
  const [siteName, setSiteName] = useState('CampusLink');
  const [logoColor, setLogoColor] = useState('#4a9eff');
  const [primaryThemeColor, setPrimaryThemeColor] = useState('#d4af37');
  const [heroHeadline, setHeroHeadline] = useState('Your\nCampus,\nYour Future.');
  const [heroSubtitle, setHeroSubtitle] = useState("Ghana Communication Technology University's official hostel allocation system. Real-time availability, secure payments, instant room assignment.");
  const [heroBgImage, setHeroBgImage] = useState('/assets/gctu-gate.jpg');

  // Load customizer settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('campuslink_customizer_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.siteName) setSiteName(parsed.siteName);
        if (parsed.logoColor) setLogoColor(parsed.logoColor);
        if (parsed.primaryThemeColor) setPrimaryThemeColor(parsed.primaryThemeColor);
        if (parsed.heroHeadline) setHeroHeadline(parsed.heroHeadline);
        if (parsed.heroSubtitle) setHeroSubtitle(parsed.heroSubtitle);
        if (parsed.heroBgImage) setHeroBgImage(parsed.heroBgImage);
      } catch (e) {
        console.error('Failed to parse site settings', e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Save customizer settings
    const settingsObject = {
      siteName,
      logoColor,
      primaryThemeColor,
      heroHeadline,
      heroSubtitle,
      heroBgImage,
    };
    localStorage.setItem('campuslink_customizer_settings', JSON.stringify(settingsObject));

    // Simulate saving settings parameters to server
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">System Settings</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Configure GCTU settlement details, allocation engines, and landing page branding.</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'settlements'
              ? 'bg-[#1e5faf] text-white'
              : 'bg-[#0a2240]/40 text-slate-400 hover:text-white'
          }`}
        >
          System & Settlement
        </button>
        <button
          onClick={() => setActiveTab('customizer')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'customizer'
              ? 'bg-[#1e5faf] text-white'
              : 'bg-[#0a2240]/40 text-slate-400 hover:text-white'
          }`}
        >
          Branding & Customizer
        </button>
      </div>

      <div className="bg-[#0a2240]/60 backdrop-blur-sm p-8 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <form onSubmit={handleSave} className="space-y-6">
          
          {activeTab === 'settlements' && (
            <>
              {/* Section 1: Financial Setup */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1e5faf]/15 pb-2">
                  <Landmark className="text-[#4a9eff]" size={16} />
                  <span>Financial Settlement Channels</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-200">GCTU Official GCB Bank Account Name</label>
                    <input 
                      type="text" 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1e5faf] focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-200">GCB Account Number</label>
                    <input 
                      type="text" 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1e5faf] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 max-w-xs">
                  <label className="text-xs font-bold text-slate-200">Global Hostel Fee (GH₵)</label>
                  <input 
                    type="number" 
                    value={hostelFee}
                    onChange={(e) => setHostelFee(e.target.value)}
                    className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1e5faf] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Section 2: Engine Configuration */}
              <div className="space-y-4 pt-6 border-t border-[#1e5faf]/15">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1e5faf]/15 pb-2">
                  <ShieldCheck className="text-[#4a9eff]" size={16} />
                  <span>Allocation Engine Controls</span>
                </h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoAllocation}
                    onChange={(e) => setAutoAllocation(e.target.checked)}
                    className="w-4 h-4 text-[#1e5faf] bg-[#0f3058]/30 border-slate-300 rounded focus:ring-[#1e5faf] mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Enable Automated Room Assigning Engine</span>
                    <span className="text-[10px] text-slate-400 font-semibold leading-normal">
                      When enabled, verified payment actions instantly fire transaction-safe allocation script queries to allot bed spaces.
                    </span>
                  </div>
                </label>
              </div>
            </>
          )}

          {activeTab === 'customizer' && (
            <>
              {/* Branding Customizer Form */}
              <div className="space-y-6">
                
                {/* Logo & Identity */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1e5faf]/15 pb-2">
                    <Paintbrush className="text-[#4a9eff]" size={16} />
                    <span>Brand Colors & Logo Identity</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">Site Branding Name</label>
                      <input 
                        type="text" 
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1e5faf] focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">Logo Icon Color</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={logoColor}
                          onChange={(e) => setLogoColor(e.target.value)}
                          className="w-10 h-10 border border-white/10 rounded-lg cursor-pointer bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={logoColor}
                          onChange={(e) => setLogoColor(e.target.value)}
                          className="bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-2 text-xs text-white w-28 uppercase"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-200">Primary Theme Color</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={primaryThemeColor}
                          onChange={(e) => setPrimaryThemeColor(e.target.value)}
                          className="w-10 h-10 border border-white/10 rounded-lg cursor-pointer bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={primaryThemeColor}
                          onChange={(e) => setPrimaryThemeColor(e.target.value)}
                          className="bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-2 text-xs text-white w-28 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Texts */}
                <div className="space-y-4 pt-6 border-t border-[#1e5faf]/15">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1e5faf]/15 pb-2">
                    <FileText className="text-[#4a9eff]" size={16} />
                    <span>Hero Copy & Headings</span>
                  </h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-200">Hero Main Headline (Use \n for new line)</label>
                    <textarea 
                      rows={3}
                      value={heroHeadline}
                      onChange={(e) => setHeroHeadline(e.target.value)}
                      className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1e5faf] focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-200">Hero Subtitle</label>
                    <textarea 
                      rows={3}
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className="w-full bg-[#06182e]/40 border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1e5faf] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Hero Media */}
                <div className="space-y-4 pt-6 border-t border-[#1e5faf]/15">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1e5faf]/15 pb-2">
                    <ImageIcon className="text-[#4a9eff]" size={16} />
                    <span>Background Image Options</span>
                  </h3>
                  
                  <div className="flex flex-col gap-1.5 max-w-md">
                    <label className="text-xs font-bold text-slate-200">Hero Background Image</label>
                    <select
                      value={heroBgImage}
                      onChange={(e) => setHeroBgImage(e.target.value)}
                      className="w-full bg-[#06182e] border border-[#1e5faf]/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1e5faf] transition-all"
                    >
                      <option value="/assets/gctu-gate.jpg">GCTU Gate Facade (Default)</option>
                      <option value="/assets/gctu-building.jpg">Kofi Annan Modern Hostel block</option>
                      <option value="/assets/gctu-campus-2.jpg">GCTU Concrete Campus quad</option>
                      <option value="/assets/gctu-stairs.jpg">Leta Hands Stairs & Walkway</option>
                      <option value="/assets/gctu-reception.jpg">GCTU Lobby Reception area</option>
                    </select>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* Save Action Bar */}
          <div className="flex items-center gap-3 pt-6 border-t border-[#1e5faf]/15">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#1e5faf] hover:bg-[#1a5299] disabled:bg-[#1e5faf]/50 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <span>Saving Parameters...</span>
                  <Loader2 className="animate-spin" size={14} />
                </>
              ) : success ? (
                <>
                  <span>Parameters Saved</span>
                  <Check size={14} />
                </>
              ) : (
                <span>Save Parameters</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
