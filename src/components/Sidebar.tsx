'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserPayload } from '@/lib/auth';
import { Role } from '@prisma/client';

interface SidebarProps {
  user: UserPayload | null;
  onClose: () => void;
}

const menuItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: '🏠',
    roles: [Role.SUPER_ADMIN, Role.USER],
  },
  {
    name: 'All IPOs',
    path: '/dashboard/ipos',
    icon: '📈',
    roles: [Role.SUPER_ADMIN, Role.USER],
  },
  {
    name: 'My Entries',
    path: '/dashboard/entries',
    icon: '📝',
    roles: [Role.SUPER_ADMIN, Role.USER],
  },
  {
    name: 'All Entries',
    path: '/dashboard/entries/all',
    icon: '📋',
    roles: [Role.SUPER_ADMIN],
  },
  {
    name: 'Add IPO',
    path: '/dashboard/ipos/new',
    icon: '➕',
    roles: [Role.SUPER_ADMIN],
  },
  {
    name: 'Users',
    path: '/dashboard/users',
    icon: '👥',
    roles: [Role.SUPER_ADMIN],
  },
  {
    name: 'Add User',
    path: '/dashboard/users/new',
    icon: '👤',
    roles: [Role.SUPER_ADMIN],
  },
];

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();

  const filteredMenuItems = menuItems.filter((item) =>
    user && item.roles.includes(user.role)
  );

  return (
    <div className="sidebar w-64 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/20">
        <h1 className="text-xl font-bold text-white">
          IPO <span className="text-primary-300">Management</span>
        </h1>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{user?.name || user?.username}</p>
            <p className="text-white/70 text-xs">
              {user?.role === Role.SUPER_ADMIN ? 'Super Admin' : 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile link */}
      <div className="p-4 border-t border-white/20">
        <Link
          href="/dashboard/profile"
          className="sidebar-link"
          onClick={onClose}
        >
          <span>👤</span>
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
}
