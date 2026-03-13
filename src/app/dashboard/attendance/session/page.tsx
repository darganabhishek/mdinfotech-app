'use client';

import { useState, useEffect, useRef } from 'react';
import { FiPlay, FiSquare, FiUsers, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AttendanceSessionPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, fRes] = await Promise.all([fetch('/api/batches'), fetch('/api/faculty')]);
      setBatches(await bRes.json());
      setFaculty(await fRes.json());
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const startSession = async () => {
    if (!selectedBatch || !selectedFaculty) { toast.error('Select batch and faculty'); return; }

    // Get current GPS
    let lat = 0, lng = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch { /* GPS optional for teacher */ }

    try {
      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: selectedBatch, facultyId: selectedFaculty, latitude: lat, longitude: lng }),
      });
      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        toast.success('Session started! QR code is ready.');
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
    timerRef.current = setInterval(fetchQr, 5000); // Refresh every 5 secs
  };

  const endSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveSession(null);
    setQrData(null);
    toast.success('Session ended');
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📡 Start Attendance Session</h2>
          <p>Generate a live QR code for students to scan. QR refreshes every 30 seconds.</p>
        </div>
      </div>

      {!activeSession ? (
        <div className="data-card" style={{ padding: '24px', maxWidth: '500px' }}>
          <div className="form-group">
            <label>Select Batch *</label>
            <select className="form-control" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
              <option value="">Choose a batch...</option>
              {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name} - {b.course?.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Faculty *</label>
            <select className="form-control" value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
              <option value="">Choose faculty...</option>
              {faculty.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={startSession} style={{ width: '100%', marginTop: '12px' }}>
            <FiPlay /> Start Session & Generate QR
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className="data-card" style={{ padding: '32px', display: 'inline-block', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>{qrData?.batchName}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Show this QR on projector. Students scan to mark attendance.
            </p>

            {qrData?.qr ? (
              <div>
                <img src={qrData.qr} alt="QR Code" style={{ width: '300px', height: '300px', borderRadius: '12px', border: '3px solid var(--brand-blue-light)' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                  <div className="kpi-card blue" style={{ padding: '12px 20px', minWidth: 'auto' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{qrData.secondsLeft}s</div>
                    <div style={{ fontSize: '0.7rem' }}>Until Refresh</div>
                  </div>
                  <div className="kpi-card green" style={{ padding: '12px 20px', minWidth: 'auto' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}><FiUsers /> {qrData.attendanceCount}</div>
                    <div style={{ fontSize: '0.7rem' }}>Scanned</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-spinner" />
            )}

            <button className="btn btn-outline" onClick={endSession} style={{ marginTop: '24px', color: 'var(--danger)' }}>
              <FiSquare /> End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
