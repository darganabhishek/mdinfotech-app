'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FiUser, FiBook, FiActivity, FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

export default function StudentDetailsPage() {
  const params = useParams();
  const studentId = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${studentId}/details`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>Student not found</h3></div>;

  return (
    <div className="student-profile">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="user-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>{data.name?.charAt(0)}</div>
          <div>
            <h2>{data.name}</h2>
            <p>Enrollment: {data.enrollmentNo} • {data.phone}</p>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon blue"><FiActivity /></div></div>
          <div className="kpi-value">{data.attendancePercentage}%</div>
          <div className="kpi-label">Final Attendance</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon green"><FiCheckCircle /></div></div>
          <div className="kpi-value">₹{data.totalPaid?.toLocaleString()}</div>
          <div className="kpi-label">Total Paid Fees</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-header"><div className="kpi-icon purple"><FiAlertCircle /></div></div>
          <div className="kpi-value">₹{data.balanceDue?.toLocaleString()}</div>
          <div className="kpi-label">Balance Outstanding</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="data-card">
          <div className="data-card-header"><h3>Courses & Progress</h3></div>
          <div style={{ padding: 20 }}>
            {data.admissions?.map((adm: any) => (
              <div key={adm.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{adm.course.name}</div>
                  <span className={`badge badge-${adm.status}`}>{adm.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Batch: {adm.batch?.name || 'Unassigned'}
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                   <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                        <span>Syllabus Covered</span>
                        <span>{adm.progress}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--primary)', width: `${adm.progress}%` }} />
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header"><h3>Recent Assignments</h3></div>
          <div style={{ padding: 20 }}>
            {data.submissions?.length > 0 ? (
              data.submissions.map((sub: any) => (
                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.assignment.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topic: {sub.assignment.topic?.name || 'General'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success">Submitted</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Score: {sub.marks || 'Pending'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No assignments submitted yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
