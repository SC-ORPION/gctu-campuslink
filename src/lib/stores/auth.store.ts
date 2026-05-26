import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  studentId?: string;
  phone?: string;
}

class AuthStore {
  private user: User | null = {
    id: '1',
    name: 'Abraham Doe',
    email: 'student@gctu.edu.gh',
    role: 'STUDENT',
    studentId: 'GCTU002401',
    phone: '+233 24 123 4567',
  };
  private isAuthenticated = true;
  private listeners = new Set<() => void>();

  getUser() {
    return this.user;
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  setUser(user: User | null) {
    this.user = user;
    this.isAuthenticated = !!user;
    this.emit();
  }

  logout() {
    this.user = null;
    this.isAuthenticated = false;
    this.emit();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const authStoreInstance = new AuthStore();

export function useAuthStore() {
  const [user, setUser] = useState(authStoreInstance.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authStoreInstance.getIsAuthenticated());

  useEffect(() => {
    const unsubscribe = authStoreInstance.subscribe(() => {
      setUser(authStoreInstance.getUser());
      setIsAuthenticated(authStoreInstance.getIsAuthenticated());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    isAuthenticated,
    setUser: (u: User | null) => authStoreInstance.setUser(u),
    logout: () => authStoreInstance.logout(),
  };
}
