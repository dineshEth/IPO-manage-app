'use client';

import React from 'react';
import { UserPayload } from '@/lib/auth';
import { Role } from '@prisma/client';

interface NavbarProps {
  user: UserPayload | null;
  onMenuClick: () => void;
  onLogout: () => Promise<void>;
}

export default function Navbar({ user, onMenuClick, onLogout }: NavbarProps) {
  const handleLogout = async () => {
    await onLogout();
  };

  return (
    <header className="navbar sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop menu button (hidden on mobile) */}
          <div className="hidden lg:block"></div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-xl">🔔</span>
            </button>

            {/* User dropdown */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role === Role.SUPER_ADMIN ? 'Super Admin' : 'User'}
                </p>
              </div>
              
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold">
                  {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
