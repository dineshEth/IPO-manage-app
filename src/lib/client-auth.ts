'use client';

import { UserPayload } from './auth';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserPayload | null;
  token: string | null;
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null;
  }
  return null;
}

export function checkAuth(): boolean {
  const token = getToken();
  return !!token;
}

export function getUserFromStorage(): UserPayload | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData) as UserPayload;
    }
  }
  return null;
}

export function setAuthData(token: string, user: UserPayload): void {
  if (typeof window !== 'undefined') {
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function clearAuthData(): void {
  if (typeof window !== 'undefined') {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('user');
  }
}

export function getAuthState(): AuthState {
  const token = getToken();
  const user = getUserFromStorage();

  return {
    isAuthenticated: !!token && !!user,
    user,
    token,
  };
}
