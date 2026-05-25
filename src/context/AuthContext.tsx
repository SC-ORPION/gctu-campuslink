'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  gender?: 'MALE' | 'FEMALE';
  student_id?: string;
  status?: 'ACTIVE' | 'BLOCKED';
  created_at?: string;
}

interface AuthContextType {
  user: (UserProfile & { email: string }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initialize current session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await syncUser(session.user);
      }
      setLoading(false);
    };

    initSession();

    // 2. Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUser = async (authUser: any) => {
    try {
      // Sync from public.users table (aligned with Supabase auth metadata trigger)
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let syncedUser = { ...authUser };
      if (!error && profile) {
        syncedUser = { ...syncedUser, ...profile };
      }

      // Hardcoded Admin Elevation Gate for abrahamfiamordzi1@gmail.com
      if (syncedUser.email === 'abrahamfiamordzi1@gmail.com') {
        syncedUser.role = 'admin';
        syncedUser.status = 'ACTIVE';
        
        // Write the local cookies required for middleware routing gates
        document.cookie = `user-role=admin; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `user-status=ACTIVE; path=/; max-age=86400; SameSite=Lax;`;
      }

      setUser(syncedUser);
    } catch (err) {
      console.error("Profile sync error:", err);
      
      // Secondary fallback
      let fallbackUser = { ...authUser };
      if (fallbackUser.email === 'abrahamfiamordzi1@gmail.com') {
        fallbackUser.role = 'admin';
        fallbackUser.status = 'ACTIVE';
        document.cookie = `user-role=admin; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `user-status=ACTIVE; path=/; max-age=86400; SameSite=Lax;`;
      }
      setUser(fallbackUser);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
