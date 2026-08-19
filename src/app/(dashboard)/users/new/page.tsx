'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/types/prisma';
import Link from 'next/link';

export default function NewUserPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'USER',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create user');
      } else {
        setSuccess('User created successfully!');
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'USER',
        });
        setTimeout(() => {
          router.push('/dashboard/users');
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create user error:', err);
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
          <h1 className="page-title">Add New User</h1>
          <p className="page-subtitle">
            Create a new user account
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/users" className="btn btn-secondary">
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
          <div>
            <label htmlFor="username" className="form-label">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., johndoe"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Unique username for login
            </p>
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter password"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum 8 characters
            </p>
          </div>

          <div>
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <label htmlFor="role" className="form-label">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value={'USER'}>Regular User</option>
              <option value={'SUPER_ADMIN'}>Super Admin</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Super Admin has full access, Regular User has limited access
            </p>
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
              'Create User'
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
          <li>• Username must be unique</li>
          <li>• Password should be strong (minimum 8 characters)</li>
          <li>• Regular users can only view IPOs and manage their own entries</li>
          <li>• Super Admins can manage everything including IPOs, users, and all entries</li>
        </ul>
      </div>

      {/* Recently created users */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Important Notes
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li>• The new user will be able to login immediately with the provided credentials</li>
          <li>• Make sure to share the username and password securely with the user</li>
          <li>• Users can update their own profile information (name, password) after login</li>
          <li>• Only Super Admins can create, edit, and delete users</li>
        </ul>
      </div>
    </div>
  );
}
