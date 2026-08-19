'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/client-auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    const isAuthenticated = checkAuth();
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting...</p>
      </div>
    </div>
  );
}
