'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMonitor, FiTool, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'lab_computer', label: '💻 Lab Computer', color: '#3498db' },
  { value: 'software_license', label: '🔑 Software License', color: '#9b59b6' },
  { value: 'projector', label: '📽 Projector', color: '#e67e22' },
  { value: 'room', label: '🏫 Room / Lab', color: '#2ecc71' },
  { value: 'furniture', label: '🪑 Furniture', color: '#95a5a6' },
  { value: 'other', label: '📦 Other', color: '#34495e' },
];

export default function ResourceManagementPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterCat, setFilterCat] = useState('');
  const [formData, setFormData] = useState({
    name: '', category: 'lab_computer', description: '', quantity: '1', available: '1', location: '', status: 'available', notes: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/institute-resources');
      setResources(await res.json());
    } catch { toast.error('Failed to load resources'); }
    finally { setLoading(false); }
  };

  const openModal = (r: any = null) => {
    if (r) {
      setEditing(r);
      setFormData({
        name: r.name, category: r.category, description: r.description || '',
        quantity: String(r.quantity), available: String(r.available),
        location: r.location || '', status: r.status, notes: r.notes || ''
      });
    } else {
      setEditing(null);
      setFormData({ name: '', category: 'lab_computer', description: '', quantity: '1', available: '1', location: '', status: 'available', notes: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/institute-resources/${editing.id}` : '/api/institute-resources';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        toast.success(editing ? 'Resource updated!' : 'Resource added!');
        setModalOpen(false);
        fetchData();
      } else { toast.error('Operation failed'); }
    } catch { toast.error('Network error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this resource?')) return;
    try {
      const res = await fetch(`/api/institute-resources/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Resource deleted'); fetchData(); }
    } catch { toast.error('Error'); }
  };

  const getCat = (val: string) => CATEGORIES.find(c => c.value === val) || CATEGORIES[5];
  const filtered = filterCat ? resources.filter(r => r.category === filterCat) : resources;

  const statusStyles: Record<string, { bg: string; color: string }> = {
    available: { bg: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' },
    in_use: { bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' },
    maintenance: { bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="resources-page">
      <div className="page-header">
        <div>
          <h2>Resource Management</h2>
          <p>Track lab computers, software licenses, rooms, and equipment.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="form-control" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FiPlus /> Add Resource
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card blue">
          <div className="kpi-value">{resources.length}</div>
          <div className="kpi-label">Total Resources</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-value">{resources.filter(r => r.status === 'available').length}</div>
          <div className="kpi-label">Available</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-value">{resources.filter(r => r.status === 'in_use').length}</div>
          <div className="kpi-label">In Use</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-value">{resources.filter(r => r.status === 'maintenance').length}</div>
          <div className="kpi-label">Maintenance</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🖥️</div>
          <h3>No Resources Found</h3>
          <p>Start tracking your institute assets.</p>
          <button className="btn btn-primary" onClick={() => openModal()}><FiPlus /> Add First Resource</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map((r: any) => {
            const cat = getCat(r.category);
            const st = statusStyles[r.status] || statusStyles.available;
            return (
              <div key={r.id} className="data-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: '0.75rem', color: cat.color }}>{cat.label}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, background: st.bg, color: st.color }}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
                {r.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{r.description}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>Qty: <strong>{r.quantity}</strong></div>
                  <div>Available: <strong>{r.available}</strong></div>
                  {r.location && <div style={{ gridColumn: 'span 2' }}>📍 {r.location}</div>}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => openModal(r)}><FiEdit2 /> Edit</button>
                  <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r.id)}><FiTrash2 /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header"><h3>{editing ? 'Edit Resource' : 'Add New Resource'}</h3><button className="modal-close" onClick={() => setModalOpen(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Dell OptiPlex 7080" />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" className="form-control" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Available</label>
                    <input type="number" className="form-control" min="0" value={formData.available} onChange={e => setFormData({ ...formData, available: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input className="form-control" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Lab 2, Floor 1" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Resource'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
