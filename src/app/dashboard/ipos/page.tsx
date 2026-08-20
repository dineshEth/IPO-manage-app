'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Role } from '@/types/prisma';
import { authFetch } from '@/lib/fetch';

interface IPO {
  id: string;
  name: string;
  symbol: string;
  startDate: string;
  endDate: string;
  rumorGMP: number | null;
  price: number;
  lotSize: number;
  costInRupees: number;
  status: string;
  listingDate: string | null;
  allotmentDate: string | null;
  createdAt: string;
  createdBy: {
    username: string;
    name: string;
  };
}

export default function IPOsPage() {
  const { user } = useAuth();
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const fetchIPOs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authFetch('/api/ipos');
        const data = await response.json();

        if (response.ok) {
          setIpos(data.ipos || []);
        } else {
          setError(data.error || 'Failed to fetch IPOs');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Fetch IPOs error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIPOs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this IPO? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authFetch(`/api/ipos/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setIpos(ipos.filter((ipo) => ipo.id !== id));
      } else {
        setError(data.error || 'Failed to delete IPO');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete IPO error:', err);
    }
  };

  const filteredIPOs = ipos.filter((ipo) => {
    const matchesSearch = 
      searchQuery === '' ||
      ipo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ipo.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || ipo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          <h1 className="page-title">All IPOs</h1>
          <p className="page-subtitle">
            View and manage all Initial Public Offerings
          </p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Link href="/dashboard/ipos/new" className="btn btn-primary">
            Add New IPO
          </Link>
        )}
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
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="form-label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              placeholder="Search by name or symbol..."
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
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
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

      {/* IPOs Table */}
      <div className="card p-6">
        <div className="table-container">
          {filteredIPOs.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">📈</div>
              <p className="empty-state-text">No IPOs found</p>
              <p className="text-gray-500 text-sm">
                {user?.role === 'SUPER_ADMIN'
                  ? 'Add your first IPO to get started'
                  : 'No IPOs available at the moment'}
              </p>
              {user?.role === 'SUPER_ADMIN' && (
                <Link href="/dashboard/ipos/new" className="btn btn-primary mt-4">
                  Add New IPO
                </Link>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Lot Size</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>GMP</th>
                  {user?.role === 'SUPER_ADMIN' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredIPOs.map((ipo) => (
                  <tr key={ipo.id} className="hover:bg-gray-50">
                    <td>
                      <Link
                        href={`/dashboard/ipos/${ipo.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {ipo.name}
                      </Link>
                    </td>
                    <td className="font-mono">{ipo.symbol}</td>
                    <td>₹{ipo.price.toLocaleString()}</td>
                    <td>{ipo.lotSize}</td>
                    <td>
                      <div className="text-sm">
                        <div>{new Date(ipo.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          to {new Date(ipo.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          ipo.status === 'ACTIVE' ? 'badge-active' :
                          ipo.status === 'CLOSED' ? 'badge-closed' : 'badge-pending'
                        }`}
                      >
                        {ipo.status}
                      </span>
                    </td>
                    <td>
                      {ipo.rumorGMP !== null ? (
                        <span className="font-medium text-green-600">
                          ₹{ipo.rumorGMP}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {user?.role === 'SUPER_ADMIN' && (
                      <td className="space-x-2">
                        <Link
                          href={`/dashboard/ipos/${ipo.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(ipo.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    )}
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
            <div className="stats-value">{ipos.length}</div>
            <div className="stats-label">Total IPOs</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {ipos.filter((ipo) => ipo.status === 'ACTIVE').length}
            </div>
            <div className="stats-label">Active</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {ipos.filter((ipo) => ipo.status === 'PENDING').length}
            </div>
            <div className="stats-label">Pending</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {ipos.filter((ipo) => ipo.status === 'CLOSED').length}
            </div>
            <div className="stats-label">Closed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
