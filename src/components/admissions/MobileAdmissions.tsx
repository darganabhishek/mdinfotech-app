'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiPlus, FiSmartphone, FiEdit2, FiTrash2, FiSearch, FiLayers } from 'react-icons/fi';

interface MobileAdmissionsProps {
  data: any[];
  onNew: () => void;
  onEdit: (adm: any) => void;
  onDelete: (id: number) => void;
  onShowQr: () => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
}

export default function MobileAdmissions({
  data,
  onNew,
  onEdit,
  onDelete,
  onShowQr,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: MobileAdmissionsProps) {
  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Admissions</h2>
        <p className="screen-subtitle">Manage student enrollment</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onShowQr}>
          <FiSmartphone /> Registration QR
        </button>
      </div>

      <div className="search-input" style={{ marginBottom: 12 }}>
        <FiSearch className="search-icon" />
        <input 
          style={{ width: '100%' }}
          placeholder="Search students..." 
          value={search} 
          onChange={e => onSearchChange(e.target.value)} 
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        {['', 'active', 'pending', 'completed', 'dropped'].map(status => (
          <button
            key={status}
            onClick={() => onStatusFilterChange(status)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: statusFilter === status ? 'var(--brand-blue-light)' : 'var(--bg-card)',
              color: statusFilter === status ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              textTransform: 'capitalize'
            }}
          >
            {status || 'All Status'}
          </button>
        ))}
      </div>

      <StackList emptyMessage="No admissions found">
        {data.map((a: any) => {
          const paid = (a.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
          const balance = a.netFee - paid;
          
          return (
            <MobileCard 
              key={a.id} 
              title={a.student?.name} 
              subtitle={a.student?.enrollmentNo}
              badge={{ 
                text: a.status, 
                type: a.status === 'active' ? 'success' : (a.status === 'pending' ? 'warning' : 'info')
              }}
              actions={
                <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                  <button className="btn btn-outline btn-block btn-sm" onClick={() => onEdit(a)}>
                    <FiEdit2 /> Edit
                  </button>
                  <button className="btn btn-outline btn-block btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(a.id)}>
                    <FiTrash2 /> Delete
                  </button>
                </div>
              }
            >
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiLayers /> {a.course?.code} • {a.batch?.timing || a.batch?.name || 'TBD'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--bg-secondary)', padding: 12, borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Fee</div>
                  <div style={{ fontWeight: 700 }}>₹{a.netFee.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance</div>
                  <div style={{ fontWeight: 700, color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{balance.toLocaleString()}</div>
                </div>
              </div>
            </MobileCard>
          );
        })}
      </StackList>

      <button className="mobile-fab" onClick={onNew}>
        <FiPlus />
      </button>
    </div>
  );
}
