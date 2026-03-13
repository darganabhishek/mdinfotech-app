'use client';

import { useState, useEffect } from 'react';
import { FiShield, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as number[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/permissions'),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (error) {
      toast.error('Failed to fetch roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role: Role | null = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.map((p) => p.id),
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingRole ? 'PUT' : 'POST';
    const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save role');
    }
  };

  const togglePermission = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id],
    }));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Role deleted successfully');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete role');
      }
    } catch (error) {
      toast.error('Error deleting role');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="roles-page">
      <div className="page-header">
        <div>
          <h2>User Roles & Permissions</h2>
          <p>Define administrative roles and granular feature access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <FiPlus /> Create Role
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header">
            <div className="kpi-icon blue"><FiShield /></div>
          </div>
          <div className="kpi-value">{roles.length}</div>
          <div className="kpi-label">Active Roles</div>
        </div>
      </div>

      <div className="data-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {role.name.toUpperCase()}
                    </div>
                  </td>
                  <td>{role.description}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {role.permissions.map((p) => (
                        <span key={p.id} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {p.name.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="page-actions">
                      <button className="btn btn-sm btn-outline btn-icon" onClick={() => handleOpenModal(role)}>
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(role.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="data-card-header">
              <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
              <button className="btn btn-icon btn-outline" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="page-content">
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Coordinator, Accountant"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  placeholder="Brief description of this role's purpose"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Permissions (Select feature access)</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                  gap: '12px',
                  marginTop: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  {permissions.map((perm) => (
                    <div 
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        background: formData.permissions.includes(perm.id) ? 'var(--brand-blue-light)' : 'var(--bg-input)',
                        color: formData.permissions.includes(perm.id) ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>{perm.name.replace(/_/g, ' ').toUpperCase()}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{perm.description}</div>
                      </div>
                      {formData.permissions.includes(perm.id) && <FiCheck />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="page-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
