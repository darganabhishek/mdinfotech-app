'use client';
import { useEffect, useState } from 'react';
import { FiSearch, FiFileText, FiDownload } from 'react-icons/fi';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReceiptsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/payments?limit=100')
      .then(res => res.json())
      .then(data => { setPayments(data.payments || []); setLoading(false); });
  }, []);

  const generatePDF = (payment: any) => {
    const doc = new jsPDF();
    const instName = "M.D. INFOTECH";
    doc.setFontSize(22); doc.text(instName, 105, 20, { align: 'center' });
    doc.setFontSize(10); doc.text("Fee Receipt", 105, 30, { align: 'center' });
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(11);
    doc.text(`Receipt No: ${payment.receiptNo}`, 20, 45);
    doc.text(`Date: ${payment.paymentDate}`, 190, 45, { align: 'right' });
    doc.text(`Student: ${payment.admission?.student?.name}`, 20, 55);
    doc.text(`Course: ${payment.admission?.course?.name}`, 20, 62);

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Amount']],
      body: [[`Fees for ${payment.admission?.course?.code}`, `INR ${payment.amount.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Receipt_${payment.receiptNo}.pdf`);
  };

  const filtered = payments.filter(p => 
    p.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    p.admission?.student?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div><h2>Receipt History</h2><p>Quick access to all issued fee receipts</p></div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div className="data-card-filters">
            <div className="search-input"><FiSearch className="search-icon" /><input placeholder="Search receipt # or student..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </div>

        {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : (
          <>
            <div className="data-table-wrap pc-only">
              <table className="data-table">
                <thead><tr><th>Receipt #</th><th>Student</th><th>Amount</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-accent)', fontWeight: 700 }}>{p.receiptNo}</td>
                      <td>{p.admission?.student?.name}</td>
                      <td style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString()}</td>
                      <td>{p.paymentDate}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link href={`/dashboard/receipts/${p.id}`} className="btn btn-outline btn-sm"><FiFileText /> View</Link>
                          <button onClick={() => generatePDF(p)} className="btn btn-outline btn-sm"><FiDownload /> PDF</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-grid mobile-only">
              {filtered.map((p: any) => (
                <div key={p.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div>
                      <div className="mobile-data-card-title">{p.admission?.student?.name}</div>
                      <div className="mobile-data-card-subtitle">{p.receiptNo}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>₹{p.amount.toLocaleString()}</div>
                  </div>
                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Date</span>
                      <span className="mobile-data-card-value">{p.paymentDate}</span>
                    </div>
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Course</span>
                      <span className="mobile-data-card-value"><span className="badge badge-info">{p.admission?.course?.code}</span></span>
                    </div>
                  </div>
                  <div className="mobile-data-card-actions">
                    <Link href={`/dashboard/receipts/${p.id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}><FiFileText /> View</Link>
                    <button onClick={() => generatePDF(p)} className="btn btn-outline btn-sm" style={{ flex: 1 }}><FiDownload /> PDF</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
