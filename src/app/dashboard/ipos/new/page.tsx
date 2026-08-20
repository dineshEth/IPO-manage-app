'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/types/prisma';
import Link from 'next/link';

export default function NewIPOPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    startDate: '',
    endDate: '',
    rumorGMP: '',
    price: '',
    lotSize: '',
    costInRupees: '',
    status: 'PENDING',
    listingDate: '',
    allotmentDate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create IPO');
      } else {
        setSuccess('IPO created successfully!');
        setFormData({
          name: '',
          symbol: '',
          startDate: '',
          endDate: '',
          rumorGMP: '',
          price: '',
          lotSize: '',
          costInRupees: '',
          status: 'PENDING',
          listingDate: '',
          allotmentDate: '',
        });
        setTimeout(() => {
          router.push('/dashboard/ipos');
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create IPO error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New IPO</h1>
          <p className="page-subtitle">
            Create a new Initial Public Offering
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/ipos" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            &times;
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <div>
              <label htmlFor="name" className="form-label">
                IPO Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Reliance Industries"
                required
              />
            </div>

            <div>
              <label htmlFor="symbol" className="form-label">
                Symbol *
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., RELIANCE"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
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
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Financial Information
            </h2>

            <div>
              <label htmlFor="price" className="form-label">
                Price (₹) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 1000"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="lotSize" className="form-label">
                Lot Size *
              </label>
              <input
                type="number"
                id="lotSize"
                name="lotSize"
                value={formData.lotSize}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 10"
                required
              />
            </div>

            <div>
              <label htmlFor="costInRupees" className="form-label">
                Cost in Rupees (₹) *
              </label>
              <input
                type="number"
                id="costInRupees"
                name="costInRupees"
                value={formData.costInRupees}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 10000"
                step="0.01"
                required
                disabled
              />
            </div>

            <div>
              <label htmlFor="rumorGMP" className="form-label">
                Rumor GMP (₹)
              </label>
              <input
                type="number"
                id="rumorGMP"
                name="rumorGMP"
                value={formData.rumorGMP}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 50"
                step="0.01"
              />
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
              <label htmlFor="startDate" className="form-label">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="form-label">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label htmlFor="listingDate" className="form-label">
                Listing Date
              </label>
              <input
                type="date"
                id="listingDate"
                name="listingDate"
                value={formData.listingDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="allotmentDate" className="form-label">
                Allotment Date
              </label>
              <input
                type="date"
                id="allotmentDate"
                name="allotmentDate"
                value={formData.allotmentDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner spinner-sm"></span>
                Creating...
              </>
            ) : (
              'Create IPO'
            )}
          </button>
        </div>
      </form>

      {/* Form instructions */}
      <div className="card p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Instructions
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li>• All fields marked with (*) are required</li>
          <li>• Enter accurate financial information</li>
          <li>• Set appropriate dates for the IPO subscription period</li>
          <li>• GMP (Grey Market Premium) is optional</li>
          <li>• Listing and allotment dates can be updated later</li>
        </ul>
      </div>
    </div>
  );
}
