'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Role } from '@prisma/client';

interface User {
  id: string;
  username: string;
  name: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/profile');
        const data = await response.json();

        if (response.ok) {
          setUser(data.profile);
          setFormData({
            name: data.profile.name || '',
          });
        } else {
          setError(data.error || 'Failed to fetch profile');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update profile');
      } else {
        setSuccess('Profile updated successfully!');
        setUser(data.profile);
        setIsEditing(false);
        // Update auth context
        if (currentUser) {
          currentUser.name = data.profile.name;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update profile error:', err);
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
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...passwordData,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update password');
      } else {
        setSuccess('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
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

  const handleLogout = async () => {
    await logout();
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
        <Link href="/dashboard" className="btn btn-secondary ml-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state py-12">
        <div className="empty-state-icon">❌</div>
        <p className="empty-state-text">Profile not found</p>
        <Link href="/dashboard" className="btn btn-primary mt-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            View and manage your profile information
          </p>
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

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            &times;
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="card p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-4xl font-bold">
              {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.name || user.username}
            </h2>
            <p className="text-gray-600">@{user.username}</p>
            <span
              className={`badge mt-2 ${
                user.role === Role.SUPER_ADMIN ? 'badge-active' : 'badge-pending'
              }`}
            >
              {user.role === Role.SUPER_ADMIN ? 'Super Admin' : 'User'}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h3>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Username</label>
              <p className="text-gray-900 font-medium">{user.username}</p>
              <p className="text-sm text-gray-500">
                Username cannot be changed
              </p>
            </div>
            <div>
              <label className="form-label">Full Name</label>
              {isEditing ? (
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
          <h3 className="text-lg font-semibold text-gray-900">
            Account Information
          </h3>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Role</label>
              <span
                className={`badge ${
                  user.role === Role.SUPER_ADMIN ? 'badge-active' : 'badge-pending'
                }`}
              >
                {user.role === Role.SUPER_ADMIN ? 'Super Admin' : 'User'}
              </span>
            </div>
            <div>
              <label className="form-label">Member Since</label>
              <p className="text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="form-label">Last Updated</label>
              <p className="text-gray-900">
                {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
            <button onClick={handleEdit} className="btn btn-secondary">
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentPassword" className="form-label">
                Current Password *
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="form-input"
                placeholder="Enter current password"
                required
              />
            </div>
            <div></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="form-label">
                New Password *
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
                Confirm Password *
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
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !passwordData.currentPassword || !passwordData.newPassword}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 bg-red-50 border border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">
          Danger Zone
        </h2>
        <p className="text-red-600 mb-4">
          Once you logout, you will need to log back in with your credentials.
        </p>
        <button
          onClick={handleLogout}
          className="btn btn-danger"
        >
          Logout
        </button>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
          {user.role === Role.SUPER_ADMIN && (
            <Link href="/dashboard/users" className="btn btn-secondary">
              Manage Users
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
