'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiPhone, FiMail } from 'react-icons/fi';

interface MobileStudentListingProps {
  students: any[];
  onEdit: (s: any) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
}

export default function MobileStudentListing({
  students,
  onEdit,
  onDelete,
  onAdd,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: MobileStudentListingProps) {
  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Students</h2>
        <p className="screen-subtitle">Manage registered learners</p>
      </div>

      <div className="search-input" style={{ marginBottom: 16 }}>
        <FiSearch className="search-icon" />
        <input 
          style={{ width: '100%' }}
          placeholder="Student name or enrollment..." 
          value={search} 
          onChange={e => onSearchChange(e.target.value)} 
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        {['', 'active', 'inactive', 'completed'].map(status => (
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
            {status || 'All Students'}
          </button>
        ))}
      </div>

      <StackList emptyMessage="No students found">
        {students.map((s: any) => (
          <MobileCard 
            key={s.id} 
            title={s.name} 
            subtitle={s.enrollmentNo}
            badge={{ 
              text: s.status, 
              type: s.status === 'active' ? 'success' : (s.status === 'completed' ? 'info' : 'warning')
            }}
            actions={
              <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                <button className="btn btn-outline btn-block btn-sm" onClick={() => onEdit(s)}>
                  <FiEdit2 /> Edit Profile
                </button>
                <button className="btn btn-outline btn-block btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(s.id)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            }
          >
            <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                <FiPhone style={{ fontSize: '11px' }} /> {s.phone || 'No phone'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                <FiMail style={{ fontSize: '11px' }} /> {s.email || 'No email'}
              </div>
            </div>
            {s.admissions?.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {s.admissions.map((a: any) => (
                  <span key={a.id} className="badge badge-info" style={{ fontSize: '10px' }}>{a.course?.code}</span>
                ))}
              </div>
            )}
          </MobileCard>
        ))}
      </StackList>

      <button className="mobile-fab" onClick={onAdd}>
        <FiPlus />
      </button>
    </div>
  );
}
