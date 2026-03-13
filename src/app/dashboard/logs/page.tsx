'use client';

import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) setLogs(await res.json());
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  const filtered = logs.filter(l =>
    (!search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.user?.name?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase())) &&
    (!entityFilter || l.entity === entityFilter)
  );

  const entities = [...new Set(logs.map(l => l.entity))].sort();

  const actionColors: Record<string, string> = {
    create: '#2ecc71', update: '#3498db', delete: '#e74c3c', login: '#9b59b6'
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>Audit & Compliance Logs</h2><p>Track all system actions for accountability ({logs.length} records)</p></div>
      </div>

      <div className="data-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', padding: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-control" placeholder="Search actions, users, details..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="">All Entities</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Audit Logs</h3>
          <p>System actions will be recorded here.</p>
        </div>
      ) : (
        <div className="data-card">
          <div className="data-table-wrap">
            <table className="data-table" style={{ fontSize: '0.85rem' }}>
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th></tr></thead>
              <tbody>
                {filtered.map((l: any) => (
                  <tr key={l.id}>
                    <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{l.user?.name || '—'}</td>
                    <td>
                      <span style={{
                        padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                        background: `${actionColors[l.action?.toLowerCase()] || '#666'}22`,
                        color: actionColors[l.action?.toLowerCase()] || '#666'
                      }}>{l.action}</span>
                    </td>
                    <td>{l.entity}</td>
                    <td>{l.entityId || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
