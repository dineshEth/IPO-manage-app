'use client';

import { getToken } from './client-auth';

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getToken();
  
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}
