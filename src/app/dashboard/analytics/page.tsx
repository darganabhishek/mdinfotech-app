'use client';

import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiUsers, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/profitability').then(r => r.json()).then(setData).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>No Analytics Data</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>Time Slot Profitability & Analytics</h2><p>Revenue analysis per time slot with collection rates.</p></div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon green"><FiDollarSign /></div></div>
          <div className="kpi-value">₹{data.summary.totalRevenue?.toLocaleString()}</div>
          <div className="kpi-label">Total Revenue Collected</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon blue"><FiTrendingUp /></div></div>
          <div className="kpi-value">₹{data.summary.totalExpected?.toLocaleString()}</div>
          <div className="kpi-label">Total Fee Expected</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon orange"><FiBarChart2 /></div></div>
          <div className="kpi-value">{data.summary.overallCollectionRate}%</div>
          <div className="kpi-label">Overall Collection Rate</div>
        </div>
      </div>

      <div className="data-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Time Slot / Batch</th><th>Students</th><th>Revenue</th><th>Expected</th><th>Collection %</th><th>Active Batches</th></tr></thead>
            <tbody>
              {data.courses.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.code}</div>
                  </td>
                  <td>{c.totalStudents}</td>
                  <td style={{ fontWeight: 600, color: 'var(--brand-green)' }}>₹{c.totalRevenue?.toLocaleString()}</td>
                  <td>₹{c.totalFeeExpected?.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: 'var(--bg-body)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${c.collectionRate}%`, height: '100%', background: c.collectionRate >= 80 ? 'var(--brand-green)' : c.collectionRate >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: '4px', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.collectionRate}%</span>
                    </div>
                  </td>
                  <td>{c.activeBatches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
