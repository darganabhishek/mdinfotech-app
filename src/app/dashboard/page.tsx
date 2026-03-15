'use client';

import { useEffect, useState } from 'react';
import { FiUsers, FiUserPlus, FiDollarSign, FiBookOpen, FiTrendingUp, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface DashboardData {
  isTeacher?: boolean;
  canViewFinances?: boolean;
  totalStudents?: number;
  activeAdmissions?: number;
  totalRevenue?: number;
  pendingFees?: number;
  totalCourses?: number;
  totalEnquiries?: number;
  recentPayments?: any[];
  recentAdmissions?: any[];
  courseStats?: { name: string; count: number }[];
  revenueTrend?: { month: string; amount: number }[];
  myBatches?: number;
  todaysClasses?: any[];
  timetable?: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" style={{ width: 40, height: 40 }} /><p>Loading dashboard...</p></div>;
  }

  if (data?.isTeacher) {
    return (
      <>
      {/* Faculty KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card blue">
            <div className="kpi-header">
              <div className="kpi-icon blue"><FiBookOpen /></div>
            </div>
            <div className="kpi-value">{data?.myBatches || 0}</div>
            <div className="kpi-label">My Active Batches</div>
          </div>

          <div className="kpi-card green">
            <div className="kpi-header">
              <div className="kpi-icon green"><FiUsers /></div>
            </div>
            <div className="kpi-value">{data?.totalStudents || 0}</div>
            <div className="kpi-label">My Students</div>
          </div>

          <div className="kpi-card orange">
            <div className="kpi-header">
              <div className="kpi-icon orange"><FiClock /></div>
            </div>
            <div className="kpi-value">{data?.todaysClasses?.length || 0}</div>
            <div className="kpi-label">Today's Classes</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="data-card">
            <div className="data-card-header">
              <h3>📅 Today's Schedule</h3>
            </div>
            <div className="data-table-wrap">
              {data?.todaysClasses && data.todaysClasses.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Batch</th>
                      <th>Course</th>
                      <th>Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todaysClasses.map((cls: any) => (
                      <tr key={cls.id}>
                        <td style={{ fontWeight: 600 }}>{cls.startTime} - {cls.endTime}</td>
                        <td style={{ color: 'var(--brand-blue)' }}>{cls.batch?.name}</td>
                        <td>{cls.batch?.course?.code}</td>
                        <td><span className="badge badge-info">{cls.room || 'TBD'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-icon">🎉</div>
                  <h3>No Classes Today</h3>
                  <p>Enjoy your free time or prepare for next classes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header">
            <div className="kpi-icon blue"><FiUsers /></div>
          </div>
          <div className="kpi-value">{data?.totalStudents || 0}</div>
          <div className="kpi-label">Total Students</div>
          <div className="kpi-trend up">↑ Active</div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <div className="kpi-icon green"><FiUserPlus /></div>
          </div>
          <div className="kpi-value">{data?.activeAdmissions || 0}</div>
          <div className="kpi-label">Active Admissions</div>
          <div className="kpi-trend up">↑ Current</div>
        </div>

        {data?.canViewFinances && (
          <>
            <div className="kpi-card orange">
              <div className="kpi-header">
                <div className="kpi-icon orange"><FiDollarSign /></div>
              </div>
              <div className="kpi-value">₹{((data?.totalRevenue || 0) / 1000).toFixed(1)}K</div>
              <div className="kpi-label">Total Revenue</div>
              <div className="kpi-trend up">↑ Collected</div>
            </div>

            <div className="kpi-card red">
              <div className="kpi-header">
                <div className="kpi-icon red"><FiAlertCircle /></div>
              </div>
              <div className="kpi-value">₹{((data?.pendingFees || 0) / 1000).toFixed(1)}K</div>
              <div className="kpi-label">Pending Fees</div>
              <div className="kpi-trend down">⏳ Due</div>
            </div>
          </>
        )}

        <div className="kpi-card purple">
          <div className="kpi-header">
            <div className="kpi-icon purple"><FiBookOpen /></div>
          </div>
          <div className="kpi-value">{data?.totalCourses || 0}</div>
          <div className="kpi-label">Active Courses</div>
        </div>

        <div className="kpi-card teal">
          <div className="kpi-header">
            <div className="kpi-icon teal"><FiClock /></div>
          </div>
          <div className="kpi-value">{data?.totalEnquiries || 0}</div>
          <div className="kpi-label">Total Enquiries</div>
        </div>
      </div>

      {/* Main Charts & Activity */}
      {(data?.canViewFinances) && (
        <div className="charts-grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, marginBottom: 28 }}>
          <div className="data-card">
            <div className="data-card-header"><h3>📈 Revenue Analytics (Last 6 Months)</h3></div>
            <div style={{ padding: '30px 24px', height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 12 }}>
              {(data as any)?.revenueTrend?.map((t: any, i: number) => {
                const max = Math.max(...(data as any).revenueTrend.map((r: any) => r.amount || 1));
                const height = (t.amount / max) * 200;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>₹{t.amount.toLocaleString()}</div>
                    <div className="chart-bar" style={{ 
                      width: '100%', 
                      height: Math.max(8, height), 
                      background: 'var(--gradient-brand)', 
                      borderRadius: '6px 6px 0 0', 
                      opacity: 0.85,
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 12, fontWeight: 600 }}>{t.month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header"><h3>💰 Recent Payments</h3></div>
            <div className="data-table-wrap">
              <table className="data-table">
                <tbody>
                  {data?.recentPayments?.map((pay: any) => (
                    <tr key={pay.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{pay.admission?.student?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.receiptNo}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--success)', fontWeight: 700 }}>₹{pay.amount?.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.paymentDate}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="data-card">
          <div className="data-card-header">
            <h3>📋 Recent Admissions</h3>
          </div>
          <div className="data-table-wrap">
            {data?.recentAdmissions && data.recentAdmissions.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAdmissions.map((adm: any) => (
                    <tr key={adm.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{adm.student?.name}</td>
                      <td>{adm.course?.code}</td>
                      <td>{adm.admissionDate}</td>
                      <td><span className={`badge badge-${adm.status === 'active' ? 'active' : 'info'}`}>{adm.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📝</div>
                <h3>No Admissions Yet</h3>
                <p>Create your first admission to see it here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Stats */}
      {data?.courseStats && data.courseStats.length > 0 && (
        <div className="data-card">
          <div className="data-card-header">
            <h3>📊 Course-wise Enrollments</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {data.courseStats.map((cs: any, i: number) => {
                const colors = ['#5c6bc0', '#e53935', '#00e676', '#ffab40', '#b388ff', '#64ffda', '#ff6f60', '#ffc107'];
                return (
                  <div key={i} style={{
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    borderLeft: `3px solid ${colors[i % colors.length]}`
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: colors[i % colors.length] }}>{cs.count}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{cs.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
