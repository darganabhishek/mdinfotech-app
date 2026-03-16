'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiKey, FiLock, FiX, FiDownload, FiSearch, FiCheckSquare, FiSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
  createdAt: string;
}

export default function StudentAccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAccount = (id: number) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAccounts.length === filteredUsers.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredUsers.map(u => u.id));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users?role=student');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch student accounts');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = 'Name,Enrollment No (Username),Status,Created At\n';
    const rows = users.map(u => 
      `"${u.name}","${u.username}","${u.active ? 'Active' : 'Disabled'}","${new Date(u.createdAt).toLocaleDateString()}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_accounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        active: user.active,
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', password: '', active: true });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';

    try {
      // For NEW student users, we'd normally need a roleId. 
      // But student accounts are usually auto-created during admission.
      // This page is mostly for management (editing/deleting/resetting password).
      const payload = editingUser ? formData : { ...formData, roleId: 2 }; // Assuming 2 is Student role

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Account ${editingUser ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save account');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student account? This will block their portal access.')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Account deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete account');
      }
    } catch (error) {
      toast.error('Error deleting account');
    }
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h2>Student Accounts</h2>
          <p>Manage login credentials for enrolled students.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={exportCSV}>
            <FiDownload /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus /> New Student Account
          </button>
        </div>
      </div>

      <div className="data-card">
        {selectedAccounts.length > 0 && (
          <div style={{ padding: '8px 16px', background: 'var(--brand-blue-alpha)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <span><strong>{selectedAccounts.length}</strong> accounts selected</span>
            <button className="btn btn-sm btn-outline" onClick={() => setSelectedAccounts([])}>Clear Selection</button>
          </div>
        )}
        <div className="data-card-header">
          <div className="search-input" style={{ maxWidth: '400px' }}>
            <FiSearch className="search-icon" />
            <input 
              placeholder="Search student by name or enrollment no..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Loading student accounts...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <h3>No Accounts Found</h3>
              <p>Try a different search or create a new account.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <div onClick={toggleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedAccounts.length > 0 && selectedAccounts.length === filteredUsers.length ? (
                        <FiCheckSquare style={{ color: 'var(--brand-blue-light)' }} />
                      ) : (
                        <FiSquare />
                      )}
                    </div>
                  </th>
                  <th>Student Name</th>
                  <th>Enrollment No (Username)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSelected = selectedAccounts.includes(user.id);
                  return (
                    <tr key={user.id} className={isSelected ? 'selected-row' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <div onClick={() => toggleSelectAccount(user.id)} style={{ cursor: 'pointer', display: 'inline-flex' }}>
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
                      <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>{user.username}</code></td>
                      <td>
                        <span className={`badge ${user.active ? 'badge-success' : 'badge-danger'}`}>
                          {user.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="page-actions">
                          <button className="btn btn-sm btn-outline btn-icon" onClick={() => handleOpenModal(user)} title="Edit Account">
                            <FiEdit2 />
                          </button>
                          <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(user.id)} title="Delete Account">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="data-card-header">
              <h3>{editingUser ? 'Edit Student Account' : 'Manual Account Creation'}</h3>
              <button className="btn btn-icon btn-outline" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="page-content">
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Enrollment Number (Username)</label>
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
                  placeholder={editingUser ? '••••••••' : 'Enter login password'}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Portal Access Active
                </label>
              </div>

              <div className="page-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
