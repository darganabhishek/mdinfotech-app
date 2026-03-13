'use client';
import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiAward, FiDownload, FiSearch } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [form, setForm] = useState({ admissionId: 0, issueDate: new Date().toISOString().split('T')[0], grade: 'A+' });

  const fetchData = async () => {
    setLoading(true);
    const [cRes, aRes] = await Promise.all([
      fetch('/api/certificates'),
      fetch('/api/admissions?limit=200&status=completed') // Usually issue only for completed
    ]);
    setCertificates(await cRes.json());
    const admData = await aRes.json();
    setAdmissions(admData.admissions || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, admissionId: Number(form.admissionId) })
    });
    if (res.ok) {
      showToast('success', 'Certificate issued successfully!');
      setShowModal(false);
      fetchData();
    } else {
      showToast('error', 'Failed to issue certificate');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return;
    const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('success', 'Certificate revoked');
      fetchData();
    }
  };

  const generatePDF = (cert: any) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const instName = "M.D. INFOTECH";
    
    // Border
    doc.setDrawColor(79, 70, 229); doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 273, 186);

    // Ornament background (simulate)
    doc.setFillColor(249, 250, 251); doc.rect(15, 15, 267, 180, 'F');

    // Content
    doc.setFontSize(40); doc.setTextColor(79, 70, 229); doc.setFont("times", "bolditalic");
    doc.text(instName, 148, 45, { align: 'center' });
    
    doc.setFontSize(16); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text("COMPUTER EDUCATION & TRAINING CENTER", 148, 55, { align: 'center' });

    doc.setDrawColor(200); doc.line(80, 65, 216, 65);

    doc.setFontSize(32); doc.setTextColor(0); doc.setFont("times", "bold");
    doc.text("CERTIFICATE OF COMPLETION", 148, 85, { align: 'center' });

    doc.setFontSize(14); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text("This is to certify that", 148, 100, { align: 'center' });

    doc.setFontSize(24); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(cert.admission?.student?.name, 148, 115, { align: 'center' });

    doc.setFontSize(14); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text(`has successfully completed the course`, 148, 125, { align: 'center' });

    doc.setFontSize(20); doc.setTextColor(79, 70, 229); doc.setFont("helvetica", "bold");
    doc.text(cert.admission?.course?.name, 148, 138, { align: 'center' });

    doc.setFontSize(14); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text(`with grade "${cert.grade}" from M.D. INFOTECH.`, 148, 150, { align: 'center' });

    // Footer Info
    doc.setFontSize(10); doc.setTextColor(0);
    doc.text(`Certificate No: ${cert.certificateNo}`, 30, 180);
    doc.text(`Issue Date: ${cert.issueDate}`, 30, 186);

    // Signature
    doc.setDrawColor(0); doc.line(210, 180, 260, 180);
    doc.text("Director Signature", 235, 186, { align: 'center' });

    // Logo Placeholder/Seal
    doc.setFillColor(79, 70, 229); doc.circle(148, 175, 15, 'F');
    doc.setTextColor(255); doc.setFontSize(10); doc.text("OFFICIAL\nSEAL", 148, 174, { align: 'center' });

    doc.save(`Certificate_${cert.admission?.student?.name.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredCerts = certificates.filter(c => 
    c.certificateNo.toLowerCase().includes(search.toLowerCase()) ||
    c.admission?.student?.name.toLowerCase().includes(search.toLowerCase()) ||
    c.admission?.student?.enrollmentNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      
      <div className="page-header">
        <div>
          <h2>Certificates</h2>
          <p>Manage course completion certificates</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ admissionId: 0, issueDate: new Date().toISOString().split('T')[0], grade: 'A+' }); setShowModal(true); }}>
          <FiPlus /> Issue Certificate
        </button>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-filters">
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input placeholder="Search certificate # or student..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : filteredCerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <h3>No Certificates Found</h3>
            <p>Issue your first certificate to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Issue Certificate</button>
          </div>
        ) : (
          <>
            <div className="data-table-wrap pc-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Certificate #</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Grade</th>
                    <th>Issue Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCerts.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--text-accent)', fontWeight: 700 }}>{c.certificateNo}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.admission?.student?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.admission?.student?.enrollmentNo}</div>
                      </td>
                      <td><span className="badge badge-info">{c.admission?.course?.code}</span></td>
                      <td><span className="badge badge-success" style={{ fontWeight: 800 }}>{c.grade}</span></td>
                      <td>{c.issueDate}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => generatePDF(c)} title="Download PDF"><FiDownload /></button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-grid mobile-only">
              {filteredCerts.map((c: any) => (
                <div key={c.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-title">{c.admission?.student?.name}</div>
                      <div className="mobile-data-card-subtitle">{c.certificateNo}</div>
                    </div>
                    <span className="badge badge-success" style={{ fontWeight: 800 }}>{c.grade}</span>
                  </div>
                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Course</span>
                      <span className="mobile-data-card-value"><span className="badge badge-info">{c.admission?.course?.code}</span></span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Issue Date</span>
                      <span className="mobile-data-card-value">{c.issueDate}</span>
                    </div>
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Enrollment No</span>
                      <span className="mobile-data-card-value" style={{ color: 'var(--text-muted)' }}>{c.admission?.student?.enrollmentNo}</span>
                    </div>
                  </div>
                  <div className="mobile-data-card-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => generatePDF(c)} style={{ flex: 1 }}><FiDownload /> Download</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)', flex: 1 }}><FiTrash2 /> Revoke</button>
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
            <div className="modal-header">
              <h3>Issue New Certificate</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Completed Admission *</label>
                  <select className="form-control" required value={form.admissionId} onChange={e => setForm({ ...form, admissionId: Number(e.target.value) })}>
                    <option value="">Select Student (Completed Course)</option>
                    {admissions.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.student?.name} - {a.course?.name} ({a.student?.enrollmentNo})</option>
                    ))}
                  </select>
                  {admissions.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: 4 }}>
                      No students found with 'completed' status. Update admission status first.
                    </p>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input className="form-control" type="date" required value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Grade</label>
                    <select className="form-control" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B+">B+</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
                <div style={{ background: 'var(--info-bg)', padding: 16, borderRadius: 'var(--radius-md)', marginTop: 8 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiAward /> Certificate number will be auto-generated upon issuance.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={admissions.length === 0}>Issue Certificate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
