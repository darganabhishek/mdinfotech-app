'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiPrinter, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payments/${params.id}`)
      .then(res => res.json())
      .then(data => { setPayment(data); setLoading(false); });
  }, [params.id]);

  const generatePDF = () => {
    if (!payment) return;
    const doc = new jsPDF();
    const instName = "M.D. INFOTECH";
    const instAddr = "123 Tech Lane, Digital City, 54321";
    const instPhone = "+91 9876543210";

    // Header
    doc.setFontSize(22); doc.setTextColor(40, 44, 52);
    doc.text(instName, 105, 20, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(instAddr, 105, 27, { align: 'center' });
    doc.text(`Phone: ${instPhone}`, 105, 32, { align: 'center' });
    
    doc.setDrawColor(200); doc.line(20, 38, 190, 38);

    doc.setFontSize(16); doc.setTextColor(0);
    doc.text("FEE RECEIPT", 105, 48, { align: 'center' });

    // Receipt Info
    doc.setFontSize(11);
    doc.text(`Receipt No: ${payment.receiptNo}`, 20, 60);
    doc.text(`Date: ${payment.paymentDate}`, 190, 60, { align: 'right' });

    // Student Info
    doc.setFillColor(245, 247, 250); doc.rect(20, 65, 170, 25, 'F');
    doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text("Student Details:", 25, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${payment.admission?.student?.name}`, 25, 78);
    doc.text(`Enrollment: ${payment.admission?.student?.enrollmentNo}`, 25, 84);
    doc.text(`Course: ${payment.admission?.course?.name}`, 105, 84);

    // Table
    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Amount']],
      body: [
        [`Fees for ${payment.admission?.course?.name}`, `INR ${payment.amount.toLocaleString()}`],
        ['Payment Method', payment.paymentMode.toUpperCase()],
        ['Reference / Txn ID', payment.reference || 'N/A']
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Paid: INR ${payment.amount.toLocaleString()}`, 190, finalY, { align: 'right' });

    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", 190, finalY + 40, { align: 'right' });
    doc.setDrawColor(200); doc.line(150, finalY + 35, 190, finalY + 35);

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text("This is a computer generated receipt and does not require a physical signature.", 105, 285, { align: 'center' });

    doc.save(`Receipt_${payment.receiptNo}.pdf`);
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!payment) return <div>Not found</div>;

  return (
    <div className="receipt-container">
      <div className="receipt-actions no-print">
        <button onClick={() => router.back()} className="btn btn-outline"><FiArrowLeft /> Back</button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => window.print()} className="btn btn-outline"><FiPrinter /> Print</button>
          <button onClick={generatePDF} className="btn btn-primary"><FiDownload /> Download PDF</button>
        </div>
      </div>

      <div className="receipt-paper" id="receipt-content">
        <div className="receipt-header">
          <img src="/logo.png" alt="Logo" style={{ height: 80, objectFit: 'contain', background: 'white', padding: '12px 20px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <div className="receipt-title">FEE RECEIPT</div>
        </div>

        <div className="receipt-meta">
          <div><strong>Receipt No:</strong> {payment.receiptNo}</div>
          <div><strong>Date:</strong> {payment.paymentDate}</div>
        </div>

        <div className="receipt-info-grid">
          <div className="info-item"><label>Student Name</label><div>{payment.admission?.student?.name}</div></div>
          <div className="info-item"><label>Enrollment No</label><div>{payment.admission?.student?.enrollmentNo}</div></div>
          <div className="info-item"><label>Course</label><div>{payment.admission?.course?.name} ({payment.admission?.course?.code})</div></div>
          <div className="info-item"><label>Payment Mode</label><div style={{ textTransform: 'uppercase' }}>{payment.paymentMode}</div></div>
        </div>

        <table className="receipt-table">
          <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody>
            <tr><td>Course Fees Payment</td><td style={{ textAlign: 'right' }}>₹{payment.amount?.toLocaleString() || '0'}</td></tr>
            {payment.reference && (
              <tr><td><small style={{ color: 'var(--text-muted)' }}>Reference: {payment.reference}</small></td><td></td></tr>
            )}
          </tbody>
          <tfoot>
            <tr><td><strong>Total Amount Paid</strong></td><td style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 800 }}>₹{payment.amount?.toLocaleString() || '0'}</td></tr>
          </tfoot>
        </table>

        <div className="receipt-footer">
          <div className="signature-box"><div className="signature-line" />Authorized Signatory</div>
          <p>Thank you for your payment!</p>
          <div className="watermark">M.D. INFOTECH</div>
        </div>
      </div>

      <style jsx>{`
        .receipt-container { max-width: 800px; margin: 2.5rem auto; padding: 0 1.5rem; }
        .receipt-actions { display: flex; justify-content: space-between; margin-bottom: 24px; gap: 12px; }
        .receipt-paper { background: white; padding: 60px; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); color: #333; position: relative; overflow: hidden; border: 1px solid #eee; }
        .receipt-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 24px; }
        .receipt-title { margin-top: 24px; font-weight: 800; font-size: 1.5rem; color: #000; letter-spacing: 4px; text-transform: uppercase; }
        .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 1.1rem; gap: 12px; }
        .receipt-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; background: #f9fafb; padding: 24px; border-radius: 8px; }
        .info-item label { display: block; font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 6px; font-weight: 700; letter-spacing: 0.5px; }
        .info-item div { font-weight: 600; font-size: 1.1rem; color: #111; }
        .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 60px; }
        .receipt-table th { text-align: left; padding: 16px 12px; border-bottom: 2px solid #333; font-size: 0.9rem; text-transform: uppercase; }
        .receipt-table td { padding: 18px 12px; border-bottom: 1px solid #f3f4f6; font-size: 1rem; }
        .receipt-table tfoot td { padding-top: 24px; border-bottom: none; }
        .receipt-footer { display: flex; flex-direction: column; align-items: flex-end; margin-top: 40px; }
        .signature-box { text-align: center; width: 220px; }
        .signature-line { border-top: 2px solid #333; margin-bottom: 12px; width: 100%; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 8rem; opacity: 0.03; font-weight: 900; pointer-events: none; white-space: nowrap; }
        
        @media (max-width: 640px) {
          .receipt-container { margin: 1rem auto; padding: 0 1rem; }
          .receipt-actions { flex-direction: column; }
          .receipt-actions > div { width: 100%; }
          .receipt-actions button { width: 100%; justify-content: center; }
          .receipt-paper { padding: 30px 20px; }
          .receipt-info-grid { grid-template-columns: 1fr; gap: 16px; padding: 16px; }
          .receipt-meta { flex-direction: column; align-items: flex-start; gap: 8px; font-size: 0.9rem; }
          .receipt-header h1 { font-size: 1.8rem; }
          .receipt-title { font-size: 1.2rem; letter-spacing: 2px; }
          .info-item div { font-size: 1rem; }
          .receipt-table th, .receipt-table td { padding: 12px 8px; font-size: 0.9rem; }
          .receipt-table tfoot td { font-size: 1rem; }
          .receipt-footer { align-items: center; width: 100%; }
          .signature-box { width: 100%; max-width: 250px; margin-top: 20px; }
        }

        @media print {
          .no-print { display: none; }
          body { background: white; }
          .receipt-container { max-width: 100%; margin: 0; padding: 0; }
          .receipt-paper { box-shadow: none; padding: 20px; border: none; }
        }
      `}</style>
    </div>
  );
}
