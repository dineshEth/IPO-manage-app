'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/types/prisma';
import Link from 'next/link';
import { authFetch } from '@/lib/fetch';

interface Entry {
  id: string;
  ipo: {
    id: string;
    name: string;
    symbol: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
  };
  upiId: string;
  appliedDate: string;
  status: string;
  allotmentStatus: string | null;
  requestedDeletion: boolean;
  deletionApproved: boolean;
}

export default function AllEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      // Regular users should not access this page
      window.location.href = '/dashboard/entries';
    }
  }, [user]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authFetch('/api/entries');
        const data = await response.json();

        if (response.ok) {
          setEntries(data.entries || []);
        } else {
          setError(data.error || 'Failed to fetch entries');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Fetch all entries error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'SUPER_ADMIN') {
      fetchEntries();
    }
  }, [user]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await authFetch(`/api/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        setEntries(
          entries.map((entry) =>
            entry.id === id ? { ...entry, status } : entry
          )
        );
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update entry status error:', err);
    }
  };

  const handleAllotmentUpdate = async (id: string, allotmentStatus: string) => {
    try {
      const response = await authFetch(`/api/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allotmentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setEntries(
          entries.map((entry) =>
            entry.id === id ? { ...entry, allotmentStatus } : entry
          )
        );
      } else {
        setError(data.error || 'Failed to update allotment status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update allotment status error:', err);
    }
  };

  const handleDeletionApproval = async (id: string, approve: boolean) => {
    try {
      const response = await authFetch(`/api/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletionApproved: approve,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEntries(
          entries.map((entry) =>
            entry.id === id ? { ...entry, deletionApproved: approve } : entry
          )
        );
      } else {
        setError(data.error || 'Failed to update deletion approval');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update deletion approval error:', err);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      searchQuery === '' ||
      entry.ipo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.ipo.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">All IPO Entries</h1>
          <p className="page-subtitle">
            Manage all user IPO applications
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="form-label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              placeholder="Search by IPO name, symbol, or user..."
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="card p-6">
        <div className="table-container">
          {filteredEntries.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">No entries found</p>
              <p className="text-gray-500 text-sm">
                No users have applied for IPOs yet
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>IPO</th>
                  <th>User</th>
                  <th>UPI ID</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Allotment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td>
                      <div className="font-medium">{entry.ipo.name}</div>
                      <div className="text-sm text-gray-500 font-mono">
                        {entry.ipo.symbol}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{entry.user.name || entry.user.username}</div>
                      <div className="text-sm text-gray-500">{entry.user.username}</div>
                    </td>
                    <td className="font-mono text-sm">{entry.upiId}</td>
                    <td>{new Date(entry.appliedDate).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={entry.status}
                        onChange={(e) => handleStatusUpdate(entry.id, e.target.value)}
                        className={`badge ${
                          entry.status === 'ACCEPTED' ? 'badge-accepted' :
                          entry.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                        }`}
                        style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px' }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                    <td>
                      {entry.status === 'ACCEPTED' && (
                        <select
                          value={entry.allotmentStatus || ''}
                          onChange={(e) => handleAllotmentUpdate(entry.id, e.target.value)}
                          className="badge bg-gray-200"
                          style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px' }}
                        >
                          <option value="">Select...</option>
                          <option value="ALLOTED">Alloted</option>
                          <option value="NOT_ALLOTED">Not Allotted</option>
                        </select>
                      )}
                      {entry.status !== 'ACCEPTED' && (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                      {entry.allotmentStatus && entry.status !== 'ACCEPTED' && (
                        <span
                          className={`badge ${
                            entry.allotmentStatus === 'ALLOTED' ? 'badge-alloted' : 'badge-not-alloted'
                          }`}
                        >
                          {entry.allotmentStatus}
                        </span>
                      )}
                    </td>
                    <td className="space-x-2">
                      {entry.requestedDeletion && !entry.deletionApproved && (
                        <>
                          <button
                            onClick={() => handleDeletionApproval(entry.id, true)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Approve Delete
                          </button>
                          <button
                            onClick={() => handleDeletionApproval(entry.id, false)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Reject Delete
                          </button>
                        </>
                      )}
                      {entry.requestedDeletion && entry.deletionApproved && (
                        <span className="badge badge-success">Delete Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Summary
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="stats-card">
            <div className="stats-value">{entries.length}</div>
            <div className="stats-label">Total Entries</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {entries.filter((e) => e.status === 'PENDING').length}
            </div>
            <div className="stats-label">Pending</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {entries.filter((e) => e.status === 'ACCEPTED').length}
            </div>
            <div className="stats-label">Accepted</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {entries.filter((e) => e.status === 'REJECTED').length}
            </div>
            <div className="stats-label">Rejected</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {entries.filter((e) => e.allotmentStatus === 'ALLOTED').length}
            </div>
            <div className="stats-label">Alloted</div>
          </div>
        </div>
      </div>
    </div>
  );
}
