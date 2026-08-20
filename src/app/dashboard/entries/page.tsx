'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Role } from '@/types/prisma';
import { authFetch } from '@/lib/fetch';

interface Entry {
  id: string;
  ipo: {
    id: string;
    name: string;
    symbol: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  upiId: string;
  appliedDate: string;
  status: string;
  allotmentStatus: string | null;
  requestedDeletion: boolean;
  deletionApproved: boolean;
}

export default function MyEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIPO, setSelectedIPO] = useState<string>('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch entries
        const entriesResponse = await authFetch('/api/entries');
        const entriesData = await entriesResponse.json();
        setEntries(entriesData.entries || []);

        // Fetch IPOs for dropdown
        const iposResponse = await authFetch('/api/ipos');
        const iposData = await iposResponse.json();
        setIpos(iposData.ipos || []);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Fetch entries error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authFetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipoId: selectedIPO,
          upiId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to apply for IPO');
      } else {
        setModalOpen(false);
        setSelectedIPO('');
        setUpiId('');
        // Refresh entries
        const refreshResponse = await authFetch('/api/entries');
        const refreshData = await refreshResponse.json();
        setEntries(refreshData.entries || []);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Apply for IPO error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to request deletion of this entry?')) {
      return;
    }

    try {
      const response = await authFetch(`/api/entries/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Update the entry in state
        setEntries(
          entries.map((entry) =>
            entry.id === id ? { ...entry, requestedDeletion: true } : entry
          )
        );
      } else {
        setError(data.error || 'Failed to request deletion');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete request error:', err);
    }
  };

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
          <h1 className="page-title">My IPO Entries</h1>
          <p className="page-subtitle">
            View and manage your IPO applications
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
        >
          Apply for New IPO
        </button>
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

      {/* Entries Table */}
      <div className="card p-6">
        <div className="table-container">
          {entries.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-text">No entries found</p>
              <p className="text-gray-500 text-sm">
                Apply for your first IPO to get started
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="btn btn-primary mt-4"
              >
                Apply for IPO
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>IPO</th>
                  <th>Symbol</th>
                  <th>Dates</th>
                  <th>UPI ID</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Allotment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="font-medium">
                      {entry.ipo.name}
                    </td>
                    <td className="font-mono">{entry.ipo.symbol}</td>
                    <td>
                      <div className="text-sm">
                        <div>{new Date(entry.ipo.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          to {new Date(entry.ipo.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{entry.upiId}</td>
                    <td>{new Date(entry.appliedDate).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          entry.status === 'ACCEPTED' ? 'badge-accepted' :
                          entry.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td>
                      {entry.allotmentStatus ? (
                        <span
                          className={`badge ${
                            entry.allotmentStatus === 'ALLOTED' ? 'badge-alloted' : 'badge-not-alloted'
                          }`}
                        >
                          {entry.allotmentStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {entry.status === 'PENDING' && !entry.requestedDeletion && (
                        <button
                          onClick={() => handleDeleteRequest(entry.id)}
                          className="text-orange-600 hover:text-orange-700 text-sm"
                        >
                          Request Delete
                        </button>
                      )}
                      {entry.requestedDeletion && !entry.deletionApproved && (
                        <span className="badge badge-warning">Pending Approval</span>
                      )}
                      {entry.deletionApproved && (
                        <span className="badge badge-closed">Deleted</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              {entries.filter((e) => e.allotmentStatus === 'ALLOTED').length}
            </div>
            <div className="stats-label">Alloted</div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Apply for IPO
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label htmlFor="ipo" className="form-label">
                    Select IPO *
                  </label>
                  <select
                    id="ipo"
                    value={selectedIPO}
                    onChange={(e) => setSelectedIPO(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Select an IPO</option>
                    {ipos.map((ipo: any) => (
                      <option key={ipo.id} value={ipo.id}>
                        {ipo.name} ({ipo.symbol}) - ₹{ipo.price} |{' '}
                        {new Date(ipo.startDate).toLocaleDateString()} to{' '}
                        {new Date(ipo.endDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="upiId" className="form-label">
                    UPI ID *
                  </label>
                  <input
                    type="text"
                    id="upiId"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="form-input"
                    placeholder="e.g., yourname@bankname"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your UPI ID for IPO application
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Applying...' : 'Apply Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
