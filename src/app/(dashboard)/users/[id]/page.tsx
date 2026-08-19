'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@prisma/client';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  name: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export default function UserDetailPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: Role.USER,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${id}`);
        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            role: data.user.role,
          });
        } else {
          setError(data.error || 'Failed to fetch user');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Fetch user error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUser();
    }
  }, [id, currentUser]);

  const canEdit = currentUser?.role === Role.SUPER_ADMIN || currentUser?.id === id;
  const canEditRole = currentUser?.role === Role.SUPER_ADMIN;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        role: user.role,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update user');
      } else {
        setSuccess('User updated successfully!');
        setUser(data.user);
        setIsEditing(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update user error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update password');
      } else {
        setSuccess('Password updated successfully!');
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard/users');
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete user error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
        <Link href="/dashboard/users" className="btn btn-secondary ml-4">
          Back to Users
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state py-12">
        <div className="empty-state-icon">❌</div>
        <p className="empty-state-text">User not found</p>
        <Link href="/dashboard/users" className="btn btn-primary mt-4">
          Back to Users
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
            {isEditing ? 'Edit User' : user.name || user.username}
          </h1>
          <p className="page-subtitle">
            {isEditing ? 'Update user information' : 'View user details'}
          </p>
        </div>
        {canEdit && !isEditing && (
          <div className="flex gap-4">
            <button onClick={handleEdit} className="btn btn-secondary">
              Edit
            </button>
            {canEditRole && currentUser?.id !== id && (
              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            )}
          </div>
        )}
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

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            &times;
          </button>
        </div>
      )}

      {/* User Details */}
      <div className="card p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Username</label>
              <p className="text-gray-900 font-medium">{user.username}</p>
            </div>
            <div>
              <label className="form-label">Role</label>
              {isEditing && canEditRole ? (
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value={Role.USER}>Regular User</option>
                  <option value={Role.SUPER_ADMIN}>Super Admin</option>
                </select>
              ) : (
                <span
                  className={`badge ${
                    user.role === Role.SUPER_ADMIN ? 'badge-active' : 'badge-pending'
                  }`}
                >
                  {user.role === Role.SUPER_ADMIN ? 'Super Admin' : 'User'}
                </span>
              )}
            </div>
            <div className="lg:col-span-2">
              <label className="form-label">Full Name</label>
              {isEditing && canEdit ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <p className="text-gray-900">{user.name || '-'}</p>
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
              <label className="form-label">Created At</label>
              <p className="text-gray-900">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="form-label">Last Updated</label>
              <p className="text-gray-900">
                {new Date(user.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && canEdit && (
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
          </div>
        )}
      </div>

      {/* Password Change Section (only for self) */}
      {currentUser?.id === id && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Change Password
          </h2>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="form-input"
                placeholder="Enter new password"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="form-input"
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !passwordData.newPassword}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href={currentUser?.role === Role.SUPER_ADMIN ? '/dashboard/users' : '/dashboard'} className="btn btn-secondary">
            Back
          </Link>
          {canEdit && !isEditing && (
            <button onClick={handleEdit} className="btn btn-primary">
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
