'use client';

import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheck, FiFilter, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/security-alerts');
      setAlerts(await res.json());
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const resolveAlert = async (id: number) => {
    try {
      const res = await fetch('/api/security-alerts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
      });
      if (res.ok) { toast.success('Alert resolved'); fetchAlerts(); }
    } catch { toast.error('Error'); }
  };

  const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    duplicate_device: { icon: '📱', color: '#e74c3c', label: 'Duplicate Device' },
    gps_spoof: { icon: '🗺️', color: '#e67e22', label: 'GPS Spoofing' },
    outside_radius: { icon: '📍', color: '#f39c12', label: 'Outside Radius' },
    failed_attempt: { icon: '❌', color: '#c0392b', label: 'Failed Attempt' },
  };

  const filtered = filter ? alerts.filter(a => a.type === filter) : alerts;
  const unresolved = alerts.filter(a => !a.resolved).length;

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>🛡️ Security Alerts</h2><p>Anti-cheating detection alerts ({unresolved} unresolved)</p></div>
        <select className="form-control" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="duplicate_device">Duplicate Device</option>
          <option value="gps_spoof">GPS Spoofing</option>
          <option value="outside_radius">Outside Radius</option>
          <option value="failed_attempt">Failed Attempt</option>
        </select>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card red">
          <div className="kpi-value">{unresolved}</div>
          <div className="kpi-label">Unresolved Alerts</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-value">{alerts.filter(a => a.type === 'duplicate_device').length}</div>
          <div className="kpi-label">Device Alerts</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-value">{alerts.filter(a => a.type === 'outside_radius').length}</div>
          <div className="kpi-label">Location Alerts</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-value">{alerts.filter(a => a.resolved).length}</div>
          <div className="kpi-label">Resolved</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛡️</div>
          <h3>No Security Alerts</h3>
          <p>All clear! No suspicious activity detected.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((a: any) => {
            const cfg = typeConfig[a.type] || typeConfig.failed_attempt;
            return (
              <div key={a.id} className="data-card" style={{ padding: '16px', borderLeft: `4px solid ${cfg.color}`, opacity: a.resolved ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{cfg.icon}</span>
                      <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.85rem' }}>{cfg.label}</span>
                      {a.resolved && <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>Resolved</span>}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{a.message}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {a.user?.name && <span>User: {a.user.name} • </span>}
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                    {a.details && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>{a.details}</div>}
                  </div>
                  {!a.resolved && (
                    <button className="btn btn-sm btn-outline" onClick={() => resolveAlert(a.id)} style={{ whiteSpace: 'nowrap' }}>
                      <FiCheck /> Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
