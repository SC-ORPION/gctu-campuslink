'use client';

import React, { useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Mail, ExternalLink, ShieldCheck, 
  ArrowRight, Heart, Sparkles, Terminal, Copy, Check, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter 
} from '@/components/ui/Card';

export default function UIShowcasePage() {
  const [activeTab, setActiveTab] = useState<'buttons' | 'cards' | 'tables'>('buttons');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLikeCount, setDemoLikeCount] = useState(148);
  const [isLiked, setIsLiked] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleLike = () => {
    if (isLiked) {
      setDemoLikeCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      setDemoLikeCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  // Mock table data
  const mockStudents = [
    { id: '1', name: 'Emmanuel Boakye', index: '040922401', status: 'VERIFIED', room: 'A1-4' },
    { id: '2', name: 'Grace Mensah', index: '040922415', status: 'PENDING', room: 'Unallocated' },
    { id: '3', name: 'Francis Owusu', index: '040922432', status: 'VERIFIED', room: 'B3-12' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left pb-16">
      
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 rounded-3xl border border-indigo-850 shadow-xl text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Terminal size={140} />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/25 border border-indigo-400/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
            <Sparkles size={11} /> CampusLink UI Kit
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-none text-white">
            Design Tokens & Component System
          </h1>
          <p className="text-sm font-medium text-slate-300 leading-relaxed">
            Beautiful, dynamic, high-trust UI elements forged with Outfit typography, absolute color systems, and rich spring animations. Fully responsive and ready for production.
          </p>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex border-b border-[#1e5faf]/15 dark:border-zinc-900 gap-1 overflow-x-auto pb-px">
        {(['buttons', 'cards', 'tables'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest border-b-2 transition-all duration-200 cursor-pointer select-none ${
              activeTab === tab 
                ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-white dark:hover:text-zinc-350'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. SHOWCASE TABS */}
      
      {/* TAB A: BUTTONS */}
      {activeTab === 'buttons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Main Visual Showcase */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Row 1: Primary, Secondary, Danger Variants */}
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle>Solid Color Core Buttons</CardTitle>
                <CardDescription>Primary, Secondary, and Threat level semantic triggers.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Accent</Button>
                <Button variant="secondary">Secondary Teal</Button>
                <Button variant="danger">Danger Priority</Button>
              </CardContent>
            </Card>

            {/* Row 2: Outline, Ghost, Link Variants */}
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle>Muted Surface Buttons</CardTitle>
                <CardDescription>Low-emphasis actions and navigations for secondary layouts.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 items-center">
                <Button variant="outline">Outline Border</Button>
                <Button variant="ghost">Ghost Plain</Button>
                <Button variant="link" iconRight={<ExternalLink size={12} />}>Standard Link Element</Button>
              </CardContent>
            </Card>

            {/* Row 3: Sizing scales */}
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle>Typography & Dimension Sizing</CardTitle>
                <CardDescription>Adaptive layout sizing scales matching the global workspace density.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" size="sm">Small Action</Button>
                <Button variant="primary" size="md">Medium Base</Button>
                <Button variant="primary" size="lg">Large Premium</Button>
              </CardContent>
            </Card>

            {/* Row 4: Icons, States & Loading Flow */}
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle>Icon Alignment & Active States</CardTitle>
                <CardDescription>State-awareness configurations including loading buffers and custom icons.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" icon={<Plus size={16} />}>Create Allocation</Button>
                  <Button variant="outline" iconRight={<ArrowRight size={16} />}>Next Step</Button>
                  <Button variant="secondary" icon={<Search size={16} />} iconRight={<Plus size={12} />}>Double Icon</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center border-t border-[#1e5faf]/15 dark:border-zinc-900 pt-5">
                  <Button variant="primary" isLoading={loadingDemo} onClick={() => {
                    setLoadingDemo(true);
                    setTimeout(() => setLoadingDemo(false), 2500);
                  }}>
                    {loadingDemo ? 'Processing Allocation' : 'Click to test loading'}
                  </Button>
                  <Button variant="secondary" disabled>Disabled State</Button>
                </div>
              </CardContent>
            </Card>

            {/* Row 5: Full Width Button */}
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle>Full Width Form Action</CardTitle>
                <CardDescription>Spans 100% of parent width, ideal for modals and login widgets.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="primary" fullWidth icon={<Mail size={16} />}>Send Verification Code to Student</Button>
              </CardContent>
            </Card>

          </div>

          {/* Quick Inspector & Snippets Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card hoverEffect={false} className="bg-[#06182e]/40 dark:bg-zinc-950 border border-[#1e5faf]/15 dark:border-zinc-900">
              <CardHeader className="bg-[#0f3058]/30/50 dark:bg-zinc-900/40">
                <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Button Code Snippets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5 text-xs">
                
                {/* primary code */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>PRIMARY BUTTON</span>
                    <button 
                      onClick={() => copyToClipboard(`<Button variant="primary" icon={<Plus size={16} />}>Create Allocation</Button>`, 'primary')}
                      className="hover:text-slate-200 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'primary' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copiedText === 'primary' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#1e5faf]/15 dark:border-zinc-800 font-mono text-[10px] text-slate-650 dark:text-zinc-400 overflow-x-auto">
                    {`<Button 
  variant="primary" 
  icon={<Plus size={16} />}
>
  Create Allocation
</Button>`}
                  </pre>
                </div>

                {/* loading code */}
                <div className="space-y-2 border-t border-[#1e5faf]/15 dark:border-zinc-900 pt-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>LOADING WIDGET</span>
                    <button 
                      onClick={() => copyToClipboard(`<Button variant="primary" isLoading>Processing</Button>`, 'loading')}
                      className="hover:text-slate-200 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'loading' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copiedText === 'loading' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#1e5faf]/15 dark:border-zinc-800 font-mono text-[10px] text-slate-650 dark:text-zinc-400 overflow-x-auto">
                    {`<Button 
  variant="primary" 
  isLoading
>
  Processing
</Button>`}
                  </pre>
                </div>

                {/* outline icon code */}
                <div className="space-y-2 border-t border-[#1e5faf]/15 dark:border-zinc-900 pt-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>OUTLINE GHOST</span>
                    <button 
                      onClick={() => copyToClipboard(`<Button variant="outline" size="sm" animateHover={false}>Static Button</Button>`, 'outline')}
                      className="hover:text-slate-200 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'outline' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copiedText === 'outline' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#1e5faf]/15 dark:border-zinc-800 font-mono text-[10px] text-slate-650 dark:text-zinc-400 overflow-x-auto">
                    {`<Button 
  variant="outline" 
  size="sm"
  animateHover={false}
>
  Static Button
</Button>`}
                  </pre>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB B: CARDS */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Main Visual Showcase */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Standard Layout Card */}
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle>Standard Elevation Card</CardTitle>
                <CardDescription>Standard background structure, with simple structural lines, optimized for static layout setups.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-300 dark:text-zinc-400 leading-relaxed">
                  This card utilizes a solid white background (or deep zinc surface on dark theme), surrounded by a balanced, subtle slate-200 border, and minimal shadow elevations. Perfect for standard information grids, descriptions, or profile summaries.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold tracking-wide uppercase">Core Static Blueprint</span>
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>Details</Button>
              </CardFooter>
            </Card>

            {/* Premium Glassmorphic Card */}
            <Card hoverEffect={true} glassmorphism={true} className="relative">
              <div className="absolute top-0 right-0 bg-indigo-500/10 px-3 py-1 rounded-bl-xl text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">
                Glass Effect
              </div>
              <CardHeader>
                <CardTitle className="gradient-text">Translucent Frost Glassmorphism</CardTitle>
                <CardDescription>Utilizes advanced blur systems, ideal for glowing metrics and premium dashboards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-300 dark:text-zinc-400 leading-relaxed">
                  By enabling the <code className="bg-[#0f3058]/30 dark:bg-zinc-900 px-1 py-0.5 rounded text-[11px] font-semibold text-slate-200 dark:text-zinc-300">glassmorphism</code> prop, components receive a slightly translucent backdrop filter blur. As themes shift, color hues of underlying modules shine through dynamically, establishing an aesthetic premium wow-factor.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 p-3.5 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Beds Left</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">124</span>
                  </div>
                  <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/30 p-3.5 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Occupancy</span>
                    <span className="text-lg font-black text-teal-600 dark:text-teal-400 leading-none">88%</span>
                  </div>
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 p-3.5 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Unverified</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clickable Interactive Card Mockup */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">Live Mockup: Hostel card click feedback</h4>
              <Card 
                hoverEffect={true} 
                interactive={true} 
                onClick={handleLike}
                className="group border border-[#1e5faf]/15 dark:border-zinc-800"
              >
                <CardHeader className="relative overflow-hidden h-36 bg-gradient-to-r from-slate-100 to-indigo-50 dark:from-zinc-900 dark:to-indigo-950/20 border-b border-slate-150 dark:border-zinc-800">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="relative z-10 flex justify-between items-start w-full">
                    <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                      <ShieldCheck size={10} /> Verified Hostel
                    </span>
                    <span className="bg-slate-900/70 text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide z-10">
                      Male Only
                    </span>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">GCTU Campus Link</span>
                    <CardTitle className="text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Supreme Gate Hostel</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  <p className="text-xs text-slate-650 dark:text-zinc-405">
                    Located just 300m away from GCTU main campus. Features robust 24/7 security guard networks, standby generator, and ultra-high-speed campus Wi-Fi routing.
                  </p>
                  
                  <div className="flex justify-between items-center border-t border-[#1e5faf]/15 dark:border-zinc-900/60 pt-4 text-xs font-bold">
                    <span className="text-slate-450 dark:text-zinc-500">Academic Price:</span>
                    <span className="text-base text-indigo-600 dark:text-indigo-400 font-extrabold">GH₵3,500 <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-normal">/yr</span></span>
                  </div>
                </CardContent>
                <CardFooter className="bg-[#06182e]/40/50 dark:bg-zinc-950/20">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike();
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none transition-colors ${
                      isLiked ? 'text-rose-500' : 'text-slate-450 hover:text-rose-500'
                    }`}
                  >
                    <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                    <span>{demoLikeCount} Likes</span>
                  </button>
                  <Button size="sm" variant="primary" iconRight={<Eye size={12} />}>Select Hostel</Button>
                </CardFooter>
              </Card>
            </div>

          </div>

          {/* Quick Inspector & Snippets Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card hoverEffect={false} className="bg-[#06182e]/40 dark:bg-zinc-950 border border-[#1e5faf]/15 dark:border-zinc-900">
              <CardHeader className="bg-[#0f3058]/30/50 dark:bg-zinc-900/40">
                <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Card Code Snippets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5 text-xs">
                
                {/* Standard card code */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>STANDARD MODULAR CARD</span>
                    <button 
                      onClick={() => copyToClipboard(`<Card hoverEffect={true}>\n  <CardHeader>\n    <CardTitle>My Card</CardTitle>\n    <CardDescription>Description</CardDescription>\n  </CardHeader>\n  <CardContent>Body</CardContent>\n</Card>`, 'standard-card')}
                      className="hover:text-slate-200 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'standard-card' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copiedText === 'standard-card' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#1e5faf]/15 dark:border-zinc-800 font-mono text-[10px] text-slate-650 dark:text-zinc-400 overflow-x-auto">
                    {`<Card hoverEffect={true}>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>`}
                  </pre>
                </div>

                {/* Glassmorphic card code */}
                <div className="space-y-2 border-t border-[#1e5faf]/15 dark:border-zinc-900 pt-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>FROSTED GLASSMORPHISM</span>
                    <button 
                      onClick={() => copyToClipboard(`<Card glassmorphism={true} hoverEffect={true}>\n  <CardHeader>\n    <CardTitle>Glass Header</CardTitle>\n  </CardHeader>\n</Card>`, 'glass-card')}
                      className="hover:text-slate-200 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'glass-card' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copiedText === 'glass-card' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#1e5faf]/15 dark:border-zinc-800 font-mono text-[10px] text-slate-650 dark:text-zinc-400 overflow-x-auto">
                    {`<Card 
  glassmorphism={true} 
  hoverEffect={true}
>
  <CardHeader>
    <CardTitle>Glass Header</CardTitle>
  </CardHeader>
</Card>`}
                  </pre>
                </div>

                {/* Interactive Card code */}
                <div className="space-y-2 border-t border-[#1e5faf]/15 dark:border-zinc-900 pt-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>INTERACTIVE CARD CLICK</span>
                    <button 
                      onClick={() => copyToClipboard(`<Card interactive={true} onClick={handleClick}>\n  <CardContent>Click Me</CardContent>\n</Card>`, 'click-card')}
                      className="hover:text-slate-200 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'click-card' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copiedText === 'click-card' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#1e5faf]/15 dark:border-zinc-800 font-mono text-[10px] text-slate-650 dark:text-zinc-400 overflow-x-auto">
                    {`<Card 
  interactive={true} 
  onClick={handleClick}
>
  <CardContent>
    Click feedback scaling
  </CardContent>
</Card>`}
                  </pre>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB C: TABLES */}
      {activeTab === 'tables' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Detailed Component structure */}
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle>Dense Operational Data Tables</CardTitle>
              <CardDescription>Live preview showing how the existing system tables sit in visual harmony next to our new reusable buttons and cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              
              <div className="dense-table-container">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Student Roster</th>
                      <th>Index / ID</th>
                      <th>Room Code</th>
                      <th>Verification</th>
                      <th className="text-right">Administration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockStudents.map((stud) => (
                      <tr key={stud.id}>
                        <td>
                          <span className="font-extrabold text-slate-900 dark:text-zinc-100">{stud.name}</span>
                        </td>
                        <td>
                          <code className="font-mono text-slate-400 dark:text-zinc-550 text-[11px] font-semibold">{stud.index}</code>
                        </td>
                        <td>
                          <span className="text-slate-300 dark:text-zinc-400 font-bold">{stud.room}</span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                            stud.status === 'VERIFIED' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/30'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100/50 dark:border-amber-900/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stud.status === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {stud.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex gap-1.5 justify-end">
                            <Button size="sm" variant="ghost" className="p-1 h-7 rounded-md" icon={<Edit3 size={13} />} />
                            <Button size="sm" variant="outline" className="p-1 h-7 rounded-md border-rose-100 text-rose-500 hover:bg-rose-50/50 dark:border-rose-950 dark:hover:bg-rose-950/20" icon={<Trash2 size={13} />} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#06182e]/40 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-900 p-4 rounded-xl text-xs">
                <span className="font-bold text-slate-500 dark:text-zinc-450">Showing 3 of 42 student registrations</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next Roster</Button>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}
