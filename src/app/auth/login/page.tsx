'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Info, Upload, Home as HomeIcon, MapPin, Calendar, Heart } from 'lucide-react';
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

  // Login States
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [activeModal, setActiveModal] = useState<'bank' | 'forgot' | null>(null);


  // Extended Student Registration States
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // New Fields
  const [level, setLevel] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [digitalAddress, setDigitalAddress] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  
  // Guardian Fields
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');

  // Avatar Upload States
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const GENDER_OPTIONS = ['MALE', 'FEMALE'];
  const LEVEL_OPTIONS = ['100', '200', '300', '400', '500', '600'];
  const RELATIONSHIP_OPTIONS = ['Parent', 'Guardian', 'Sibling', 'Uncle', 'Aunt', 'Spouse', 'Other'];
  
  const DEPARTMENTS = [
    'Computing and Information Systems',
    'Engineering',
    'Business School',
    'Graduate Studies & Continuing Education'
  ];

  const PROGRAMS = [
    // Computing and Information Systems (Undergraduate)
    'BSc Information Technology',
    'BSc Computer Science',
    'BSc Software Engineering',
    'BSc Mobile Computing',
    'BSc Cyber Security',
    'BSc Data Science and Analytics',
    'BSc Internet of Things and Big Data',
    'BSc Networking and Systems Administration',
    
    // Computing Diplomas
    'Diploma in Information Technology',
    'Diploma in Computer Science',
    'Diploma in Cyber Security',
    'Diploma in Data Science',
    'Diploma in Web Application Development',

    // Engineering & Sciences
    'BSc Computer Engineering',
    'BSc Telecommunications Engineering',
    'BSc Electrical and Electronic Engineering',
    'BSc Mathematics',
    'Diploma in Telecommunications Engineering',

    // Business School
    'BSc Accounting with Computing',
    'BSc Banking and Finance',
    'BSc Procurement and Logistics Management',
    'BSc Business Administration (Human Resource Management)',
    'BSc Business Administration (Marketing)',
    'Diploma in Business Administration'
  ];

  // Set isSignUp based on query parameters
  useEffect(() => {
    const signupParam = searchParams.get('signup');
    if (signupParam === 'true') {
      setIsSignUp(true);
    }
  }, [searchParams]);

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
      } else {
        router.push('/dashboard');
      }
    }
  }, [currentUser, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 150 * 1024) {
        setErrorMsg('Upload size must not be more than 150KB. Please upload a passport-sized picture with a white background.');
        setAvatarFile(null);
        setAvatarPreview(null);
        return;
      }
      setErrorMsg(null);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

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
        
        let profile: any = null;
        let profileErr: any = null;

        if (result.user.email === 'abrahamfiamordzi1@gmail.com') {
          profile = { role: 'admin', status: 'ACTIVE' };
        } else {
          const { data, error } = await supabase
            .from('users').select('role, status').eq('id', result.user.id).single();
          profile = data;
          profileErr = error;
        }

        if (profileErr || !profile) {
          // Robust fallback: use metadata instead of logging out, allowing AuthContext self-healing sync to create the DB record
          profile = {
            role: result.user.user_metadata?.role || 'student',
            status: result.user.user_metadata?.status || 'ACTIVE'
          };
        }
        document.cookie = `user-role=${profile.role}; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `user-status=${profile.status}; path=/; max-age=86400; SameSite=Lax;`;
        if (profile.status === 'BLOCKED') { router.push('/blocked'); return; }
        router.push('/dashboard');
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
      if (!fullName || !studentId || !email || !phoneNumber || !gender || !department || !program || !password || !confirmPassword || !level || !dateOfBirth || !homeAddress || !guardianName || !guardianPhone || !guardianRelationship)
        throw new Error('Please fill out all registration fields.');
      if (password !== confirmPassword) throw new Error('Passwords do not match.');

      let avatarUrl = '';
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${studentId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload avatar image to public bucket 'avatars'
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          console.warn("Storage upload failed, proceeding using base64 or empty string fallback:", uploadError.message);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { 
          data: { 
            full_name: fullName, 
            student_id: studentId, 
            gender, 
            phone_number: phoneNumber, 
            department, 
            program, 
            role: 'student',
            level: parseInt(level),
            date_of_birth: dateOfBirth,
            digital_address: digitalAddress,
            home_address: homeAddress,
            guardian_name: guardianName,
            guardian_phone: guardianPhone,
            guardian_relationship: guardianRelationship,
            avatar_url: avatarUrl
          } 
        }
      });
      
      if (signUpError) throw signUpError;
      if (data?.user) {
        setSuccessMsg('Account created successfully with full student credentials! You can now sign in.');
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
    <div 
      style={{
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/assets/gctu-gate.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100%',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        paddingTop: '90px',
        paddingBottom: '40px'
      }}
    >
      {/* Premium Header */}
      <header 
        style={{
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          backgroundColor: '#333',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/assets/gctu-logo.png" 
            alt="GCTU Logo" 
            style={{ width: '40px', height: '40px' }} 
          />
          <div className="hidden sm:block text-left">
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'block', lineHeight: '1.2' }}>
              GHANA COMMUNICATION
            </span>
            <h4 style={{ color: 'rgb(135, 133, 133)', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>
              TECHNOLOGY UNIVERSITY
            </h4>
          </div>
          <div className="block sm:hidden text-left">
            <span style={{ color: 'white', fontSize: '15px', fontWeight: 'bold', display: 'block', lineHeight: '1.2' }}>
              GCTU
            </span>
            <h4 style={{ color: 'rgb(135, 133, 133)', fontSize: '9px', fontWeight: 'bold', margin: 0 }}>
              CAMPUSLINK
            </h4>
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="hidden md:flex items-center">
          <ul style={{ display: 'flex', gap: '25px', listStyle: 'none', margin: 0, padding: 0 }}>
            <li>
              <a 
                href="/" 
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold' }}
                className="hover:text-yellow-400 transition-colors"
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="/hostels" 
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold' }}
                className="hover:text-yellow-400 transition-colors"
              >
                Room Availability
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveModal('bank'); }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold' }}
                className="hover:text-yellow-400 transition-colors"
              >
                Bank Details
              </a>
            </li>
          </ul>
        </nav>

        <nav style={{ display: 'flex', gap: '15px' }}>
          <ul style={{ display: 'flex', gap: '15px', listStyle: 'none', margin: 0, padding: 0 }}>
            <li>
              <button 
                onClick={() => setIsSignUp(false)}
                style={{ 
                  color: !isSignUp ? '#ffcc00' : 'white', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
                className="hover:text-yellow-400 transition-colors"
              >
                Login
              </button>
            </li>
            <li>
              <button 
                onClick={() => setIsSignUp(true)}
                style={{ 
                  color: isSignUp ? '#ffcc00' : 'white', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
                className="hover:text-yellow-400 transition-colors"
              >
                Register
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Glassmorphic Input Box Container */}
      <div 
        className="w-[92%] sm:w-[90%] p-5 sm:p-10 mt-[80px] sm:mt-[60px]"
        style={{
          position: 'relative',
          maxWidth: isSignUp ? '800px' : '500px',
          minHeight: '400px',
          borderRadius: '15px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          boxShadow: '0 0 20px rgba(57, 90, 237, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          transition: 'all 0.3s ease'
        }}
      >
        <h2 
          style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0 0 10px 0'
          }}
        >
          {isSignUp ? 'Portal Registration Form' : 'Portal Login'}
        </h2>

        {/* Status Alerts */}
        {errorMsg && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px 15px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Info size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div style={{ backgroundColor: '#D1FAE5', color: '#059669', padding: '10px 15px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <ShieldCheck size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms */}
        {!isSignUp ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {/* User ID / Email field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
              <label style={{ color: 'rgb(225, 223, 223)', fontSize: '15px', fontWeight: 'bold' }}>
                User ID / Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  value={emailOrId} 
                  onChange={(e) => setEmailOrId(e.target.value)} 
                  placeholder="Student ID or Email"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '2px solid #395aed',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  required 
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '15px', fontWeight: 'bold', flexGrow: 1 }}>
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => setActiveModal('forgot')}
                  style={{ background: 'none', border: 'none', color: '#395aed', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Forgot?
                </button>

              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    border: '2px solid #395aed',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  required 
                />
                <button 
                  type="button" 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#395aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background-color 0.2s ease',
                marginTop: '10px'
              }}
              className="hover:bg-blue-700"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Portal Access</span><ArrowRight size={18} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button 
                type="button" 
                onClick={() => setIsSignUp(true)} 
                style={{ background: 'none', border: 'none', color: '#ffcc00', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Don&apos;t have an account? Register Portal Access
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Split layout: Photo & Primary Info */}
            <div style={{ display: 'flex', flexDirection: 'column', lgDirection: 'row', lgFlexDirection: 'row', gap: '30px' }} className="flex flex-col md:flex-row">
              {/* Photo upload zone */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #395aed', borderRadius: '10px', padding: '20px', backgroundColor: 'rgba(57, 90, 237, 0.05)' }}>
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Passport Preview" 
                    style={{ width: '150px', height: '150px', borderRadius: '10px', objectFit: 'cover', marginBottom: '15px', border: '3px solid #395aed' }} 
                  />
                ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                    <Upload size={40} style={{ color: '#94A3B8' }} />
                  </div>
                )}
                <label style={{ cursor: 'pointer', backgroundColor: '#395aed', color: 'white', padding: '8px 16px', borderRadius: '5px', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }} className="hover:bg-blue-700">
                  Upload Passport Photo *
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    style={{ display: 'none' }} 
                    required
                  />
                </label>
                <span style={{ color: '#ffcc00', fontSize: '11px', marginTop: '10px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.4' }}>
                  Must be a Passport Picture with a WHITE BACKGROUND<br/>Max Upload Size: 150KB
                </span>
              </div>

              {/* Main Fields Grid */}
              <div style={{ flex: '2', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="John Doe"
                      style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                      required 
                    />
                  </div>
                </div>

                {/* Student ID */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Student ID *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                      type="text" 
                      value={studentId} 
                      onChange={(e) => setStudentId(e.target.value)} 
                      placeholder="GCTU-022201"
                      style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                      required 
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="student@gctu.edu.gh"
                      style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                      required 
                    />
                  </div>
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Phone *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                      type="tel" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      placeholder="+233 24 000 0000"
                      style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic & Personal Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              
              {/* Level */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Level *</label>
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: '#333', color: 'white', fontSize: '15px', outline: 'none' }}
                  required
                >
                  <option value="" disabled>Select Level</option>
                  {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Date of Birth */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Date of Birth *</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="date" 
                    value={dateOfBirth} 
                    onChange={(e) => setDateOfBirth(e.target.value)} 
                    style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: '#333', color: 'white', fontSize: '15px', outline: 'none' }}
                    required 
                  />
                </div>
              </div>

              {/* Gender */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Gender *</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: '#333', color: 'white', fontSize: '15px', outline: 'none' }}
                  required
                >
                  <option value="" disabled>Select Gender</option>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Department */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Department *</label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: '#333', color: 'white', fontSize: '15px', outline: 'none' }}
                  required
                >
                  <option value="" disabled>Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Program */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Program *</label>
                <select 
                  value={program} 
                  onChange={(e) => setProgram(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: '#333', color: 'white', fontSize: '15px', outline: 'none' }}
                  required
                >
                  <option value="" disabled>Select Program</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Digital Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Ghana Post GPS Digital Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="text" 
                    value={digitalAddress} 
                    onChange={(e) => setDigitalAddress(e.target.value)} 
                    placeholder="GA-123-4567"
                    style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Residential/Home Address *</label>
              <div style={{ position: 'relative' }}>
                <HomeIcon size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94A3B8' }} />
                <textarea 
                  value={homeAddress} 
                  onChange={(e) => setHomeAddress(e.target.value)} 
                  placeholder="Enter your current residential address"
                  style={{ width: '100%', minHeight: '60px', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none', resize: 'vertical' }}
                  required 
                />
              </div>
            </div>

            {/* Guardian & Next of Kin Section */}
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginTop: '10px' }}>
              Guardian / Next of Kin Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              
              {/* Guardian Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Guardian's Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="text" 
                    value={guardianName} 
                    onChange={(e) => setGuardianName(e.target.value)} 
                    placeholder="Guardian's Name"
                    style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                    required 
                  />
                </div>
              </div>

              {/* Guardian Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Guardian's Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="tel" 
                    value={guardianPhone} 
                    onChange={(e) => setGuardianPhone(e.target.value)} 
                    placeholder="+233 20 000 0000"
                    style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                    required 
                  />
                </div>
              </div>

              {/* Guardian Relationship */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Relationship to Student *</label>
                <select 
                  value={guardianRelationship} 
                  onChange={(e) => setGuardianRelationship(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: '#333', color: 'white', fontSize: '15px', outline: 'none' }}
                  required
                >
                  <option value="" disabled>Select Relationship</option>
                  {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Password Section */}
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginTop: '10px' }}>
              Portal Security Credentials
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                    required 
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgb(225, 223, 223)', fontSize: '14px', fontWeight: 'bold' }}>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 10px 10px 35px', border: '2px solid #395aed', borderRadius: '8px', backgroundColor: 'transparent', color: 'white', fontSize: '15px', outline: 'none' }}
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#395aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '20px'
              }}
              className="hover:bg-blue-700"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Create Student Account</span><ArrowRight size={18} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setIsSignUp(false)} 
                style={{ background: 'none', border: 'none', color: '#ffcc00', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modern Overlay Modals */}
      {activeModal === 'bank' && (
        <div 
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0A192F] border border-slate-800 text-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl cursor-default border-t-4 border-t-yellow-500"
          >
            <h3 className="text-lg font-bold text-yellow-500">Official GCTU Bank Details</h3>
            <p className="text-xs text-slate-350 leading-relaxed text-left bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              GCTU hostel payments are made to GCB Bank PLC.<br/><br/>
              <strong>Account Name</strong>: GCTU Hostel Accommodations<br/>
              <strong>Account Number</strong>: 1234567890123<br/>
              <strong>Branch</strong>: Tesano Main Branch<br/><br/>
              Submit your bank deposit slip on this portal to get your bed slot allocated instantly!
            </p>
            <button 
              onClick={() => setActiveModal(null)} 
              className="w-full bg-[#395aed] hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {activeModal === 'forgot' && (
        <div 
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0A192F] border border-slate-800 text-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl cursor-default border-t-4 border-t-[#395aed]"
          >
            <h3 className="text-lg font-bold text-[#395aed]">Credential Assistance</h3>
            <p className="text-xs text-slate-350 leading-relaxed text-left bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              Forgot your login email, Student ID, or password credentials?<br/><br/>
              Please visit the <strong>GCTU Housing Administration Office</strong> at the Tesano Campus or call the official helpdesk hotline at:<br/><br/>
              <span className="font-bold text-yellow-500 text-sm">+233 302 123 456</span><br/>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Available Monday - Friday, 8AM - 5PM</span>
            </p>
            <button 
              onClick={() => setActiveModal(null)} 
              className="w-full bg-[#395aed] hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
            >
              Close Help
            </button>
          </div>
        </div>
      )}
    </div>

  );
}
