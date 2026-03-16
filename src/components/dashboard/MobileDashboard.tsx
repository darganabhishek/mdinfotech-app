'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiUsers, FiUserPlus, FiDollarSign, FiBookOpen, FiClock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

interface MobileDashboardProps {
  data: any;
}

export default function MobileDashboard({ data }: MobileDashboardProps) {
  const isFaculty = data?.isFaculty;
  const isStudent = data?.isStudent;

  return (
    <div className="mobile-dashboard">
      <div className="screen-header">
        <h2 className="screen-title">Welcome back{isStudent ? `, ${data?.studentName?.split(' ')[0]}` : ''}!</h2>
        <p className="screen-subtitle">Here's your overview for today</p>
      </div>

      {/* Primary KPI Horizontal Scroll */}
      <div className="scroll-x" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, margin: '0 -16px 20px', paddingLeft: 16, paddingRight: 16 }}>
        {isFaculty ? (
          <>
            <QuickStatCard icon={FiBookOpen} value={data?.myBatches || 0} label="My Batches" color="#7c8dff" />
            <QuickStatCard icon={FiUsers} value={data?.totalStudents || 0} label="My Students" color="#00e676" />
            <QuickStatCard icon={FiClock} value={data?.todaysClasses?.length || 0} label="Classes" color="#ffab40" />
          </>
        ) : isStudent ? (
          <>
            <QuickStatCard icon={FiBookOpen} value={data?.activeAdmissions || 0} label="My Courses" color="#7c8dff" />
            <QuickStatCard icon={FiDollarSign} value={`₹${(data?.totalPaid || 0).toLocaleString()}`} label="Total Paid" color="#00e676" />
            <QuickStatCard icon={FiAlertCircle} value={`₹${(data?.pendingFees || 0).toLocaleString()}`} label="Balance" color="#ff6f60" />
          </>
        ) : (
          <>
            <QuickStatCard icon={FiUsers} value={data?.totalStudents || 0} label="Students" color="#7c8dff" />
            <QuickStatCard icon={FiUserPlus} value={data?.activeAdmissions || 0} label="Admissions" color="#00e676" />
            {data?.canViewFinances && (
              <>
                <QuickStatCard icon={FiDollarSign} value={`₹${((data?.totalRevenue || 0) / 1000).toFixed(0)}K`} label="Revenue" color="#ffab40" />
                <QuickStatCard icon={FiAlertCircle} value={`₹${((data?.pendingFees || 0) / 1000).toFixed(0)}K`} label="Due" color="#ff6f60" />
              </>
            )}
          </>
        )}
      </div>

      {/* Priority Section */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
          {isFaculty ? "📅 Today's Schedule" : isStudent ? "📚 My Courses" : "📋 Recent Admissions"}
        </h3>
        <Link href={isFaculty ? "/dashboard/attendance" : isStudent ? "/dashboard/student" : "/dashboard/admissions"} style={{ fontSize: '14px', color: 'var(--brand-blue-light)', fontWeight: 600 }}>
          View All
        </Link>
      </div>

      <StackList emptyMessage={isFaculty ? "No classes scheduled for today" : isStudent ? "No active courses found" : "No recent admissions"}>
        {isFaculty ? (
          data?.todaysClasses?.map((cls: any) => (
            <MobileCard 
              key={cls.id} 
              title={cls.batch?.name} 
              subtitle={`${cls.startTime} - ${cls.endTime}`}
              badge={{ text: cls.room || 'Room 1', type: 'info' }}
            >
              <div style={{ fontSize: '13px' }}>{cls.batch?.course?.name}</div>
            </MobileCard>
          ))
        ) : isStudent ? (
          data?.courses?.map((course: any) => (
            <MobileCard 
              key={course.id} 
              title={course.name} 
              subtitle={course.timing || 'Self-paced'}
              badge={{ text: course.status, type: course.status === 'active' ? 'success' : 'info' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px' }}>Paid: ₹{course.paid?.toLocaleString()}</span>
                <span style={{ color: course.balance > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                  Bal: ₹{course.balance?.toLocaleString()}
                </span>
              </div>
            </MobileCard>
          ))
        ) : (
          data?.recentAdmissions?.map((adm: any) => (
            <MobileCard 
              key={adm.id} 
              title={adm.student?.name} 
              subtitle={adm.admissionDate}
              badge={{ text: adm.status, type: adm.status === 'active' ? 'success' : 'info' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{adm.course?.code}</span>
                <FiArrowRight style={{ opacity: 0.5 }} />
              </div>
            </MobileCard>
          ))
        )}
      </StackList>

      {/* Notices for Student */}
      {isStudent && data?.recentNotices?.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>🔔 Important Notices</h3>
            <Link href="/dashboard/notices" style={{ fontSize: '14px', color: 'var(--brand-blue-light)', fontWeight: 600 }}>View All</Link>
          </div>
          <StackList>
            {data?.recentNotices?.map((notice: any) => (
              <MobileCard key={notice.id} title={notice.title} subtitle={new Date(notice.createdAt).toLocaleDateString()}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {notice.content}
                </div>
                {notice.fileUrl && <div className="badge badge-info" style={{ fontSize: '10px' }}>Attachment Available</div>}
              </MobileCard>
            ))}
          </StackList>
        </div>
      )}

      {/* Secondary Section: Payments or Enrolments */}
      {!isFaculty && data?.canViewFinances && (
        <div style={{ marginTop: 32 }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>💰 Recent Payments</h3>
          </div>
          <StackList>
            {data?.recentPayments?.map((pay: any) => (
              <MobileCard key={pay.id} title={pay.admission?.student?.name} subtitle={pay.paymentDate}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pay.receiptNo}</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '16px' }}>₹{pay.amount?.toLocaleString()}</span>
                </div>
              </MobileCard>
            ))}
          </StackList>
        </div>
      )}
    </div>
  );
}

function QuickStatCard({ icon: Icon, value, label, color }: any) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 16,
      padding: '16px',
      minWidth: 140,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 10, 
        background: `${color}15`, 
        color: color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '20px'
      }}>
        <Icon />
      </div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 800 }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}
