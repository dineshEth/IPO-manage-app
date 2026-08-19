'use client';

import React, { useEffect, useState } from 'react';
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

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    if (user?.role !== Role.SUPER_ADMIN) {
      // Regular users should not access this page
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/users');
        const data = await response.json();

        if (response.ok) {
          setUsers(data.users || []);
        } else {
          setError(data.error || 'Failed to fetch users');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Fetch users error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === Role.SUPER_ADMIN) {
      fetchUsers();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete user error:', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      searchQuery === '' ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === '' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (user?.role !== Role.SUPER_ADMIN) {
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
          <h1 className="page-title">All Users</h1>
          <p className="page-subtitle">
            Manage system users and their roles
          </p>
        </div>
        <Link href="/dashboard/users/new" className="btn btn-primary">
          Add New User
        </Link>
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
              placeholder="Search by username or name..."
            />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="USER">User</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('');
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-6">
        <div className="table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-text">No users found</p>
              <p className="text-gray-500 text-sm">
                Add your first user to get started
              </p>
              <Link href="/dashboard/users/new" className="btn btn-primary mt-4">
                Add New User
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="font-medium">{u.username}</td>
                    <td>{u.name || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === Role.SUPER_ADMIN ? 'badge-active' : 'badge-pending'
                        }`}
                      >
                        {u.role === Role.SUPER_ADMIN ? 'Super Admin' : 'User'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(u.updatedAt).toLocaleDateString()}</td>
                    <td className="space-x-2">
                      <Link
                        href={`/dashboard/users/${u.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                      {u.username !== user?.username && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
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
            <div className="stats-value">{users.length}</div>
            <div className="stats-label">Total Users</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {users.filter((u) => u.role === Role.SUPER_ADMIN).length}
            </div>
            <div className="stats-label">Super Admins</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">
              {users.filter((u) => u.role === Role.USER).length}
            </div>
            <div className="stats-label">Regular Users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
