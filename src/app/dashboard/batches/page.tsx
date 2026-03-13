'use client';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiClock } from 'react-icons/fi';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [form, setForm] = useState({ name: '', courseId: 0, startDate: '', endDate: '', timing: '', instructor: '', capacity: 25, status: 'active' });

  const fetch_data = async () => {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([fetch('/api/batches'), fetch('/api/courses')]);
    setBatches(await bRes.json()); setCourses(await cRes.json()); setLoading(false);
  };
  useEffect(() => { fetch_data(); }, []);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editBatch ? `/api/batches/${editBatch.id}` : '/api/batches';
    const method = editBatch ? 'PUT' : 'POST';
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...form, courseId: Number(form.courseId), capacity: Number(form.capacity) }) 
    });
    if (res.ok) { 
      showToast('success', editBatch ? 'Batch updated!' : 'Batch created!'); 
      setShowModal(false); 
      setEditBatch(null);
      fetch_data(); 
    }
    else showToast('error', 'Failed');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    const res = await fetch(`/api/batches/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Batch deleted'); fetch_data(); }
    else {
      const data = await res.json();
      showToast('error', data.error || 'Failed to delete');
    }
  };

  const openEdit = (b: any) => {
    setForm({ 
      name: b.name, 
      courseId: b.courseId, 
      startDate: b.startDate || '', 
      endDate: b.endDate || '', 
      timing: b.timing || '', 
      instructor: b.instructor || '', 
      capacity: b.capacity, 
      status: b.status 
    });
    setEditBatch(b);
    setShowModal(true);
  };

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div><h2>Batches</h2><p>Manage course batches and schedules</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', courseId: courses[0]?.id || 0, startDate: '', endDate: '', timing: '', instructor: '', capacity: 25, status: 'active' }); setEditBatch(null); setShowModal(true); }}><FiPlus /> Add Batch</button>
      </div>

      {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : (
        <div className="data-card">
          <div className="data-table-wrap pc-only">
            <table className="data-table">
              <thead><tr><th>Batch Name</th><th>Course</th><th>Timing</th><th>Instructor</th><th>Capacity</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {batches.map((b: any) => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{b.name}</td>
                    <td><span className="badge badge-info">{b.course?.code}</span></td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiClock style={{ color: 'var(--text-muted)' }} /> {b.timing || '-'}</td>
                    <td>{b.instructor || 'TBD'}</td>
                    <td>{b.capacity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUsers style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 600, color: b._count?.admissions >= b.capacity ? 'var(--danger)' : 'var(--success)' }}>{b._count?.admissions || 0}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${b.status === 'active' ? 'active' : b.status === 'completed' ? 'completed' : 'warning'}`}>{b.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}><FiEdit2 /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(b.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-card-grid mobile-only">
            {batches.map((b: any) => (
              <div key={b.id} className="mobile-data-card">
                <div className="mobile-data-card-header">
                  <div>
                    <div className="mobile-data-card-title">{b.name}</div>
                    <div className="mobile-data-card-subtitle"><span className="badge badge-info">{b.course?.code}</span></div>
                  </div>
                  <span className={`badge badge-${b.status === 'active' ? 'active' : b.status === 'completed' ? 'completed' : 'warning'}`}>{b.status}</span>
                </div>
                <div className="mobile-data-card-body">
                  <div className="mobile-data-card-field">
                    <span className="mobile-data-card-label">Timing</span>
                    <span className="mobile-data-card-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={12} /> {b.timing || '-'}</span>
                  </div>
                  <div className="mobile-data-card-field">
                    <span className="mobile-data-card-label">Instructor</span>
                    <span className="mobile-data-card-value">{b.instructor || 'TBD'}</span>
                  </div>
                  <div className="mobile-data-card-field">
                    <span className="mobile-data-card-label">Enrollment</span>
                    <span className="mobile-data-card-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiUsers size={12} /> {b._count?.admissions || 0} / {b.capacity}
                    </span>
                  </div>
                </div>
                <div className="mobile-data-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)} style={{ flex: 1 }}><FiEdit2 /> Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleDelete(b.id)} style={{ color: 'var(--danger)', flex: 1 }}><FiTrash2 /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editBatch ? 'Edit Batch' : 'Add New Batch'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Batch Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning Batch Jan 2026" /></div>
                <div className="form-row">
                  <div className="form-group"><label>Course *</label>
                    <select className="form-control" required value={form.courseId} onChange={e => setForm({ ...form, courseId: Number(e.target.value) })}>
                      <option value="">Select Course</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Timing</label><input className="form-control" value={form.timing} onChange={e => setForm({ ...form, timing: e.target.value })} placeholder="e.g. 10 AM - 12 PM" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Start Date</label><input className="form-control" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                  <div className="form-group"><label>End Date</label><input className="form-control" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Instructor</label><input className="form-control" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} /></div>
                  <div className="form-group"><label>Capacity</label><input className="form-control" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editBatch ? 'Update' : 'Create Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
