'use client';
import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiDollarSign, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAdmission, setEditAdmission] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [form, setForm] = useState({ studentId: 0, courseId: 0, timeSlotId: 0, discount: 0, admissionDate: new Date().toISOString().split('T')[0], status: 'active', notes: '', paymentPlan: 'monthly', installmentAmount: '', installmentsCount: '' });
  const [selectedCourseFee, setSelectedCourseFee] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search, status: statusFilter });
    const res = await fetch(`/api/admissions?${params}`);
    const data = await res.json();
    setAdmissions(data.admissions || []); setTotal(data.total || 0); setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const openNewAdmission = async () => {
    const [sRes, cRes, tsRes] = await Promise.all([fetch('/api/students?limit=200'), fetch('/api/courses'), fetch('/api/timeslots')]);
    const sData = await sRes.json(); setCourses(await cRes.json()); setTimeSlots(await tsRes.json());
    setStudents(sData.students || []);
    setForm({ studentId: 0, courseId: 0, timeSlotId: 0, discount: 0, admissionDate: new Date().toISOString().split('T')[0], status: 'active', notes: '', paymentPlan: 'monthly', installmentAmount: '', installmentsCount: '' });
    setSelectedCourseFee(0); setEditAdmission(null); setShowModal(true);
  };

  const openEditAdmission = async (adm: any) => {
    const [sRes, cRes, tsRes] = await Promise.all([fetch('/api/students?limit=200'), fetch('/api/courses'), fetch('/api/timeslots')]);
    const sData = await sRes.json(); setCourses(await cRes.json()); setTimeSlots(await tsRes.json());
    setStudents(sData.students || []);
    
    setForm({ 
      studentId: adm.studentId, 
      courseId: adm.courseId, 
      timeSlotId: adm.batch?.timeSlotId || 0, // Fallback if no timeslot on legacy
      discount: adm.discount, 
      admissionDate: adm.admissionDate, 
      status: adm.status,
      notes: adm.notes || '',
      paymentPlan: adm.paymentPlan || 'monthly',
      installmentAmount: adm.installmentAmount || '',
      installmentsCount: adm.installmentsCount || ''
    });
    setSelectedCourseFee(adm.totalFee || 0);
    setEditAdmission(adm);
    setShowModal(true);
  };

  const handleCourseChange = (courseId: number) => {
    setForm({ ...form, courseId, timeSlotId: 0 });
    const course = courses.find((c: any) => c.id === courseId);
    setSelectedCourseFee(course?.fee || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editAdmission ? `/api/admissions/${editAdmission.id}` : '/api/admissions';
    const method = editAdmission ? 'PUT' : 'POST';
    const payload = { 
      ...form, 
      studentId: Number(form.studentId), 
      courseId: Number(form.courseId), 
      timeSlotId: Number(form.timeSlotId), 
      discount: Number(form.discount),
      installmentAmount: form.installmentAmount ? Number(form.installmentAmount) : null,
      installmentsCount: form.installmentsCount ? Number(form.installmentsCount) : null
    };
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    if (res.ok) { showToast('success', editAdmission ? 'Admission updated!' : 'Admission created!'); setShowModal(false); setEditAdmission(null); fetchData(); }
    else showToast('error', 'Failed');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this admission?')) return;
    const res = await fetch(`/api/admissions/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Admission deleted'); fetchData(); }
    else {
      const data = await res.json();
      showToast('error', data.error || 'Failed to delete');
    }
  };

  const getPaidAmount = (adm: any) => (adm.payments || []).reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div><h2>Admissions</h2><p>Manage all student admissions ({total} total)</p></div>
        <button className="btn btn-primary" onClick={openNewAdmission}><FiPlus /> New Admission</button>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-filters">
            <div className="search-input"><FiSearch className="search-icon" /><input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <select className="form-control" style={{ width: 'auto', padding: '8px 36px 8px 12px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option><option value="active">Active</option><option value="completed">Completed</option><option value="dropped">Dropped</option>
            </select>
          </div>
        </div>

        {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : admissions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No Admissions</h3><p>Create a new admission</p></div>
        ) : (
          <>
            <div className="data-table-wrap pc-only">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Course</th><th>Batch</th><th>Net Fee</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {admissions.map((a: any) => {
                    const paid = getPaidAmount(a);
                    const balance = a.netFee - paid;
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.student?.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{a.student?.enrollmentNo}</div>
                        </td>
                        <td><span className="badge badge-info">{a.course?.code}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{a.batch?.timing || a.batch?.name}</td>
                        <td>₹{a.netFee?.toLocaleString()}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{paid.toLocaleString()}</td>
                        <td style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>₹{balance.toLocaleString()}</td>
                        <td><span className={`badge badge-${a.status === 'active' ? 'active' : a.status === 'completed' ? 'completed' : 'danger'}`}>{a.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEditAdmission(a)}><FiEdit2 /></button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-grid mobile-only">
              {admissions.map((a: any) => {
                const paid = getPaidAmount(a);
                const balance = a.netFee - paid;
                return (
                  <div key={a.id} className="mobile-data-card">
                    <div className="mobile-data-card-header">
                      <div>
                        <div className="mobile-data-card-title">{a.student?.name}</div>
                        <div className="mobile-data-card-subtitle">{a.student?.enrollmentNo}</div>
                      </div>
                      <span className={`badge badge-${a.status === 'active' ? 'active' : a.status === 'completed' ? 'completed' : 'danger'}`}>{a.status}</span>
                    </div>
                    <div className="mobile-data-card-body">
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Course & Batch</span>
                        <div className="mobile-data-card-value">
                          <span className="badge badge-info" style={{ marginBottom: 4 }}>{a.course?.code}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.batch?.timing || a.batch?.name}</div>
                        </div>
                      </div>
                      <div className="mobile-data-card-field">
                        <span className="mobile-data-card-label">Fees (Net/Paid)</span>
                        <div className="mobile-data-card-value">
                          <div>₹{a.netFee?.toLocaleString()}</div>
                          <div style={{ color: 'var(--success)' }}>₹{paid.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                        <span className="mobile-data-card-label">Balance Due</span>
                        <div className="mobile-data-card-value" style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 800, fontSize: '1.2rem' }}>
                          ₹{balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="mobile-data-card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEditAdmission(a)} style={{ flex: 1 }}><FiEdit2 /> Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)', flex: 1 }}><FiTrash2 /> Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pagination">
              <span className="pagination-info">Showing {admissions.length} of {total}</span>
              <div className="pagination-controls">
                <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="pagination-btn active">{page}</button>
                <button className="pagination-btn" disabled={admissions.length < 20} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editAdmission ? 'Edit Admission' : 'New Admission'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Student *</label>
                  <select className="form-control" required value={form.studentId} onChange={e => setForm({ ...form, studentId: Number(e.target.value) })}>
                    <option value="">Select Student</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNo})</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Course *</label>
                    <select className="form-control" required value={form.courseId} onChange={e => handleCourseChange(Number(e.target.value))}>
                      <option value="">Select Course</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name} - ₹{c.fee}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Time Slot *</label>
                    <select className="form-control" required value={form.timeSlotId} onChange={e => setForm({ ...form, timeSlotId: Number(e.target.value) })}>
                      <option value="">Select Time Slot</option>
                      {timeSlots.map((ts: any) => <option key={ts.id} value={ts.id}>{ts.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Admission Date</label><input className="form-control" type="date" value={form.admissionDate} onChange={e => setForm({ ...form, admissionDate: e.target.value })} /></div>
                  <div className="form-group"><label>Discount (₹)</label><input className="form-control" type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
                {selectedCourseFee > 0 && (
                  <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 16, marginTop: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'var(--text-muted)' }}>Course Fee</span><span>₹{selectedCourseFee.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'var(--text-muted)' }}>Discount</span><span style={{ color: 'var(--danger)' }}>-₹{(form.discount || 0).toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 8 }}><span style={{ fontWeight: 700 }}>Net Fee</span><span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>₹{(selectedCourseFee - (form.discount || 0)).toLocaleString()}</span></div>
                  </div>
                )}
                
                <h4 style={{ margin: '8px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Payment Details</h4>
                <div className="form-group">
                  <label>Payment Plan</label>
                  <select className="form-control" value={form.paymentPlan} onChange={e => setForm({ ...form, paymentPlan: e.target.value })}>
                    <option value="full">Full Payment</option>
                    <option value="monthly">Monthly Installment</option>
                  </select>
                </div>
                
                {form.paymentPlan === 'monthly' && (
                  <div className="form-row">
                    <div className="form-group"><label>Monthly Installment (₹)</label><input className="form-control" type="number" required value={form.installmentAmount} onChange={e => setForm({ ...form, installmentAmount: e.target.value })} /></div>
                    <div className="form-group"><label>Number of Months</label><input className="form-control" type="number" required value={form.installmentsCount} onChange={e => setForm({ ...form, installmentsCount: e.target.value })} /></div>
                  </div>
                )}
                <div className="form-group" style={{ marginTop: 16 }}><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiDollarSign /> {editAdmission ? 'Update Admission' : 'Create Admission'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
