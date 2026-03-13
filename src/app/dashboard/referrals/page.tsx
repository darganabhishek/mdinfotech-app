'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiGift, FiCheck, FiClock, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    referrerStudentId: '', referredName: '', referredPhone: '', referredEmail: '', courseInterested: '', rewardAmount: '200', notes: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [refRes, stuRes] = await Promise.all([fetch('/api/referrals'), fetch('/api/students?page=1&search=&status=active')]);
      setReferrals(await refRes.json());
      const stuData = await stuRes.json();
      setStudents(stuData.students || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/referrals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success('Referral recorded!'); setModalOpen(false); fetchData(); }
      else { toast.error('Failed'); }
    } catch { toast.error('Network error'); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: 'badge-warning', enrolled: 'badge-active', rewarded: 'badge-active' };
    return <span className={`badge ${map[s] || 'badge-inactive'}`}>{s}</span>;
  };

  const totalRewards = referrals.reduce((s, r) => s + r.rewardAmount, 0);
  const paidRewards = referrals.filter(r => r.rewardPaid).reduce((s, r) => s + r.rewardAmount, 0);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>Referral Program</h2><p>Track and reward student referrals ({referrals.length} total)</p></div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><FiPlus /> New Referral</button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon blue"><FiGift /></div></div>
          <div className="kpi-value">{referrals.length}</div>
          <div className="kpi-label">Total Referrals</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon green"><FiCheck /></div></div>
          <div className="kpi-value">{referrals.filter(r => r.status === 'enrolled').length}</div>
          <div className="kpi-label">Enrolled</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon orange"><FiClock /></div></div>
          <div className="kpi-value">{referrals.filter(r => r.status === 'pending').length}</div>
          <div className="kpi-label">Pending</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-header"><div className="kpi-icon purple"><FiDollarSign /></div></div>
          <div className="kpi-value">₹{totalRewards.toLocaleString()}</div>
          <div className="kpi-label">Total Rewards</div>
        </div>
      </div>

      {referrals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎁</div>
          <h3>No Referrals Yet</h3>
          <p>Start tracking when students bring new admissions.</p>
        </div>
      ) : (
        <div className="data-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Referrer</th><th>Referred Person</th><th>Course</th><th>Status</th><th>Reward</th></tr></thead>
              <tbody>
                {referrals.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.referrerStudent?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.referrerStudent?.enrollmentNo}</div>
                    </td>
                    <td>
                      <div>{r.referredName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.referredPhone}</div>
                    </td>
                    <td>{r.courseInterested || '—'}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{ fontWeight: 600 }}>₹{r.rewardAmount?.toLocaleString()}{r.rewardPaid && <FiCheck style={{ color: 'var(--brand-green)', marginLeft: 4 }} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header"><h3>Record Referral</h3><button className="modal-close" onClick={() => setModalOpen(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Referring Student *</label>
                  <select className="form-control" required value={formData.referrerStudentId} onChange={e => setFormData({ ...formData, referrerStudentId: e.target.value })}>
                    <option value="">Select Student...</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNo})</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Referred Person Name *</label><input className="form-control" required value={formData.referredName} onChange={e => setFormData({ ...formData, referredName: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Phone</label><input className="form-control" value={formData.referredPhone} onChange={e => setFormData({ ...formData, referredPhone: e.target.value })} /></div>
                  <div className="form-group"><label>Email</label><input className="form-control" value={formData.referredEmail} onChange={e => setFormData({ ...formData, referredEmail: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Course Interested</label><input className="form-control" value={formData.courseInterested} onChange={e => setFormData({ ...formData, courseInterested: e.target.value })} /></div>
                  <div className="form-group"><label>Reward Amount ₹</label><input type="number" className="form-control" value={formData.rewardAmount} onChange={e => setFormData({ ...formData, rewardAmount: e.target.value })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Referral</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
