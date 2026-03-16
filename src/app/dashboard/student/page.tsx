'use client';

import { useState, useEffect } from 'react';
import { FiBook, FiCalendar, FiDollarSign, FiFileText, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');

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

  const handlePaytmPayment = async (course: any) => {
    const amount = prompt(`Enter amount to pay for ${course.name} (Max ₹${course.balanceDue}):`, course.balanceDue);
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/payments/paytm/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: course.admissionId,
          amount: parseFloat(amount)
        })
      });

      if (res.ok) {
        const data = await res.json();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${data.mid}&orderId=${data.orderId}`;
        
        const txnIdInput = document.createElement('input');
        txnIdInput.type = 'hidden';
        txnIdInput.name = 'txnToken';
        txnIdInput.value = data.txnToken;
        form.appendChild(txnIdInput);

        document.body.appendChild(form);
        form.submit();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Payment failed to initiate');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
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

  const paymentStatus = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('payment') : null;

  return (
    <div className="student-dashboard">
      {paymentStatus === 'success' && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <FiCheckCircle /> Payment successful! Your balance will be updated shortly.
        </div>
      )}
      
      <div className="page-header">
        <div>
          <h2>Welcome, {stats.name}!</h2>
          <p>Enrollment: {stats.enrollmentNo} — Track your academic progress below.</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')}>Notice Board</button>
        <button className={`tab ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>Assignments</button>
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Jobs Portal</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card blue">
              <div className="kpi-header"><div className="kpi-icon blue"><FiBook /></div></div>
              <div className="kpi-value">{stats.totalCourses}</div>
              <div className="kpi-label">Courses</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-header"><div className="kpi-icon green"><FiCheckCircle /></div></div>
              <div className="kpi-value">{stats.attendancePercent}%</div>
              <div className="kpi-label">Attendance</div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-header"><div className="kpi-icon purple"><FiAlertCircle /></div></div>
              <div className="kpi-value">₹{stats.balanceDue?.toLocaleString()}</div>
              <div className="kpi-label">Balance Due</div>
            </div>
          </div>

          <h3 style={{ margin: '24px 0 12px', fontSize: '1.1rem', fontWeight: 700 }}>My Courses & Fees</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {stats.courses?.map((course: any, i: number) => (
              <div key={i} className="data-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{course.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.batchName}</div>
                  </div>
                  <span className={`badge badge-${course.status === 'active' ? 'active' : 'completed'}`}>{course.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Net Fee:</span> ₹{course.netFee?.toLocaleString()}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Paid:</span> ₹{course.paid?.toLocaleString()}</div>
                </div>
                {course.netFee > course.paid && (
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handlePaytmPayment({ ...course, balanceDue: course.netFee - course.paid })}>
                    <FiDollarSign /> Pay Online
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'notices' && (
        <div className="data-card">
          <div className="data-card-header"><h3>📢 Important Notices</h3></div>
          <div style={{ padding: '0 20px' }}>
            {stats.notices?.length > 0 ? (
              stats.notices.map((notice: any, i: number) => (
                <div key={i} style={{ padding: '20px 0', borderBottom: i === stats.notices.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h4 style={{ margin: 0 }}>{notice.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{notice.content}</p>
                  {notice.fileUrl && (
                    <a href={notice.fileUrl} target="_blank" className="btn btn-outline btn-sm"><FiFileText /> View Attachment</a>
                  )}
                  {notice.link && (
                    <a href={notice.link} target="_blank" className="btn btn-outline btn-sm" style={{ marginLeft: 8 }}><FiFileText /> Visit Link</a>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No notices yet.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {stats.assignments?.length > 0 ? (
            stats.assignments.reduce((acc: any, ass: any) => {
              const topicName = ass.topic?.name || 'General Assignments';
              if (!acc[topicName]) acc[topicName] = [];
              acc[topicName].push(ass);
              return acc;
            }, {} as any) && Object.entries(stats.assignments.reduce((acc: any, ass: any) => {
              const topicName = ass.topic?.name || 'General Assignments';
              if (!acc[topicName]) acc[topicName] = [];
              acc[topicName].push(ass);
              return acc;
            }, {})).map(([topic, items]: [any, any], i: number) => (
              <div key={i} className="data-card">
                <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{topic}</h3>
                  {items[0].isLocked && <span style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4 }}><FiClock /> Locked</span>}
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map((ass: any, idx: number) => (
                      <div key={idx} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', opacity: ass.isLocked ? 0.6 : 1, background: ass.isLocked ? 'var(--bg-secondary)' : 'transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>{ass.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due: {ass.dueDate}</div>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '0.85rem' }}>{ass.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Faculty: {ass.faculty.name}</span>
                          {!ass.isLocked && <button className="btn btn-outline btn-sm">Submit Assignment</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="data-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No assignments assigned yet.</div>
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {stats.jobs?.length > 0 ? (
            stats.jobs.map((job: any, i: number) => (
              <div key={i} className="data-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>New Career Opportunity</div>
                <h4 style={{ margin: '0 0 4px' }}>{job.title}</h4>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>{job.company} • {job.location}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.description}</p>
                {job.link && <a href={job.link} target="_blank" className="btn btn-primary btn-sm" style={{ width: '100%' }}>View Details & Apply</a>}
              </div>
            ))
          ) : (
            <div className="data-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No job listings available at the moment.</div>
          )}
        </div>
      )}
    </div>
  );
}
