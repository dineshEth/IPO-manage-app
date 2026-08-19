'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Role } from '@prisma/client';

interface IPO {
  id: string;
  name: string;
  symbol: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Entry {
  id: string;
  status: string;
  allotmentStatus: string | null;
  ipo: {
    name: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch IPOs
        const iposResponse = await fetch('/api/ipos');
        const iposData = await iposResponse.json();
        setIpos(iposData.ipos || []);

        // Fetch entries
        const entriesResponse = await fetch('/api/entries');
        const entriesData = await entriesResponse.json();
        setEntries(entriesData.entries || []);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getStats = () => {
    const totalIPOs = ipos.length;
    const activeIPOs = ipos.filter((ipo) => ipo.status === 'ACTIVE').length;
    const pendingEntries = entries.filter((e) => e.status === 'PENDING').length;
    const acceptedEntries = entries.filter((e) => e.status === 'ACCEPTED').length;
    const allotedEntries = entries.filter((e) => e.allotmentStatus === 'ALLOTED').length;

    if (user?.role === Role.SUPER_ADMIN) {
      return [
        { label: 'Total IPOs', value: totalIPOs, color: 'bg-primary-500' },
        { label: 'Active IPOs', value: activeIPOs, color: 'bg-green-500' },
        { label: 'Total Entries', value: entries.length, color: 'bg-blue-500' },
        { label: 'Accepted', value: acceptedEntries, color: 'bg-green-500' },
      ];
    } else {
      return [
        { label: 'Total IPOs', value: totalIPOs, color: 'bg-primary-500' },
        { label: 'My Entries', value: entries.length, color: 'bg-blue-500' },
        { label: 'Pending', value: pendingEntries, color: 'bg-yellow-500' },
        { label: 'Alloted', value: allotedEntries, color: 'bg-green-500' },
      ];
    }
  };

  const stats = getStats();

  const recentIPOs = [...ipos]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || user?.username}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === Role.SUPER_ADMIN
            ? 'Manage IPOs, users, and entries from your dashboard.'
            : 'View IPOs and manage your entries.'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`stats-card ${stat.color || 'bg-primary-500'}`}
          >
            <div className="stats-value">{stat.value}</div>
            <div className="stats-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {user?.role === Role.SUPER_ADMIN && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/ipos/new" className="btn btn-primary">
              Add New IPO
            </Link>
            <Link href="/dashboard/users/new" className="btn btn-secondary">
              Add New User
            </Link>
            <Link href="/dashboard/entries/all" className="btn btn-secondary">
              View All Entries
            </Link>
          </div>
        </div>
      )}

      {/* Recent IPOs */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent IPOs
            </h2>
            <Link href="/dashboard/ipos" className="text-primary-600 hover:text-primary-700 text-sm">
              View all
            </Link>
          </div>
          
          {recentIPOs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <p className="empty-state-text">No IPOs found</p>
              <p className="text-gray-500 text-sm">
                {user?.role === Role.SUPER_ADMIN
                  ? 'Add your first IPO to get started'
                  : 'No IPOs available at the moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentIPOs.map((ipo) => (
                <div
                  key={ipo.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {ipo.name} ({ipo.symbol})
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(ipo.startDate).toLocaleDateString()} -{' '}
                        {new Date(ipo.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        ipo.status === 'ACTIVE' ? 'badge-active' :
                        ipo.status === 'CLOSED' ? 'badge-closed' : 'badge-pending'
                      }`}
                    >
                      {ipo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Entries */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.role === Role.SUPER_ADMIN ? 'Recent Entries' : 'My Entries'}
            </h2>
            <Link
              href={user?.role === Role.SUPER_ADMIN ? '/dashboard/entries/all' : '/dashboard/entries'}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              View all
            </Link>
          </div>
          
          {recentEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-text">
                {user?.role === Role.SUPER_ADMIN ? 'No entries found' : 'No entries yet'}
              </p>
              {user?.role !== Role.SUPER_ADMIN && (
                <p className="text-gray-500 text-sm">
                  Apply for an IPO to see your entries here
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {entry.ipo.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Status: {entry.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`badge ${
                          entry.status === 'ACCEPTED' ? 'badge-accepted' :
                          entry.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                        }`}
                      >
                        {entry.status}
                      </span>
                      {entry.allotmentStatus && (
                        <span
                          className={`badge ${
                            entry.allotmentStatus === 'ALLOTED' ? 'badge-alloted' : 'badge-not-alloted'
                          }`}
                        >
                          {entry.allotmentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
