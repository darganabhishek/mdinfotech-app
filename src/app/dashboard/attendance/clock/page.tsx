'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiLogIn, FiLogOut, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FacultyClockPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/faculty/clock');
      const data = await res.json();
      setLogs(data);
      // Check if currently clocked in (open session)
      setClockedIn(data.some((l: any) => !l.clockOut));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleClock = async (action: 'clock-in' | 'clock-out') => {
    setProcessing(true);
    let latitude = 0, longitude = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch { /* GPS optional */ }

    try {
      const res = await fetch('/api/faculty/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, latitude, longitude }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setClockedIn(action === 'clock-in');
        fetchLogs();
      } else {
        toast.error(result.error);
      }
    } catch { toast.error('Network error'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>🕐 Faculty Clock-In / Clock-Out</h2><p>Record your arrival and departure with GPS verification.</p></div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${!clockedIn ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleClock('clock-in')}
          disabled={clockedIn || processing}
          style={{ padding: '16px 32px', fontSize: '1.1rem', flex: 1, minWidth: '200px' }}
        >
          <FiLogIn /> Clock In
        </button>
        <button
          className={`btn ${clockedIn ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleClock('clock-out')}
          disabled={!clockedIn || processing}
          style={{ padding: '16px 32px', fontSize: '1.1rem', flex: 1, minWidth: '200px' }}
        >
          <FiLogOut /> Clock Out
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card blue">
          <div className="kpi-value">{logs.length}</div>
          <div className="kpi-label">Total Entries</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-value">{logs.filter(l => l.totalHours).reduce((s: number, l: any) => s + l.totalHours, 0).toFixed(1)}h</div>
          <div className="kpi-label">Total Hours</div>
        </div>
        <div className={`kpi-card ${clockedIn ? 'green' : 'orange'}`}>
          <div className="kpi-value">{clockedIn ? '🟢 IN' : '🔴 OUT'}</div>
          <div className="kpi-label">Current Status</div>
        </div>
      </div>

      <div className="data-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Total Hours</th><th>GPS</th></tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td>{new Date(l.clockIn).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--brand-green)' }}>{new Date(l.clockIn).toLocaleTimeString()}</td>
                  <td style={{ fontWeight: 600, color: l.clockOut ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {l.clockOut ? new Date(l.clockOut).toLocaleTimeString() : '— (Active)'}
                  </td>
                  <td style={{ fontWeight: 700 }}>{l.totalHours ? `${l.totalHours}h` : '—'}</td>
                  <td>{l.latitude ? <FiMapPin style={{ color: 'var(--brand-green)' }} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
