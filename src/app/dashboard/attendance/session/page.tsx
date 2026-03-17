'use client';

import { useState, useEffect, useRef } from 'react';
import { FiPlay, FiSquare, FiUsers, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileAttendanceSession from '@/components/attendance/MobileAttendanceSession';

export default function AttendanceSessionPage() {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchData = async () => {
    try {
      const tsRes = await fetch('/api/timeslots');
      setTimeSlots(await tsRes.json());
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const startSession = async (timeSlotId?: string) => {
    const tsId = timeSlotId || selectedTimeSlot;
    if (!tsId) { toast.error('Select a time slot'); return; }

    // Get current GPS
    let lat = 0, lng = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch { /* GPS optional for faculty */ }

    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlotId: tsId, latitude: lat, longitude: lng }),
      });
      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        toast.success(`Session for ${session.timeSlot?.label || session.timeSlot?.startTime} started!`);
        startQrRefresh(session.id);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  const startQrRefresh = (sessionId: number) => {
    const fetchQr = async () => {
      try {
        const res = await fetch(`/api/attendance/session/${sessionId}/qr`);
        if (res.ok) setQrData(await res.json());
      } catch { /* silent */ }
    };
    fetchQr();
    timerRef.current = setInterval(fetchQr, 10000); // 10s refresh for stability
  };

  const endSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveSession(null);
    setQrData(null);
    toast.success('Session ended');
  };

  // Helper to check if slot is currently active
  const isSlotActiveNow = (slot: any) => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const [sH, sM] = slot.startTime.split(':').map(Number);
    const [eH, eM] = slot.endTime.split(':').map(Number);
    return currentMins >= (sH * 60 + sM - 15) && currentMins <= (eH * 60 + eM + 15);
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  const activeSlots = timeSlots.filter(isSlotActiveNow);

  if (isMobile) {
    return (
      <MobileAttendanceSession 
        timeSlots={activeSlots}
        activeSession={activeSession}
        qrData={qrData}
        onStart={startSession}
        onEnd={endSession}
      />
    );
  }
  

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📡 Start Attendance Session</h2>
          <p>Generate a live QR code for students to scan. QR refreshes every 10-30 seconds.</p>
        </div>
      </div>

      {!activeSession ? (
        <div className="data-card" style={{ padding: '24px', maxWidth: '600px' }}>
          <div className="form-group">
            <label>Select Time Slot *</label>
            <select className="form-control" value={selectedTimeSlot} onChange={e => setSelectedTimeSlot(e.target.value)}>
              <option value="">Choose a time slot...</option>
              {activeSlots.length > 0 && (
                <optgroup label="🔥 Ongoing Right Now">
                  {activeSlots.map((ts: any) => (
                    <option key={`active-${ts.id}`} value={ts.id}>
                      🟢 {ts.label} ({ts.startTime} - {ts.endTime})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="All Time Slots">
                {timeSlots.map((ts: any) => (
                  <option key={ts.id} value={ts.id}>
                    {isSlotActiveNow(ts) ? '🟢' : '⚪'} {ts.label} ({ts.startTime} - {ts.endTime})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>Note:</strong> Multiple batches scheduled for this time slot will be able to scan this QR code.
              </p>
          </div>

          <button className="btn btn-primary" onClick={() => startSession()} style={{ width: '100%', marginTop: '20px', height: '50px', fontSize: '1.1rem' }}>
            <FiPlay /> Start Session & Generate QR
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className="data-card" style={{ padding: '32px', display: 'inline-block', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
              {qrData?.timeSlotName || activeSession?.timeSlot?.label}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Show this QR to the class. Students from all batches in this time slot can scan.
            </p>

            {qrData?.qr ? (
              <div>
                <img src={qrData.qr} alt="QR Code" style={{ width: '300px', height: '300px', borderRadius: '12px', border: '3px solid var(--brand-blue-light)', padding: '10px', background: '#fff' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                  <div className="kpi-card blue" style={{ padding: '12px 20px', minWidth: 'auto' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{qrData.secondsLeft}s</div>
                    <div style={{ fontSize: '0.7rem' }}>Time Remaining</div>
                  </div>
                  <div className="kpi-card green" style={{ padding: '12px 20px', minWidth: 'auto' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}><FiUsers /> {qrData.attendanceCount}</div>
                    <div style={{ fontSize: '0.7rem' }}>Attendance Marked</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-spinner" />
            )}

            <button className="btn btn-outline" onClick={endSession} style={{ marginTop: '24px', color: 'var(--danger)', width: '100%' }}>
              <FiSquare /> End Active Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
