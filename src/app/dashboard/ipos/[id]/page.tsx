'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/types/prisma';
import Link from 'next/link';
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

export default function IPODetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ipo, setIpo] = useState<IPO | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    startDate: '',
    endDate: '',
    rumorGMP: '',
    price: '',
    lotSize: '',
    costInRupees: '',
    status: '',
    listingDate: '',
    allotmentDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchIPO = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authFetch(`/api/ipos/${id}`);
        const data = await response.json();

        if (response.ok) {
          setIpo(data.ipo);
          setFormData({
            name: data.ipo.name,
            symbol: data.ipo.symbol,
            startDate: new Date(data.ipo.startDate).toISOString().split('T')[0],
            endDate: new Date(data.ipo.endDate).toISOString().split('T')[0],
            rumorGMP: data.ipo.rumorGMP || '',
            price: data.ipo.price?.toString() || '',
            lotSize: data.ipo.lotSize?.toString() || '',
            costInRupees: data.ipo.costInRupees?.toString() || '',
            status: data.ipo.status,
            listingDate: data.ipo.listingDate ? new Date(data.ipo.listingDate).toISOString().split('T')[0] : '',
            allotmentDate: data.ipo.allotmentDate ? new Date(data.ipo.allotmentDate).toISOString().split('T')[0] : '',
          });
        } else {
          setError(data.error || 'Failed to fetch IPO');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Fetch IPO error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIPO();
  }, [id]);

  // Auto-calculate cost in rupees when price or lotSize changes
  useEffect(() => {
    const price = parseFloat(formData.price) || 0;
    const lotSize = parseFloat(formData.lotSize) || 0;
    const calculatedCost = price * lotSize;
    if (!isNaN(calculatedCost)) {
      setFormData((prev) => ({
        ...prev,
        costInRupees: calculatedCost.toString(),
      }));
    }
  }, [formData.price, formData.lotSize]);

  // Auto-update status based on dates
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      let newStatus = 'PENDING';
      if (today >= startDate && today <= endDate) {
        newStatus = 'ACTIVE';
      } else if (today > endDate) {
        newStatus = 'CLOSED';
      }

      setFormData((prev) => ({
        ...prev,
        status: newStatus,
      }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (ipo) {
      setFormData({
        name: ipo.name,
        symbol: ipo.symbol,
        startDate: new Date(ipo.startDate).toISOString().split('T')[0],
        endDate: new Date(ipo.endDate).toISOString().split('T')[0],
        rumorGMP: ipo.rumorGMP?.toString() || '',
        price: ipo.price?.toString() || '',
        lotSize: ipo.lotSize?.toString() || '',
        costInRupees: ipo.costInRupees?.toString() || '',
        status: ipo.status,
        listingDate: ipo.listingDate ? new Date(ipo.listingDate).toISOString().split('T')[0] : '',
        allotmentDate: ipo.allotmentDate ? new Date(ipo.allotmentDate).toISOString().split('T')[0] : '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authFetch(`/api/ipos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update IPO');
      } else {
        setSuccess('IPO updated successfully!');
        setIpo(data.ipo);
        setIsEditing(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update IPO error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this IPO? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authFetch(`/api/ipos/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard/ipos');
      } else {
        setError(data.error || 'Failed to delete IPO');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete IPO error:', err);
    }
  };

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

  if (error && !ipo) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
        <Link href="/dashboard/ipos" className="btn btn-secondary ml-4">
          Back to IPOs
        </Link>
      </div>
    );
  }

  if (!ipo) {
    return (
      <div className="empty-state py-12">
        <div className="empty-state-icon">❌</div>
        <p className="empty-state-text">IPO not found</p>
        <Link href="/dashboard/ipos" className="btn btn-primary mt-4">
          Back to IPOs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEditing ? 'Edit IPO' : `${ipo.name} (${ipo.symbol})`}
          </h1>
          <p className="page-subtitle">
            {isEditing ? 'Update IPO information' : 'View IPO details'}
          </p>
        </div>
        <div className="flex gap-4">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEdit} className="btn btn-secondary">
                Edit
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            &times;
          </button>
        </div>
      )}

      {/* IPO Details */}
      <div className="card p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="form-label">IPO Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="text-gray-900">{ipo.name}</p>
              )}
            </div>
            <div>
              <label className="form-label">Symbol</label>
              {isEditing ? (
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="text-gray-900 font-mono">{ipo.symbol}</p>
              )}
            </div>
            <div>
              <label className="form-label">Status</label>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                  disabled
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) : (
                <span
                  className={`badge ${
                    ipo.status === 'ACTIVE' ? 'badge-active' :
                    ipo.status === 'CLOSED' ? 'badge-closed' : 'badge-pending'
                  }`}
                >
                  {ipo.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Information
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Price (₹)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              ) : (
                <p className="text-gray-900">₹{ipo.price.toLocaleString()}</p>
              )}
            </div>
            <div>
              <label className="form-label">Lot Size</label>
              {isEditing ? (
                <input
                  type="number"
                  name="lotSize"
                  value={formData.lotSize}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="text-gray-900">{ipo.lotSize}</p>
              )}
            </div>
            <div>
              <label className="form-label">Cost in Rupees (₹)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="costInRupees"
                  value={formData.costInRupees}
                  onChange={handleChange}
                  className="form-input"
                  step="0.01"
                  required
                  disabled
                />
              ) : (
                <p className="text-gray-900">₹{ipo.costInRupees.toLocaleString()}</p>
              )}
            </div>
            <div>
              <label className="form-label">Rumor GMP (₹)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="rumorGMP"
                  value={formData.rumorGMP}
                  onChange={handleChange}
                  className="form-input"
                  step="0.01"
                />
              ) : (
                <p className="text-gray-900">
                  {ipo.rumorGMP !== null ? `₹${ipo.rumorGMP}` : '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Important Dates
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              {isEditing ? (
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="text-gray-900">
                  {new Date(ipo.startDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">End Date</label>
              {isEditing ? (
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <p className="text-gray-900">
                  {new Date(ipo.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Listing Date</label>
              {isEditing ? (
                <input
                  type="date"
                  name="listingDate"
                  value={formData.listingDate}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <p className="text-gray-900">
                  {ipo.listingDate ? new Date(ipo.listingDate).toLocaleDateString() : '-'}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Allotment Date</label>
              {isEditing ? (
                <input
                  type="date"
                  name="allotmentDate"
                  value={formData.allotmentDate}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <p className="text-gray-900">
                  {ipo.allotmentDate ? new Date(ipo.allotmentDate).toLocaleDateString() : '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Meta Information
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Created By</label>
              <p className="text-gray-900">
                {ipo.createdBy.name || ipo.createdBy.username}
              </p>
            </div>
            <div>
              <label className="form-label">Created At</label>
              <p className="text-gray-900">
                {new Date(ipo.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <button onClick={handleEdit} className="btn btn-secondary">
              Edit IPO
            </button>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete IPO
            </button>
            <Link href="/dashboard/ipos" className="btn btn-secondary">
              Back to All IPOs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
