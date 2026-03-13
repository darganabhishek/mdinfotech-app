'use client';

import { useState, useEffect } from 'react';
import { FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PayrollPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payroll').then(r => r.json()).then(setData).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>No Payroll Data</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>Payroll Dashboard</h2><p>Automated salary calculations for active faculty.</p></div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon blue"><FiDollarSign /></div></div>
          <div className="kpi-value">{data.summary.totalFaculty}</div>
          <div className="kpi-label">Active Faculty</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon green"><FiDollarSign /></div></div>
          <div className="kpi-value">₹{data.summary.totalMonthlySalary?.toLocaleString()}</div>
          <div className="kpi-label">Monthly Payroll</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon orange"><FiDollarSign /></div></div>
          <div className="kpi-value">₹{data.summary.totalAnnualSalary?.toLocaleString()}</div>
          <div className="kpi-label">Annual Payroll</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-header"><div className="kpi-icon purple"><FiDollarSign /></div></div>
          <div className="kpi-value">₹{data.summary.avgSalary?.toLocaleString()}</div>
          <div className="kpi-label">Avg. Salary</div>
        </div>
      </div>

      <div className="data-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Faculty</th><th>Specialization</th><th>Batches</th><th>Monthly Salary</th><th>Annual Cost</th></tr></thead>
            <tbody>
              {data.faculty.map((f: any) => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.email}</div>
                  </td>
                  <td>{f.specialization || '—'}</td>
                  <td>{f.batches.length > 0 ? f.batches.map((b: any) => b.name).join(', ') : '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-accent)' }}>₹{f.salary?.toLocaleString()}</td>
                  <td>₹{(f.salary * 12)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
