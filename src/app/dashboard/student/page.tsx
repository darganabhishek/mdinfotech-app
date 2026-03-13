'use client';

import { useState, useEffect } from 'react';
import { FiBook, FiCalendar, FiDollarSign, FiFileText, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/student/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎓</div>
        <h3>Student Portal</h3>
        <p>Your student profile is not linked yet. Please contact the admin to link your account.</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="page-header">
        <div>
          <h2>Welcome, {stats.name}!</h2>
          <p>Enrollment: {stats.enrollmentNo} — Track your academic progress below.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon blue"><FiBook /></div></div>
          <div className="kpi-value">{stats.totalCourses}</div>
          <div className="kpi-label">Enrolled Courses</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon green"><FiCheckCircle /></div></div>
          <div className="kpi-value">{stats.attendancePercent}%</div>
          <div className="kpi-label">Attendance Rate</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon orange"><FiDollarSign /></div></div>
          <div className="kpi-value">₹{stats.totalPaid?.toLocaleString()}</div>
          <div className="kpi-label">Total Paid</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-header"><div className="kpi-icon purple"><FiAlertCircle /></div></div>
          <div className="kpi-value">₹{stats.balanceDue?.toLocaleString()}</div>
          <div className="kpi-label">Balance Due</div>
        </div>
      </div>

      {/* Course Details */}
      <h3 style={{ margin: '24px 0 12px', fontSize: '1.1rem', fontWeight: 700 }}>My Courses</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {stats.courses?.map((course: any, i: number) => (
          <div key={i} className="data-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{course.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch: {course.batchName}</div>
              </div>
              <span className={`badge badge-${course.status === 'active' ? 'active' : 'completed'}`}>{course.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Fee:</span> ₹{course.netFee?.toLocaleString()}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Paid:</span> ₹{course.paid?.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Attendance */}
      {stats.recentAttendance?.length > 0 && (
        <>
          <h3 style={{ margin: '24px 0 12px', fontSize: '1.1rem', fontWeight: 700 }}>Recent Attendance</h3>
          <div className="data-card">
            <div className="data-table-wrap">
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr><th>Date</th><th>Batch</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {stats.recentAttendance.map((att: any, i: number) => (
                    <tr key={i}>
                      <td>{att.date}</td>
                      <td>{att.batchName}</td>
                      <td>
                        <span className={`badge ${att.status === 'present' ? 'badge-active' : att.status === 'late' ? 'badge-warning' : 'badge-inactive'}`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
