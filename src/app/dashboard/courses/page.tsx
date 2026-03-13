'use client';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiClock } from 'react-icons/fi';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [form, setForm] = useState({ name: '', code: '', duration: 3, durationUnit: 'months', fee: 0, description: '' });

  const fetchCourses = async () => { setLoading(true); const res = await fetch('/api/courses'); setCourses(await res.json()); setLoading(false); };
  useEffect(() => { fetchCourses(); }, []);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editCourse ? `/api/courses/${editCourse.id}` : '/api/courses';
    const method = editCourse ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, fee: Number(form.fee), duration: Number(form.duration) }) });
    if (res.ok) { showToast('success', editCourse ? 'Course updated!' : 'Course created!'); setShowModal(false); setEditCourse(null); fetchCourses(); }
    else { const d = await res.json(); showToast('error', d.error || 'Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this course?')) return;
    await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    showToast('success', 'Course deactivated'); fetchCourses();
  };

  const openEdit = (c: any) => { setForm({ name: c.name, code: c.code, duration: c.duration, durationUnit: c.durationUnit, fee: c.fee, description: c.description }); setEditCourse(c); setShowModal(true); };

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div><h2>Courses</h2><p>Manage all courses offered</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', code: '', duration: 3, durationUnit: 'months', fee: 0, description: '' }); setEditCourse(null); setShowModal(true); }}><FiPlus /> Add Course</button>
      </div>

      {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {courses.filter((c: any) => c.active).map((c: any) => (
            <div key={c.id} className="data-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{c.name}</h3>
                    <span className="badge badge-info">{c.code}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}><FiEdit2 /></button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>{c.description || 'No description'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiClock /> {c.duration} {c.durationUnit}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUsers /> {c._count?.admissions || 0} enrolled</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>₹{c.fee?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editCourse ? 'Edit Course' : 'Add New Course'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Course Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Code *</label><input className="form-control" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
                  <div className="form-group"><label>Fee (₹) *</label><input className="form-control" type="number" required value={form.fee} onChange={e => setForm({ ...form, fee: Number(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Duration *</label><input className="form-control" type="number" required value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} /></div>
                  <div className="form-group"><label>Duration Unit</label>
                    <select className="form-control" value={form.durationUnit} onChange={e => setForm({ ...form, durationUnit: e.target.value })}>
                      <option value="months">Months</option><option value="weeks">Weeks</option><option value="years">Years</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editCourse ? 'Update' : 'Add Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
