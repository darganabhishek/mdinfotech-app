'use client';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function RegistrationQRPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const registrationUrl = typeof window !== 'undefined' ? `${window.location.origin}/registration` : '';

  useEffect(() => {
    if (registrationUrl) {
      QRCode.toDataURL(registrationUrl, { width: 300, margin: 2, color: { dark: '#1a237e', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code', err));
    }
  }, [registrationUrl]);

  return (
    <div className="page-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '40px' }}>
      <h2>Student Registration Link</h2>
      <p style={{ maxWidth: '500px', margin: '16px auto', color: 'var(--text-muted)' }}>
        Scan the QR code below or share the link with prospective students to have them pre-register. Their applications will appear as "Pending" in the Admissions tab.
      </p>
      
      {qrCodeUrl ? (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <img src={qrCodeUrl} alt="Registration QR Code" />
        </div>
      ) : (
        <div className="loading-spinner" style={{ margin: '40px 0' }} />
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-input)', padding: '12px 24px', borderRadius: '8px' }}>
        <code style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{registrationUrl}</code>
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => {
            navigator.clipboard.writeText(registrationUrl);
            alert('Link copied to clipboard!');
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}
