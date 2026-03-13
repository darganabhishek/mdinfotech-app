'use client';
import { useEffect, useState } from 'react';
import { FiDollarSign, FiUsers, FiTrendingUp, FiDownload } from 'react-icons/fi';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(res => res.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div><h2>Reports & Analytics</h2><p>Financial and enrollment reports</p></div>
      </div>

      {/* Revenue Summary */}
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon green"><FiDollarSign /></div></div>
          <div className="kpi-value">₹{((data?.totalRevenue || 0) / 1000).toFixed(1)}K</div>
          <div className="kpi-label">Total Revenue Collected</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-header"><div className="kpi-icon red"><FiTrendingUp /></div></div>
          <div className="kpi-value">₹{((data?.pendingFees || 0) / 1000).toFixed(1)}K</div>
          <div className="kpi-label">Total Pending Fees</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon blue"><FiUsers /></div></div>
          <div className="kpi-value">{data?.totalStudents || 0}</div>
          <div className="kpi-label">Total Students</div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="data-card" style={{ marginBottom: 28 }}>
        <div className="data-card-header"><h3>📈 Monthly Revenue Trend</h3></div>
        <div style={{ padding: 24, height: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 10 }}>
          {(data?.revenueTrend || []).map((t: any, i: number) => {
            const max = Math.max(...(data?.revenueTrend || []).map((r: any) => r.amount || 1));
            const height = (t.amount / max) * 180;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>₹{t.amount.toLocaleString()}</div>
                <div style={{ width: '100%', height: Math.max(5, height), background: 'var(--gradient-brand)', borderRadius: '4px 4px 0 0', transition: 'height 1s ease' }} />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8, whiteSpace: 'nowrap' }}>{t.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course-wise Report */}
      <div className="data-card" style={{ marginBottom: 28 }}>
        <div className="data-card-header"><h3>📊 Course-wise Enrollment</h3></div>
        <div className="data-table-wrap pc-only">
          <table className="data-table">
            <thead><tr><th>Course</th><th>Enrollments</th><th>Trend</th></tr></thead>
            <tbody>
              {(data?.courseStats || []).map((cs: any, i: number) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cs.name}</td>
                  <td style={{ fontWeight: 700, fontSize: '1.2rem' }}>{cs.count}</td>
                  <td style={{ width: '50%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (cs.count / Math.max(...(data?.courseStats || []).map((c: any) => c.count || 1))) * 100)}%`, height: '100%', background: 'var(--gradient-brand)', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cs.count} students</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-card-grid mobile-only">
          {(data?.courseStats || []).map((cs: any, i: number) => (
            <div key={i} className="mobile-data-card">
              <div className="mobile-data-card-header">
                <div className="mobile-data-card-title">{cs.name}</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{cs.count}</div>
              </div>
              <div className="mobile-data-card-body">
                <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                  <span className="mobile-data-card-label">Enrollment Trend</span>
                  <div style={{ marginTop: 8, height: 6, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (cs.count / Math.max(...(data?.courseStats || []).map((c: any) => c.count || 1))) * 100)}%`, height: '100%', background: 'var(--gradient-brand)', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Status Summary */}
      <div className="data-card">
        <div className="data-card-header"><h3>💰 Fee Collection Summary</h3></div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ background: 'var(--success-bg)', padding: 24, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>₹{(data?.totalRevenue || 0).toLocaleString()}</div>
              <div style={{ color: 'var(--success)', fontWeight: 600, marginTop: 4 }}>Total Collected</div>
            </div>
            <div style={{ background: 'var(--danger-bg)', padding: 24, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)' }}>₹{(data?.pendingFees || 0).toLocaleString()}</div>
              <div style={{ color: 'var(--danger)', fontWeight: 600, marginTop: 4 }}>Total Pending</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
