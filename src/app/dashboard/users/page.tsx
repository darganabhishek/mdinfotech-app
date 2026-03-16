'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiKey, FiLock, FiX, FiDownload, FiCheckSquare, FiSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import BulkActions from '@/components/dashboard/BulkActions';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  role: Role | null;
  active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    roleId: '',
    active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = 'Name,Username,Role,Status\n';
    const rows = users.map(u => 
      `"${u.name}","${u.username}","${u.role?.name || ''}","${u.active ? 'Active' : 'Disabled'}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Don't show password
        roleId: user.role?.id.toString() || '',
        active: user.active,
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', password: '', roleId: '', active: true });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted successfully');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h2>User Accounts</h2>
          <p>Manage staff, faculty, and administrative access.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowBulk(!showBulk)}>
            {showBulk ? 'Hide Bulk' : 'Bulk Import'}
          </button>
          <button className="btn btn-outline" onClick={exportCSV}>
            <FiDownload /> Export
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus /> New User
          </button>
        </div>
      </div>

      {showBulk && (
        <BulkActions type="users" onComplete={fetchData} />
      )}
      <div className="data-card">
        {selectedUsers.length > 0 && (
          <div style={{ padding: '8px 16px', background: 'var(--brand-blue-alpha)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <span><strong>{selectedUsers.length}</strong> users selected</span>
            <button className="btn btn-sm btn-outline" onClick={() => setSelectedUsers([])}>Clear Selection</button>
          </div>
        )}
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <div onClick={toggleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedUsers.length > 0 && selectedUsers.length === users.length ? (
                      <FiCheckSquare style={{ color: 'var(--brand-blue-light)' }} />
                    ) : (
                      <FiSquare />
                    )}
                  </div>
                </th>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelected = selectedUsers.includes(user.id);
                return (
                  <tr key={user.id} className={isSelected ? 'selected-row' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <div onClick={() => toggleSelectUser(user.id)} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                        {isSelected ? (
                          <FiCheckSquare style={{ color: 'var(--brand-blue-light)' }} />
                        ) : (
                          <FiSquare style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                    </td>
                  <td>{user.username}</td>
                  <td>
                    <span className="badge badge-info">
                      {user.role?.name.toUpperCase() || 'NO ROLE'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.active ? 'badge-success' : 'badge-danger'}`}>
                      {user.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="page-actions">
                      <button className="btn btn-sm btn-outline btn-icon" onClick={() => handleOpenModal(user)} title="Edit User">
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(user.id)} title="Delete User">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="data-card-header">
              <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button className="btn btn-icon btn-outline" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="page-content">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username (Login ID)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password {editingUser && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Assign Role</label>
                <select
                  className="form-control"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  required
                >
                  <option value="">Select a Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Account Enabled
                </label>
              </div>

              <div className="page-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
