'use client';
import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '', dob: '', gender: '', qualification: ''
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search, status: statusFilter });
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(data.students || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editStudent ? `/api/students/${editStudent.id}` : '/api/students';
    const method = editStudent ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      showToast('success', editStudent ? 'Student updated!' : 'Student created!');
      setShowModal(false); setEditStudent(null); resetForm(); fetchStudents();
    } else { showToast('error', 'Operation failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Student deactivated'); fetchStudents(); }
  };

  const resetForm = () => setForm({ name: '', fatherName: '', motherName: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', dob: '', gender: '', qualification: '' });

  const openEdit = (s: any) => {
    setForm({ name: s.name, fatherName: s.fatherName, motherName: s.motherName, phone: s.phone, email: s.email, address: s.address, city: s.city, state: s.state, pincode: s.pincode, dob: s.dob, gender: s.gender, qualification: s.qualification });
    setEditStudent(s); setShowModal(true);
  };

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>Manage all registered students ({total} total)</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { resetForm(); setEditStudent(null); setShowModal(true); }}>
            <FiPlus /> Add Student
          </button>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-filters">
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input placeholder="Search students..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-control" style={{ width: 'auto', padding: '8px 36px 8px 12px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <h3>No Students Found</h3>
            <p>Add your first student to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Add Student</button>
          </div>
        ) : (
          <>
            <div className="data-table-wrap pc-only">
              <table className="data-table">
                <thead><tr><th>Enrollment</th><th>Name</th><th>Father&apos;s Name</th><th>Phone</th><th>Course</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {students.map((s: any) => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{s.enrollmentNo}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.name}</td>
                      <td>{s.fatherName}</td>
                      <td>{s.phone}</td>
                      <td>{s.admissions?.map((a: any) => a.course?.code).join(', ') || '-'}</td>
                      <td><span className={`badge badge-${s.status === 'active' ? 'active' : s.status === 'completed' ? 'completed' : 'inactive'}`}>{s.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}><FiEdit2 /></button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-grid mobile-only">
              {students.map((s: any) => (
                <div key={s.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-title">{s.name}</div>
                      <div className="mobile-data-card-subtitle">{s.enrollmentNo}</div>
                    </div>
                    <span className={`badge badge-${s.status === 'active' ? 'active' : s.status === 'completed' ? 'completed' : 'inactive'}`}>{s.status}</span>
                  </div>
                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Father's Name</span>
                      <span className="mobile-data-card-value">{s.fatherName || '-'}</span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Phone</span>
                      <span className="mobile-data-card-value">{s.phone || '-'}</span>
                    </div>
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Course</span>
                      <span className="mobile-data-card-value">{s.admissions?.map((a: any) => a.course?.code).join(', ') || '-'}</span>
                    </div>
                  </div>
                  <div className="mobile-data-card-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}><FiEdit2 /> Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination">
              <span className="pagination-info">Showing {students.length} of {total}</span>
              <div className="pagination-controls">
                <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="pagination-btn active">{page}</button>
                <button className="pagination-btn" disabled={students.length < 20} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Student's full name" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Father&apos;s Name</label>
                    <input className="form-control" value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Mother&apos;s Name</label>
                    <input className="form-control" value={form.motherName} onChange={e => setForm({ ...form, motherName: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input className="form-control" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select className="form-control" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>City</label>
                    <input className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input className="form-control" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Qualification</label>
                  <input className="form-control" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. 10th, 12th, Graduate" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editStudent ? 'Update' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
