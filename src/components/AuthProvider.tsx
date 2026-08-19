'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPayload } from '@/lib/auth';
import { getAuthState, setAuthData, clearAuthData } from '@/lib/client-auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserPayload }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const authState = getAuthState();
      
      if (authState.isAuthenticated && authState.user) {
        setUser(authState.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.user && data.message === 'Login successful') {
        setUser(data.user);
        setIsAuthenticated(true);
        setAuthData(data.user.username, data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Sync with cookie changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUser();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check every 5 minutes if token is still valid
    const interval = setInterval(fetchUser, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
