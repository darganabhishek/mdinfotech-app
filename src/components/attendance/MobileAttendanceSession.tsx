'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiPlay, FiUsers, FiClock, FiSquare } from 'react-icons/fi';

interface MobileAttendanceSessionProps {
  timeSlots: any[];
  activeSession: any;
  qrData: any;
  onStart: (timeSlotId: string) => void;
  onEnd: () => void;
}

export default function MobileAttendanceSession({
  timeSlots,
  activeSession,
  qrData,
  onStart,
  onEnd
}: MobileAttendanceSessionProps) {
  
  if (activeSession) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div className="mobile-card" style={{ padding: '32px 16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: 4 }}>
            {qrData?.timeSlotName || activeSession.timeSlot?.label}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 24 }}>Session Active • Students scan now</p>

          <div style={{ 
            background: 'white', 
            padding: 16, 
            borderRadius: 20, 
            display: 'inline-block', 
            boxShadow: 'var(--shadow-lg)'
          }}>
            {qrData?.qr ? (
              <img src={qrData.qr} alt="QR" style={{ width: '240px', height: '240px', display: 'block' }} />
            ) : (
              <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner" />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-blue-light)' }}>{qrData?.secondsLeft || 0}s</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Expires in</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>{qrData?.attendanceCount || 0}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Marked</div>
            </div>
          </div>

          <button className="btn btn-danger btn-block" onClick={onEnd} style={{ marginTop: 24, height: 50 }}>
            <FiSquare /> End Active Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Start Attendance</h2>
        <p className="screen-subtitle">Select a time slot to generate a QR</p>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 12, marginTop: 24 }}>🔥 Ongoing Right Now</h3>
      <StackList emptyMessage="No ongoing time slots found">
        {timeSlots.map((ts: any) => (
          <MobileCard 
            key={ts.id} 
            title={ts.label} 
            subtitle={`${ts.startTime} - ${ts.endTime}`}
            badge={{ text: 'Ready', type: 'success' }}
            onClick={() => onStart(ts.id)}
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-blue-light)', fontWeight: 600, fontSize: '14px' }}>
                <FiPlay /> Tap to Start Session
              </div>
            }
          >
            <div style={{ fontSize: '13px' }}>Accepts students from multiple batches</div>
          </MobileCard>
        ))}
      </StackList>
    </div>
  );
}
