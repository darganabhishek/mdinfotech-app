'use client';
import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiDollarSign, FiClock, FiCheckCircle, FiFileText } from 'react-icons/fi';

export default function FeeManagementPage() {
  const [activeTab, setActiveTab] = useState('active'); // active, dropped, completed
  const [feesData, setFeesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  
  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAdm, setSelectedAdm] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', paymentMonth: '', reference: '', notes: '' });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryAdm, setSelectedHistoryAdm] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status: activeTab });
    const res = await fetch(`/api/fees?${params}`);
    if (res.ok) {
      setFeesData(await res.json());
    }
    setLoading(false);
  }, [search, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdm) return;
    
    const payload = {
      ...payForm,
      admissionId: selectedAdm.id,
      amount: Number(payForm.amount)
    };
    
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      showToast('success', 'Payment recorded successfully!');
      setShowPaymentModal(false);
      fetchData();
    } else {
      showToast('error', 'Failed to record payment');
    }
  };

  const openPaymentModal = (adm: any) => {
    let defaultAmount = adm.nextDueAmount > 0 ? adm.nextDueAmount : adm.remainingFee;
    if (defaultAmount === 0 && adm.remainingFee > 0) defaultAmount = adm.remainingFee;
    
    setSelectedAdm(adm);
    setPayForm({
      amount: defaultAmount.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      paymentMonth: '',
      reference: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const openHistoryModal = (adm: any) => {
    setSelectedHistoryAdm(adm);
    setShowHistoryModal(true);
  };

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div>
          <h2>Fee Management</h2>
          <p>Track student fees, installments, discounts, and generate receipts</p>
        </div>
      </div>

      <div className="data-card">
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
          {['active', 'dropped', 'completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--brand-blue)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--brand-blue)' : 'var(--text-muted)',
                fontWeight: activeTab === tab ? 700 : 500,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'dropped' ? 'Left Students' : `${tab} Students`}
            </button>
          ))}
        </div>

        <div className="data-card-header">
          <div className="data-card-filters" style={{ width: '100%' }}>
            <div className="search-input" style={{ maxWidth: 400 }}>
              <FiSearch className="search-icon" />
              <input placeholder="Search by name, roll no, or course..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : feesData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No Records Found</h3>
            <p>No fee records match your filters in this tab.</p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Net Payable</th>
                  <th>Total Paid</th>
                  <th>Remaining</th>
                  <th>Next Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feesData.map((adm: any) => {
                  let rowStyle = {};
                  const isFullyPaid = adm.isFeeCompleted;
                  
                  if (activeTab === 'active') {
                    if (isFullyPaid) rowStyle = { backgroundColor: 'rgba(0, 230, 118, 0.05)' }; // Light green
                  } else if (activeTab === 'completed') {
                    if (isFullyPaid) rowStyle = { backgroundColor: 'rgba(0, 230, 118, 0.05)' };
                    else rowStyle = { backgroundColor: 'rgba(255, 82, 82, 0.05)' }; // Light red
                  }

                  return (
                    <tr key={adm.id} style={rowStyle}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{adm.student.enrollmentNo}</td>
                      <td style={{ fontWeight: 600 }}>{adm.student.name}</td>
                      <td>
                        <span className="badge badge-info">{adm.course.code}</span>
                        {adm.paymentPlan === 'monthly' && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            ₹{adm.installmentAmount}/mo x {adm.installmentsCount}
                          </div>
                        )}
                      </td>
                      <td>
                        ₹{adm.netFee.toLocaleString()}
                        {adm.discount > 0 && <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--success)' }}>(-₹{adm.discount})</span>}
                      </td>
                      <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{adm.totalPaid.toLocaleString()}</td>
                      <td style={{ color: adm.remainingFee > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                        ₹{adm.remainingFee.toLocaleString()}
                      </td>
                      
                      <td>
                        {adm.remainingFee === 0 ? (
                          <span style={{ color: 'var(--success)' }}><FiCheckCircle /> Cleared</span>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600 }}>₹{adm.nextDueAmount.toLocaleString()}</div>
                            {adm.nextDueDate && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><FiClock /> {new Date(adm.nextDueDate).toLocaleDateString()}</div>}
                          </div>
                        )}
                      </td>
                      
                      <td>
                        {isFullyPaid ? (
                          <span className="badge badge-success">Fee Completed</span>
                        ) : (
                          <span className={`badge ${adm.nextDueAmount > 0 ? 'badge-warning' : 'badge-active'}`}>
                            {adm.nextDueAmount > 0 ? 'Due Pending' : 'Ongoing'}
                          </span>
                        )}
                      </td>
                      
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="btn btn-outline btn-sm btn-icon" title="View History" onClick={() => openHistoryModal(adm)}>
                            <FiFileText />
                          </button>
                          {!isFullyPaid && (
                            <button className="btn btn-primary btn-sm" onClick={() => openPaymentModal(adm)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiDollarSign /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPaymentModal && selectedAdm && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment - {selectedAdm.student.name}</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            
            <div style={{ background: 'var(--bg-card-hover)', padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Net Payable</div>
                <div style={{ fontWeight: 600 }}>₹{selectedAdm.netFee.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Total Paid</div>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>₹{selectedAdm.totalPaid.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)' }}>Remaining Fee</div>
                <div style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{selectedAdm.remainingFee.toLocaleString()}</div>
              </div>
            </div>
            
            <form onSubmit={handlePaySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" className="form-control" required value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Mode *</label>
                    <select className="form-control" required value={payForm.paymentMode} onChange={e => setPayForm({...payForm, paymentMode: e.target.value})}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / Online</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input type="date" className="form-control" required value={payForm.paymentDate} onChange={e => setPayForm({...payForm, paymentDate: e.target.value})} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Month (Optional)</label>
                    <input type="text" className="form-control" placeholder="e.g. Jan 2026" value={payForm.paymentMonth} onChange={e => setPayForm({...payForm, paymentMonth: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Reference No. (Optional)</label>
                    <input type="text" className="form-control" value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows={2} value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})}></textarea>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiDollarSign /> Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && selectedHistoryAdm && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment History - {selectedHistoryAdm.student.name}</h3>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: 0 }}>
              {selectedHistoryAdm.payments && selectedHistoryAdm.payments.length > 0 ? (
                <div className="data-table-wrap" style={{ border: 'none' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Receipt No</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Target Month</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistoryAdm.payments.map((payment: any) => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600 }}>{payment.receiptNo}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{payment.amount.toLocaleString()}</td>
                          <td style={{ textTransform: 'capitalize' }}>{payment.paymentMode}</td>
                          <td>{payment.paymentMonth || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                          <td style={{ textAlign: 'right' }}>
                            <a href={`/dashboard/receipts/${payment.id}`} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FiFileText /> View Receipt
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No payment history recorded for this student.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
