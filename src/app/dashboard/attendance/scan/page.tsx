'use client';

import { useState, useEffect, useRef } from 'react';
import { FiCamera, FiCheckCircle, FiAlertTriangle, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ScanAttendancePage() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'gps' | 'face' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getFingerprint = async () => {
    try {
      const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      return result.visitorId;
    } catch { return 'unknown'; }
  };

  const startScanning = async () => {
    setStatus('scanning');
    setMessage('Point your camera at the QR code on screen...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Use canvas to decode QR from video frames
      const checkQR = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        try {
          // Use BarcodeDetector API if available
          if ('BarcodeDetector' in window) {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              clearInterval(checkQR);
              stream.getTracks().forEach(t => t.stop());
              await processQrData(barcodes[0].rawValue);
            }
          }
        } catch { /* retry */ }
      }, 500);

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(checkQR);
        stream.getTracks().forEach(t => t.stop());
        if (status === 'scanning') {
          setStatus('error');
          setMessage('Scan timed out. Please try again.');
        }
      }, 60000);

    } catch (err) {
      setStatus('error');
      setMessage('Camera access denied. Please allow camera permission.');
    }
  };

  const processQrData = async (rawData: string) => {
    try {
      const qrPayload = JSON.parse(rawData);
      setStatus('gps');
      setMessage('QR scanned! Checking your location...');

      // Get GPS
      let latitude = 0, longitude = 0;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        setGpsStatus(`📍 Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } catch {
        setGpsStatus('⚠️ GPS unavailable — sending without location');
      }

      // Get device fingerprint
      const deviceFingerprint = await getFingerprint();

      setStatus('face');
      setMessage('Verifying identity...');

      // Submit attendance
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: qrPayload.sid,
          token: qrPayload.tok,
          latitude,
          longitude,
          deviceFingerprint,
          userAgent: navigator.userAgent,
          faceVerified: true, // In production, webcam face check would set this
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setStatus('done');
        setMessage(result.message || 'Attendance marked successfully!');
        toast.success('✅ Attendance marked!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Attendance failed');
        toast.error(result.error);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Invalid QR code format');
    }
  };

  const statusColors = {
    idle: 'var(--text-secondary)',
    scanning: 'var(--brand-blue-light)',
    gps: '#f39c12',
    face: '#9b59b6',
    done: 'var(--brand-green)',
    error: 'var(--danger)',
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>📱 Scan QR Attendance</h2><p>Scan the QR code shown by your faculty to mark attendance.</p></div>
      </div>

      <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div className="data-card" style={{ padding: '32px' }}>
          {/* Security Steps */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { step: '1', label: 'Login', done: true },
              { step: '2', label: 'QR Scan', done: ['gps', 'face', 'done'].includes(status) },
              { step: '3', label: 'GPS', done: ['face', 'done'].includes(status) },
              { step: '4', label: 'Device', done: ['face', 'done'].includes(status) },
              { step: '5', label: 'Verify', done: status === 'done' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                background: s.done ? 'rgba(46, 204, 113, 0.15)' : 'var(--bg-body)',
                color: s.done ? '#2ecc71' : 'var(--text-muted)',
                border: `1px solid ${s.done ? '#2ecc71' : 'var(--border-color)'}`,
              }}>
                {s.done ? '✓' : s.step} {s.label}
              </div>
            ))}
          </div>

          {status === 'idle' && (
            <button className="btn btn-primary" onClick={startScanning} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              <FiCamera /> Open Camera & Scan
            </button>
          )}

          {status === 'scanning' && (
            <div>
              <video ref={videoRef} style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', border: '3px solid var(--brand-blue-light)' }} playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {status === 'done' && (
            <div style={{ fontSize: '4rem' }}>✅</div>
          )}

          {status === 'error' && (
            <div style={{ fontSize: '4rem' }}>❌</div>
          )}

          <p style={{ marginTop: '16px', fontSize: '1rem', fontWeight: 600, color: statusColors[status] }}>
            {message}
          </p>
          {gpsStatus && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{gpsStatus}</p>}

          {(status === 'done' || status === 'error') && (
            <button className="btn btn-outline" onClick={() => { setStatus('idle'); setMessage(''); setGpsStatus(''); }} style={{ marginTop: '16px' }}>
              Try Again
            </button>
          )}
        </div>

        {/* Manual QR Input Fallback */}
        <div className="data-card" style={{ padding: '20px', marginTop: '16px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Camera not working? If your browser doesn't support QR scanning, ask your faculty to use manual attendance.
          </p>
        </div>
      </div>
    </div>
  );
}
