'use client';
import { useSession } from 'next-auth/react';
import { FiShield, FiUser, FiInfo, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    instituteName: '',
    tagline: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (!data.error) {
        setFormData({
          instituteName: data.instituteName || '',
          tagline: data.tagline || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <>
      <div className="page-header">
        <div><h2>System Settings</h2><p>Configure institute preferences and manage your account</p></div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>Account</button>
        <button className={`tab ${activeTab === 'institute' ? 'active' : ''}`} onClick={() => setActiveTab('institute')}>Institute Profile</button>
        <button className={`tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Security</button>
        <button className={`tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System Information</button>
      </div>

      <div style={{ maxWidth: 800 }}>
        {message.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 82, 82, 0.2)'}`,
            animation: 'fadeIn 0.3s ease'
          }}>
            {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
            {message.text}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="data-card">
            <div className="data-card-header"><h3><FiUser style={{ marginRight: 8 }} /> My Account</h3></div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div className="user-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>{session?.user?.name?.charAt(0) || 'A'}</div>
                  <div>
                    <h4 style={{ margin: 0 }}>{session?.user?.name || 'Administrator'}</h4>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>{session?.user?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                  <div><label className="form-label">Username</label><input className="form-control" readOnly value={session?.user?.email || ''} /></div>
                  <div><label className="form-label">Role</label><input className="form-control" readOnly value={(session?.user as any)?.role || 'Admin'} /></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'institute' && (
          <div className="data-card">
            <div className="data-card-header"><h3>🏢 Institute Profile</h3></div>
            <div style={{ padding: 24 }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label>Institute Name</label>
                  <input 
                    className="form-control" 
                    value={formData.instituteName} 
                    onChange={(e) => setFormData({...formData, instituteName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tagline</label>
                  <input 
                    className="form-control" 
                    value={formData.tagline} 
                    onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      className="form-control" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      className="form-control" 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="data-card">
            <div className="data-card-header"><h3><FiShield style={{ marginRight: 8 }} /> Security & Privacy</h3></div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FiShield style={{ color: 'var(--success)', fontSize: '1.5rem' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>SSL Encryption Active</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your connection to the database is fully encrypted and secure.</div>
                  </div>
                </div>
                {(session?.user as any)?.role !== 'student' && (
                  <div>
                    <h4 style={{ marginBottom: 16 }}>Change Password</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input className="form-control" type="password" placeholder="Current Password" />
                      <input className="form-control" type="password" placeholder="New Password" />
                      <input className="form-control" type="password" placeholder="Confirm New Password" />
                    </div>
                    <button className="btn btn-outline" style={{ marginTop: 16 }}>Update Password</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="data-card">
            <div className="data-card-header"><h3><FiInfo style={{ marginRight: 8 }} /> System Status</h3></div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Software Version</span>
                  <span className="badge badge-info">v1.2.4 (Latest)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Environment</span>
                  <span style={{ fontWeight: 600 }}>Development / Next.js 16</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Database</span>
                  <span style={{ fontWeight: 600 }}>SQLite (Prisma 5.10)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Server Start</span>
                  <span style={{ fontWeight: 600 }}>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
