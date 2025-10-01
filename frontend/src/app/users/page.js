'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { usersAPI, authAPI } from '@/lib/api';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'attendant',
    isActive: true
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser._id, {
          fullName: formData.fullName,
          role: formData.role,
          isActive: formData.isActive
        });
      } else {
        await authAPI.register({
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role
        });
      }
      
      setShowModal(false);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        role: 'attendant',
        isActive: true
      });
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.resetPassword(editingUser._id, {
        newPassword: formData.password
      });
      
      setShowPasswordModal(false);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        role: 'attendant',
        isActive: true
      });
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handlePasswordResetClick = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    });
    setShowPasswordModal(true);
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Access Denied</h3>
          <p className="mt-1 text-sm text-secondary-500">
            You don't have permission to access this page.
          </p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Users</h1>
            <p className="text-secondary-600 mt-1">
              Manage system users and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add New User
          </button>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Username</th>
                  <th className="table-header-cell">Full Name</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="table-body-cell font-medium">{user.username}</td>
                    <td className="table-body-cell">{user.fullName}</td>
                    <td className="table-body-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-danger-100 text-danger-800' :
                        user.role === 'supervisor' ? 'bg-warning-100 text-warning-800' :
                        'bg-primary-100 text-primary-800'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="table-body-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-success-100 text-success-800' : 'bg-secondary-100 text-secondary-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-body-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-body-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePasswordResetClick(user)}
                          className="text-warning-600 hover:text-warning-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No users found</h3>
            <p className="mt-1 text-sm text-secondary-500">
              Get started by adding a new user.
            </p>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit}>
              {!editingUser && (
                <div className="mb-4">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="form-input"
                    placeholder="Enter username"
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="form-input"
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="form-input"
                >
                  <option value="attendant">Attendant</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {!editingUser && (
                <div className="mb-4">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-input"
                    placeholder="Enter password"
                  />
                </div>
              )}
              
              {editingUser && (
                <div className="mb-4">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="form-input"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({
                      username: '',
                      password: '',
                      fullName: '',
                      role: 'attendant',
                      isActive: true
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              Reset Password - {editingUser?.fullName}
            </h3>
            <form onSubmit={handlePasswordReset}>
              <div className="mb-4">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input"
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setEditingUser(null);
                    setFormData({
                      username: '',
                      password: '',
                      fullName: '',
                      role: 'attendant',
                      isActive: true
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-warning">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}