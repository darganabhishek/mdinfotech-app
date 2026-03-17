'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiLogIn, FiLogOut, FiMapPin, FiUsers, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FacultyClockPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/faculty/clock');
      const data = await res.json();
      setLogs(data);
      setClockedIn(data.some((l: any) => !l.clockOut));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setFaceImage(null);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300, facingMode: 'user' } });
        const video = document.getElementById('camera-feed') as HTMLVideoElement;
        if (video) video.srcObject = stream;
      } catch (err) {
        toast.error('Could not access camera. Please enable permissions.');
        setShowCamera(false);
      }
    }, 100);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-feed') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx && video) {
      ctx.drawImage(video, 0, 0, 400, 300);
      const data = canvas.toDataURL('image/jpeg', 0.7);
      setFaceImage(data);
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const handleClock = async (action: 'clock-in' | 'clock-out') => {
    if (!faceImage) {
      toast.error('Face capture is mandatory. Please take a photo first.');
      return;
    }

    setProcessing(true);
    let latitude = 0, longitude = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      toast.error('GPS location is mandatory. Please enable location services.');
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch('/api/faculty/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, latitude, longitude, faceImage }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setClockedIn(action === 'clock-in');
        setFaceImage(null);
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
        <div><h2>🕐 Faculty Clock-In / Clock-Out</h2><p>Mandatory Face & GPS verification for arrival and departure.</p></div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="data-card" style={{ flex: 1, minWidth: '350px', padding: '24px', textAlign: 'center' }}>
          {!faceImage && !showCamera ? (
            <div style={{ padding: '40px', background: 'var(--bg-input)', borderRadius: '12px', border: '2px dashed var(--border-color)', marginBottom: '16px' }}>
              <FiClock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Face attendance is required</p>
              <button className="btn btn-primary" onClick={startCamera} style={{ marginTop: '16px' }}>
                <FiLogIn /> Open Camera
              </button>
            </div>
          ) : showCamera ? (
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <video id="camera-feed" autoPlay playsInline style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', background: '#000' }} />
              <button className="btn btn-primary" onClick={capturePhoto} style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)' }}>
                Capture Photo
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <img src={faceImage!} alt="Captured face" style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', border: '3px solid var(--brand-blue)' }} />
              <button className="btn btn-outline btn-sm" onClick={startCamera} style={{ marginTop: '8px' }}>Retake Photo</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              className={`btn ${!clockedIn ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleClock('clock-in')}
              disabled={clockedIn || processing || !faceImage}
              style={{ flex: 1, padding: '12px' }}
            >
              Clock In
            </button>
            <button
              className={`btn ${clockedIn ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => handleClock('clock-out')}
              disabled={!clockedIn || processing || !faceImage}
              style={{ flex: 1, padding: '12px', background: clockedIn ? 'var(--danger)' : 'none', color: clockedIn ? '#fff' : 'inherit' }}
            >
              Clock Out
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="kpi-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
            <div className={`kpi-card ${clockedIn ? 'green' : 'orange'}`} style={{ minWidth: 'auto' }}>
              <div className="kpi-value">{clockedIn ? '🟢 CURRENTLY IN' : '🔴 CURRENTLY OUT'}</div>
              <div className="kpi-label">Status as of {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="kpi-card blue" style={{ minWidth: 'auto' }}>
              <div className="kpi-value">{logs.filter(l => l.totalHours).reduce((s: number, l: any) => s + l.totalHours, 0).toFixed(1)}h</div>
              <div className="kpi-label">Cumulative Hours This Month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header"><h3>Recent Activity Logs</h3></div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Faculty</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Duration</th><th>Verification</th><th>Actions</th></tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.faculty?.name || 'Staff'}</td>
                  <td>{new Date(l.clockIn).toLocaleDateString()}</td>
                  <td>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: l.faceImage ? 'pointer' : 'default' }}
                      onClick={() => { if (l.faceImage) { setSelectedLog(l); setShowPhotoModal(true); } }}
                    >
                      {l.faceImage ? (
                        <div style={{ position: 'relative' }}>
                          <img src={l.faceImage} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                          <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--brand-blue)', borderRadius: '50%', padding: '2px' }}>
                            <FiSearch size={8} color="#fff" />
                          </div>
                        </div>
                      ) : <FiClock />}
                      <span style={{ fontWeight: 600 }}>{new Date(l.clockIn).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td style={{ color: l.clockOut ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {l.clockOut ? new Date(l.clockOut).toLocaleTimeString() : 'Active'}
                  </td>
                  <td style={{ fontWeight: 700 }}>{l.totalHours ? `${l.totalHours}h` : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <FiMapPin title="GPS Verified" style={{ color: l.latitude ? 'var(--success)' : 'var(--text-muted)' }} />
                      <FiUsers title="Face Verified" style={{ color: l.faceImage ? 'var(--brand-blue)' : 'var(--text-muted)' }} />
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => { setSelectedLog(l); setShowDetailsModal(true); }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>No logs found for the last 2 months.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo View Modal */}
      {showPhotoModal && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Face Verification Photo</h3>
              <button className="modal-close" onClick={() => setShowPhotoModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '0' }}>
              <img src={selectedLog.faceImage} alt="Face Verification" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLog.faculty?.name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Captured at: {new Date(selectedLog.clockIn).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowPhotoModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Attendance Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                {selectedLog.faceImage && (
                  <img src={selectedLog.faceImage} style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                )}
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{selectedLog.faculty?.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Date: {new Date(selectedLog.clockIn).toLocaleDateString()}</p>
                  <div style={{ marginTop: '12px' }}>
                    <span className={`badge ${selectedLog.clockOut ? 'badge-success' : 'badge-warning'}`}>
                      {selectedLog.clockOut ? 'Completed' : 'Currently Clocked In'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="data-card" style={{ padding: '20px', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Clock In</label>
                    <p style={{ fontWeight: 600 }}>{new Date(selectedLog.clockIn).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Clock Out</label>
                    <p style={{ fontWeight: 600 }}>{selectedLog.clockOut ? new Date(selectedLog.clockOut).toLocaleTimeString() : '—'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Duration</label>
                    <p style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{selectedLog.totalHours ? `${selectedLog.totalHours} hours` : 'Ongoing'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verification</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                       <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                         <FiMapPin /> GPS
                       </span>
                       <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-blue)' }}>
                         <FiUsers /> Face
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedLog.latitude && (
                <div style={{ marginTop: '24px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Location Trace</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <FiMapPin size={24} color="var(--danger)" />
                    <div>
                      <p style={{ fontSize: '0.9rem' }}>Coordinates: {selectedLog.latitude.toFixed(6)}, {selectedLog.longitude.toFixed(6)}</p>
                      <a 
                        href={`https://www.google.com/maps?q=${selectedLog.latitude},${selectedLog.longitude}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.85rem', color: 'var(--text-accent)', textDecoration: 'underline' }}
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
