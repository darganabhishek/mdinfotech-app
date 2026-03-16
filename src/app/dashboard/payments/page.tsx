'use client';
import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiFileText, FiTrash2, FiDownload, FiUpload } from 'react-icons/fi';
import Link from 'next/link';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [form, setForm] = useState({ 
    admissionId: 0, 
    amount: 0, 
    discount: 0,
    paymentDate: new Date().toISOString().split('T')[0], 
    paymentMode: 'cash', 
    reference: '', 
    notes: '' 
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    const res = await fetch(`/api/payments?${params}`);
    const data = await res.json();
    setPayments(data.payments || []); setTotal(data.total || 0); setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const openNewPayment = async () => {
    const res = await fetch('/api/admissions?limit=200&status=active');
    const data = await res.json();
    setAdmissions(data.admissions || []);
    setForm({ 
      admissionId: 0, 
      amount: 0, 
      discount: 0,
      paymentDate: new Date().toISOString().split('T')[0], 
      paymentMode: 'cash', 
      reference: '', 
      notes: '' 
    });
    setShowModal(true);
  };

  const handleAdmissionChange = (id: number) => {
    const admission = admissions.find(a => a.id === id);
    if (admission) {
      const paid = (admission.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
      const balance = admission.netFee - paid;
      
      // Auto-populate amount with installment if available, else full balance
      const suggestedAmount = admission.installmentAmount || balance;
      
      setForm({ 
        ...form, 
        admissionId: id, 
        amount: suggestedAmount > 0 ? suggestedAmount : 0 
      });
    } else {
      setForm({ ...form, admissionId: id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/payments', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        ...form, 
        admissionId: Number(form.admissionId), 
        amount: Number(form.amount),
        discount: Number(form.discount)
      }) 
    });
    if (res.ok) { showToast('success', 'Payment recorded!'); setShowModal(false); fetchPayments(); }
    else showToast('error', 'Failed');
  };

  const getReferenceLabel = () => {
    switch (form.paymentMode) {
      case 'upi': return 'UPI Transaction ID';
      case 'online': return 'Online Payment ID';
      case 'cheque': return 'Cheque Number';
      default: return 'Reference / Txn ID';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment record? This will affect the student balance.')) return;
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Payment deleted'); fetchPayments(); }
    else {
      const data = await res.json();
      showToast('error', data.error || 'Failed to delete');
    }
  };

  const handleExport = () => {
    window.location.href = '/api/payments/export';
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

      const res = await fetch('/api/payments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast('success', `Imported ${result.count} payments`);
        setShowImportModal(false);
        setImportFile(null);
        fetchPayments();
      } else {
        showToast('error', `Import failed: ${result.errors?.[0] || result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error processing file');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div><h2>Payments</h2><p>Track all fee payments ({total} total)</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={handleExport}><FiDownload /> Export CSV</button>
          <button className="btn btn-outline" onClick={() => setShowImportModal(true)}><FiUpload /> Import CSV</button>
          <button className="btn btn-primary" onClick={openNewPayment}><FiPlus /> Record Payment</button>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-filters">
            <div className="search-input"><FiSearch className="search-icon" /><input placeholder="Search receipt or student..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
          </div>
        </div>

        {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : payments.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💳</div><h3>No Payments</h3><p>Record your first payment</p></div>
        ) : (
          <>
            <div className="data-table-wrap pc-only">
              <table className="data-table">
                <thead><tr><th>Receipt #</th><th>Student</th><th>Course</th><th>Amount</th><th>Mode</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{p.receiptNo}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.admission?.student?.name}</td>
                      <td><span className="badge badge-info">{p.admission?.course?.code}</span></td>
                      <td style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1rem' }}>₹{p.amount?.toLocaleString()}</td>
                      <td><span className="badge badge-new" style={{ textTransform: 'uppercase' }}>{p.paymentMode}</span></td>
                      <td>{p.paymentDate}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link href={`/dashboard/receipts/${p.id}`} className="btn btn-outline btn-sm"><FiFileText /> Receipt</Link>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-grid mobile-only">
              {payments.map((p: any) => (
                <div key={p.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-title">{p.admission?.student?.name}</div>
                      <div className="mobile-data-card-subtitle">{p.receiptNo}</div>
                    </div>
                    <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.1rem' }}>₹{p.amount?.toLocaleString()}</div>
                  </div>
                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Course</span>
                      <span className="mobile-data-card-value"><span className="badge badge-info">{p.admission?.course?.code}</span></span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Date</span>
                      <span className="mobile-data-card-value">{p.paymentDate}</span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Mode</span>
                      <span className="mobile-data-card-value"><span className="badge badge-new" style={{ textTransform: 'uppercase' }}>{p.paymentMode}</span></span>
                    </div>
                  </div>
                  <div className="mobile-data-card-actions">
                    <Link href={`/dashboard/receipts/${p.id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}><FiFileText /> Receipt</Link>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)', flex: 1 }}><FiTrash2 /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination">
              <span className="pagination-info">Showing {payments.length} of {total}</span>
              <div className="pagination-controls">
                <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="pagination-btn active">{page}</button>
                <button className="pagination-btn" disabled={payments.length < 20} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Record Payment</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Admission *</label>
                  <select className="form-control" required value={form.admissionId} onChange={e => handleAdmissionChange(Number(e.target.value))}>
                    <option value="">Select Student Admission</option>
                    {admissions.map((a: any) => {
                      const paid = (a.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
                      const bal = a.netFee - paid;
                      return <option key={a.id} value={a.id}>{a.student?.name} - {a.course?.code} (Due: ₹{bal.toLocaleString()})</option>;
                    })}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Amount (₹) *</label><input className="form-control" type="number" required min="1" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                  <div className="form-group"><label>Additional Discount (₹)</label><input className="form-control" type="number" min="0" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Payment Mode</label>
                    <select className="form-control" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                      <option value="cash">Cash</option><option value="upi">UPI</option><option value="online">Online</option><option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Payment Date</label><input className="form-control" type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} /></div>
                </div>
                <div className="form-group">
                  <label>{getReferenceLabel()}</label>
                  <input 
                    className="form-control" 
                    value={form.reference} 
                    placeholder={form.paymentMode === 'cash' ? 'Auto-generated if empty' : ''}
                    onChange={e => setForm({ ...form, reference: e.target.value })} 
                  />
                </div>
                <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Import Payments</h3><button className="modal-close" onClick={() => setShowImportModal(false)}>×</button></div>
            <form onSubmit={handleImport}>
              <div className="modal-body">
                <p style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
                  Upload a CSV file with payment details. You can <a href="/api/payments/template" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>download the template here</a>.
                </p>
                <div className="form-group">
                  <label>CSV File *</label>
                  <input type="file" accept=".csv" className="form-control" required onChange={e => setImportFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowImportModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={importing}>
                  {importing ? 'Importing...' : <><FiUpload /> Import Payments</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
