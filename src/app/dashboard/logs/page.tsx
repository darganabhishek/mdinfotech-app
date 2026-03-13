'use client';
import { useEffect, useState } from 'react';
import { FiActivity, FiUser, FiClock, FiTag } from 'react-icons/fi';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: Assuming there's an API for logs, if not, we show a clean state
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div><h2>System Activity</h2><p>Audit logs and action history</p></div>
      </div>

      <div className="data-card">
        {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <h3>No Activity Logs</h3>
            <p>System actions will be logged here for security auditing.</p>
          </div>
        ) : (
          <>
            <div className="data-table-wrap pc-only">
              <table className="data-table">
                <thead><tr><th>Action</th><th>Model</th><th>By User</th><th>Details</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id}>
                      <td><span className="badge badge-info">{log.action}</span></td>
                      <td>{log.model}</td>
                      <td><FiUser /> {log.user?.name || 'System'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{log.details}</td>
                      <td><FiClock /> {new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-grid mobile-only">
              {logs.map((log: any) => (
                <div key={log.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <span className="badge badge-info" style={{ fontWeight: 700 }}>{log.action}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><FiClock size={10} /> {new Date(log.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">Model</span>
                      <span className="mobile-data-card-value">{log.model}</span>
                    </div>
                    <div className="mobile-data-card-field">
                      <span className="mobile-data-card-label">By User</span>
                      <span className="mobile-data-card-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiUser size={12} /> {log.user?.name || 'System'}</span>
                    </div>
                    <div className="mobile-data-card-field" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-data-card-label">Details</span>
                      <span className="mobile-data-card-value" style={{ fontSize: '0.8rem' }}>{log.details}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
