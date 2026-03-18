'use client';
import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiDollarSign, FiEdit2, FiTrash2, FiDownload, FiUpload, FiSmartphone, FiX, FiSettings, FiFilter, FiSliders, FiChevronUp, FiChevronDown, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileAdmissions from '@/components/admissions/MobileAdmissions';
import BottomSheet from '@/components/mobile/BottomSheet';
import QRCode from 'qrcode';

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [editAdmission, setEditAdmission] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Selection State
  const [selectedAdmissions, setSelectedAdmissions] = useState<number[]>([]);
  
  // Customizable Columns State
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'student', 'course', 'batch', 'netFee', 'paid', 'balance', 'status', 'date'
  ]);
  const allAvailableColumns = [
    { id: 'student', label: 'Student Name' },
    { id: 'enrollment', label: 'Enrollment No' },
    { id: 'fatherName', label: 'Father\'s Name' },
    { id: 'motherName', label: 'Mother\'s Name' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'course', label: 'Course' },
    { id: 'batch', label: 'Batch' },
    { id: 'netFee', label: 'Net Fee' },
    { id: 'paid', label: 'Paid' },
    { id: 'balance', label: 'Balance' },
    { id: 'status', label: 'Status' },
    { id: 'date', label: 'Adm. Date' },
    { id: 'dob', label: 'DOB' },
    { id: 'aadhaar', label: 'Aadhaar' }
  ];
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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

  useEffect(() => {
    if (showQrModal) {
      const registrationUrl = typeof window !== 'undefined' ? `${window.location.origin}/registration` : '';
      if (registrationUrl) {
        QRCode.toDataURL(registrationUrl, { width: 250, margin: 2, color: { dark: '#1a237e', light: '#ffffff' } })
          .then(url => setQrCodeUrl(url))
          .catch(err => console.error('Error generating QR code', err));
      }
    }
  }, [showQrModal]);

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

    if (form.paymentPlan === 'monthly' && form.installmentAmount && form.installmentsCount) {
      const netFee = selectedCourseFee - (Number(form.discount) || 0);
      const calcTotal = Number(form.installmentAmount) * Number(form.installmentsCount);
      if (calcTotal !== netFee) {
        if (!confirm(`The total installments (₹${calcTotal}) do not match the Net Fee (₹${netFee}). \n\nClick OK to save anyway, or Cancel to correct it.`)) {
          return;
        }
      }
    }
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

  const handleExport = () => {
    window.location.href = '/api/admissions/export';
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) { showToast('error', 'Please select a CSV file'); return; }
    setImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) throw new Error('File is empty or missing headers');
      
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
        });
        return obj;
      });

      const res = await fetch('/api/admissions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast('success', `Imported ${result.count} admissions`);
        setShowImportModal(false);
        setImportFile(null);
        fetchData();
      } else {
        showToast('error', `Import failed: ${result.errors?.[0] || result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error processing file');
    } finally {
      setImporting(false);
    }
  };

  const getPaidAmount = (adm: any) => (adm.payments || []).reduce((s: number, p: any) => s + p.amount, 0);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const toggleSelectAdmission = (id: number) => {
    setSelectedAdmissions(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const sorted = getSortedAdmissions();
    if (selectedAdmissions.length === sorted.length) {
      setSelectedAdmissions([]);
    } else {
      setSelectedAdmissions(sorted.map(a => a.id));
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedAdmissions = () => {
    if (!sortConfig) return admissions;
    return [...admissions].sort((a, b) => {
      let valA: any, valB: any;
      if (sortConfig.key === 'student') { valA = a.student.name; valB = b.student.name; }
      else if (sortConfig.key === 'course') { valA = a.course.name; valB = b.course.name; }
      else if (sortConfig.key === 'paid') { valA = getPaidAmount(a); valB = getPaidAmount(b); }
      else if (sortConfig.key === 'balance') { valA = a.netFee - getPaidAmount(a); valB = b.netFee - getPaidAmount(b); }
      else { valA = a[sortConfig.key]; valB = b[sortConfig.key]; }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  if (isMobile) {
    return (
      <div className="mobile-admissions">
        <MobileAdmissions 
          data={admissions}
          onNew={openNewAdmission}
          onEdit={openEditAdmission}
          onDelete={handleDelete}
          onShowQr={() => setShowQrModal(true)}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <BottomSheet 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          title={editAdmission ? 'Edit Admission' : 'New Admission'}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Student *</label>
              <select className="form-control" required value={form.studentId} onChange={e => setForm({ ...form, studentId: Number(e.target.value) })}>
                <option value="">Select Student</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Course *</label>
                <select className="form-control" required value={form.courseId} onChange={e => handleCourseChange(Number(e.target.value))}>
                  <option value="">Course</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Time Slot *</label>
                <select className="form-control" required value={form.timeSlotId} onChange={e => setForm({ ...form, timeSlotId: Number(e.target.value) })}>
                  <option value="">Time Slot</option>
                  {timeSlots.map((ts: any) => <option key={ts.id} value={ts.id}>{ts.label}</option>)}
                </select>
              </div>
            </div>
            
            {selectedCourseFee > 0 && (
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Net Fee: <strong>₹{(selectedCourseFee - form.discount).toLocaleString()}</strong></span>
                  <span style={{ color: 'var(--danger)' }}>Disc: ₹{form.discount}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Plan</label>
              <select className="form-control" value={form.paymentPlan} onChange={e => setForm({ ...form, paymentPlan: e.target.value })}>
                <option value="full">Full Payment</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {form.paymentPlan === 'monthly' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Installment (₹)</label>
                  <input className="form-control" type="number" value={form.installmentAmount} onChange={e => setForm({ ...form, installmentAmount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Months</label>
                  <input className="form-control" type="number" value={form.installmentsCount} onChange={e => setForm({ ...form, installmentsCount: e.target.value })} />
                </div>
              </div>
            )}
            
            <button type="submit" className="btn btn-primary btn-block" style={{ height: 48, marginTop: 12 }}>
              {editAdmission ? 'Update' : 'Create'} Admission
            </button>
          </form>
        </BottomSheet>

        <BottomSheet 
          isOpen={showQrModal} 
          onClose={() => setShowQrModal(false)}
          title="Registration QR"
        >
          <div style={{ textAlign: 'center', padding: 16 }}>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR" style={{ width: 220, marginBottom: 16, borderRadius: 12 }} />
            ) : (
              <div className="loading-spinner" style={{ margin: '20px auto' }} />
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scan to open registration form</p>
          </div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div><h2>Admissions</h2><p>Manage all student admissions ({total} total)</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowQrModal(true)}><FiSmartphone /> View QR</button>
          <button className="btn btn-outline" onClick={handleExport}><FiDownload /> Export CSV</button>
          <button className="btn btn-outline" onClick={() => setShowImportModal(true)}><FiUpload /> Import CSV</button>
          <button className="btn btn-primary" onClick={openNewAdmission}><FiPlus /> New Admission</button>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-filters">
            <div className="search-input"><FiSearch className="search-icon" /><input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <select className="form-control" style={{ width: 'auto', padding: '8px 36px 8px 12px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option><option value="active">Active</option><option value="completed">Completed</option><option value="dropped">Dropped</option><option value="pending">Pending</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-outline" onClick={() => setShowColumnSelector(!showColumnSelector)}>
              <FiSliders /> Columns
            </button>
            {showColumnSelector && (
              <div className="dropdown-menu" style={{ position: 'absolute', right: 0, top: '45px', zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', boxShadow: 'var(--shadow-lg)', minWidth: '180px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Visible Columns</h4>
                {allAvailableColumns.map(col => (
                  <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={visibleColumns.includes(col.id)} onChange={() => toggleColumn(col.id)} />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : admissions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No Admissions</h3><p>Create a new admission</p></div>
        ) : (
          <>
            <div className="data-table-wrap pc-only">
              {selectedAdmissions.length > 0 && (
                <div style={{ padding: '8px 16px', background: 'var(--brand-blue-alpha)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span><strong>{selectedAdmissions.length}</strong> admissions selected</span>
                  <button className="btn btn-sm btn-outline" onClick={() => setSelectedAdmissions([])}>Clear Selection</button>
                </div>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <div onClick={toggleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedAdmissions.length > 0 && selectedAdmissions.length === getSortedAdmissions().length ? (
                          <FiCheckSquare style={{ color: 'var(--brand-blue-light)' }} />
                        ) : (
                          <FiSquare />
                        )}
                      </div>
                    </th>
                    {visibleColumns.includes('student') && <th style={{ cursor: 'pointer' }} onClick={() => requestSort('student')}>Student {sortConfig?.key === 'student' && (sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}</th>}
                    {visibleColumns.includes('enrollment') && <th>Enrollment</th>}
                    {visibleColumns.includes('fatherName') && <th>Father's Name</th>}
                    {visibleColumns.includes('motherName') && <th>Mother's Name</th>}
                    {visibleColumns.includes('phone') && <th>Phone</th>}
                    {visibleColumns.includes('email') && <th>Email</th>}
                    {visibleColumns.includes('course') && <th style={{ cursor: 'pointer' }} onClick={() => requestSort('course')}>Course {sortConfig?.key === 'course' && (sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}</th>}
                    {visibleColumns.includes('batch') && <th>Batch</th>}
                    {visibleColumns.includes('netFee') && <th style={{ cursor: 'pointer' }} onClick={() => requestSort('netFee')}>Net Fee {sortConfig?.key === 'netFee' && (sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}</th>}
                    {visibleColumns.includes('paid') && <th style={{ cursor: 'pointer' }} onClick={() => requestSort('paid')}>Paid {sortConfig?.key === 'paid' && (sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}</th>}
                    {visibleColumns.includes('balance') && <th style={{ cursor: 'pointer' }} onClick={() => requestSort('balance')}>Balance {sortConfig?.key === 'balance' && (sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}</th>}
                    {visibleColumns.includes('status') && <th>Status</th>}
                    {visibleColumns.includes('date') && <th style={{ cursor: 'pointer' }} onClick={() => requestSort('admissionDate')}>Date {sortConfig?.key === 'admissionDate' && (sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}</th>}
                    {visibleColumns.includes('dob') && <th>DOB</th>}
                    {visibleColumns.includes('aadhaar') && <th>Aadhaar</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedAdmissions().map((a: any) => {
                    const paid = getPaidAmount(a);
                    const balance = a.netFee - paid;
                    const isSelected = selectedAdmissions.includes(a.id);
                    const statusBadgeClass = `badge badge-${a.status === 'active' ? 'active' : a.status === 'completed' ? 'completed' : a.status === 'pending' ? 'warning' : 'danger'}`;
                    
                    return (
                      <tr key={a.id} className={isSelected ? 'selected-row' : ''}>
                        <td style={{ textAlign: 'center' }}>
                          <div onClick={() => toggleSelectAdmission(a.id)} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                            {isSelected ? (
                              <FiCheckSquare style={{ color: 'var(--brand-blue-light)' }} />
                            ) : (
                              <FiSquare style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>
                        </td>
                        {visibleColumns.includes('student') && (
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.student?.name}</td>
                        )}
                        {visibleColumns.includes('enrollment') && <td style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{a.student?.enrollmentNo}</td>}
                        {visibleColumns.includes('fatherName') && <td>{a.student?.fatherName}</td>}
                        {visibleColumns.includes('motherName') && <td>{a.student?.motherName}</td>}
                        {visibleColumns.includes('phone') && <td>{a.student?.phone}</td>}
                        {visibleColumns.includes('email') && <td style={{ fontSize: '0.8rem' }}>{a.student?.email}</td>}
                        {visibleColumns.includes('course') && <td><span className="badge badge-info">{a.course?.code}</span></td>}
                        {visibleColumns.includes('batch') && <td style={{ fontSize: '0.8rem' }}>{a.batch?.timing || a.batch?.name}</td>}
                        {visibleColumns.includes('netFee') && <td>₹{a.netFee?.toLocaleString()}</td>}
                        {visibleColumns.includes('paid') && <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{paid.toLocaleString()}</td>}
                        {visibleColumns.includes('balance') && (
                          <td style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                            ₹{balance.toLocaleString()}
                          </td>
                        )}
                        {visibleColumns.includes('status') && (
                          <td><span className={statusBadgeClass}>{a.status}</span></td>
                        )}
                        {visibleColumns.includes('date') && <td>{a.admissionDate}</td>}
                        {visibleColumns.includes('dob') && <td>{a.student?.dob}</td>}
                        {visibleColumns.includes('aadhaar') && <td style={{ fontSize: '0.8rem' }}>{a.student?.aadhaarNo}</td>}
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {a.status === 'pending' ? (
                              <>
                                <button className="btn btn-outline btn-sm" onClick={() => openEditAdmission(a)} style={{ color: 'var(--success)' }}>Approve</button>
                                <button className="btn btn-outline btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)' }}>Decline</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-outline btn-sm" onClick={() => openEditAdmission(a)}><FiEdit2 /></button>
                                <button className="btn btn-outline btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                              </>
                            )}
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
                const isSelected = selectedAdmissions.includes(a.id);
                return (
                  <div key={a.id} className={`mobile-data-card ${isSelected ? 'selected' : ''}`}>
                    <div className="mobile-data-card-header">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div onClick={(e) => { e.stopPropagation(); toggleSelectAdmission(a.id); }} style={{ cursor: 'pointer', marginTop: '2px' }}>
                          {isSelected ? (
                            <FiCheckSquare style={{ color: 'var(--brand-blue-light)', fontSize: '1.2rem' }} />
                          ) : (
                            <FiSquare style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }} />
                          )}
                        </div>
                        <div>
                          <div className="mobile-data-card-title">{a.student?.name}</div>
                          <div className="mobile-data-card-subtitle">{a.student?.enrollmentNo}</div>
                        </div>
                      </div>
                      <span className={`badge badge-${a.status === 'active' ? 'active' : a.status === 'completed' ? 'completed' : a.status === 'pending' ? 'warning' : 'danger'}`}>{a.status}</span>
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
                      {a.status === 'pending' ? (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => openEditAdmission(a)} style={{ flex: 1, color: 'var(--success)' }}>Approve</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)', flex: 1 }}>Decline</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => openEditAdmission(a)} style={{ flex: 1 }}><FiEdit2 /> Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)', flex: 1 }}><FiTrash2 /> Delete</button>
                        </>
                      )}
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
                    {/* Ensure the currently edited student is in the list even if beyond fetch limit */}
                    {editAdmission && !students.find(s => s.id === editAdmission.studentId) && editAdmission.student && (
                      <option key={editAdmission.studentId} value={editAdmission.studentId}>
                        {editAdmission.student.name} ({editAdmission.student.enrollmentNo}) [Current]
                      </option>
                    )}
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

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Import Admissions</h3><button className="modal-close" onClick={() => setShowImportModal(false)}>×</button></div>
            <form onSubmit={handleImport}>
              <div className="modal-body">
                <p style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
                  Upload a CSV file with admission details. You can <a href="/api/admissions/template" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>download the template here</a>.
                </p>
                <div className="form-group">
                  <label>CSV File *</label>
                  <input type="file" accept=".csv" className="form-control" required onChange={e => setImportFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowImportModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={importing}>
                  {importing ? 'Importing...' : <><FiUpload /> Import Admissions</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2>Registration QR Code</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Scan to access the registration form</p>
            {qrCodeUrl ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <img src={qrCodeUrl} alt="Registration QR Code" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', padding: '8px', background: '#fff' }} />
              </div>
            ) : (
              <div className="loading-spinner" style={{ margin: '40px auto' }} />
            )}
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowQrModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
