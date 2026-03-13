'use client';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPhone, FiMail } from 'react-icons/fi';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEnq, setEditEnq] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', courseInterested: '', source: 'walk-in', followUpDate: '', status: 'new', notes: '' });

  const fetchEnquiries = async () => { setLoading(true); const res = await fetch(`/api/enquiries${statusFilter ? `?status=${statusFilter}` : ''}`); setEnquiries(await res.json()); setLoading(false); };
  useEffect(() => { fetchEnquiries(); }, [statusFilter]);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editEnq ? `/api/enquiries/${editEnq.id}` : '/api/enquiries';
    const method = editEnq ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { showToast('success', editEnq ? 'Updated!' : 'Enquiry added!'); setShowModal(false); setEditEnq(null); fetchEnquiries(); }
    else showToast('error', 'Failed');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this enquiry?')) return;
    await fetch(`/api/enquiries/${id}`, { method: 'DELETE' });
    showToast('success', 'Deleted'); fetchEnquiries();
  };

  const openEdit = (e: any) => {
    setForm({ name: e.name, phone: e.phone, email: e.email, courseInterested: e.courseInterested, source: e.source, followUpDate: e.followUpDate, status: e.status, notes: e.notes });
    setEditEnq(e); setShowModal(true);
  };

  const statusColors: any = { new: 'badge-new', contacted: 'badge-info', interested: 'badge-warning', converted: 'badge-success', closed: 'badge-danger' };

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div><h2>Enquiries</h2><p>Track walk-in and phone enquiries</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', phone: '', email: '', courseInterested: '', source: 'walk-in', followUpDate: '', status: 'new', notes: '' }); setEditEnq(null); setShowModal(true); }}><FiPlus /> Add Enquiry</button>
      </div>

      <div className="tabs">
        {['', 'new', 'contacted', 'interested', 'converted', 'closed'].map(s => (
          <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="data-card">
        {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : enquiries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📞</div><h3>No Enquiries</h3><p>Add walk-in or phone enquiries</p></div>
        ) : (
          <>
            <div className="data-table-wrap pc-only">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Contact</th><th>Course Interested</th><th>Source</th><th>Follow Up</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {enquiries.map((e: any) => (
                    <tr key={e.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{e.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {e.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}><FiPhone size={12} /> {e.phone}</span>}
                          {e.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}><FiMail size={12} /> {e.email}</span>}
                        </div>
                      </td>
                      <td>{e.courseInterested || '-'}</td>
                      <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{e.source}</span></td>
                      <td>{e.followUpDate || '-'}</td>
                      <td><span className={`badge ${statusColors[e.status] || 'badge-info'}`}>{e.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(e)}><FiEdit2 /></button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(e.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-grid mobile-only">
              {enquiries.map((e: any) => (
                <div key={e.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div className="mobile-data-card-title">{e.name}</div>
                    <span className={`badge ${statusColors[e.status] || 'badge-info'}`}>{e.status}</span>
                  </div>
                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Contact</span>
                      <div className="mobile-data-card-value">
                        {e.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiPhone size={12} /> {e.phone}</div>}
                        {e.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}><FiMail size={12} /> {e.email}</div>}
                      </div>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Source</span>
                      <span className="mobile-data-card-value"><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{e.source}</span></span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Course Interested</span>
                      <span className="mobile-data-card-value">{e.courseInterested || '-'}</span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Follow Up</span>
                      <span className="mobile-data-card-value">{e.followUpDate || '-'}</span>
                    </div>
                  </div>
                  <div className="mobile-data-card-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(e)} style={{ flex: 1 }}><FiEdit2 /> Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(e.id)} style={{ color: 'var(--danger)', flex: 1 }}><FiTrash2 /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editEnq ? 'Edit Enquiry' : 'New Enquiry'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group"><label>Email</label><input className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Course Interested</label><input className="form-control" value={form.courseInterested} onChange={e => setForm({ ...form, courseInterested: e.target.value })} /></div>
                  <div className="form-group"><label>Source</label>
                    <select className="form-control" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                      <option value="walk-in">Walk-in</option><option value="phone">Phone</option><option value="online">Online</option><option value="referral">Referral</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Follow Up Date</label><input className="form-control" type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} /></div>
                  <div className="form-group"><label>Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="new">New</option><option value="contacted">Contacted</option><option value="interested">Interested</option><option value="converted">Converted</option><option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editEnq ? 'Update' : 'Add Enquiry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
