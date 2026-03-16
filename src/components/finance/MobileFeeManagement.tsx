'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiDollarSign, FiFileText, FiClock, FiCheckCircle, FiSearch } from 'react-icons/fi';

interface MobileFeeManagementProps {
  data: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPay: (adm: any) => void;
  onHistory: (adm: any) => void;
  search: string;
  onSearchChange: (val: string) => void;
}

export default function MobileFeeManagement({
  data,
  activeTab,
  onTabChange,
  onPay,
  onHistory,
  search,
  onSearchChange
}: MobileFeeManagementProps) {
  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Fee Management</h2>
        <p className="screen-subtitle">Track payments and dues</p>
      </div>

      {/* Mobile Tabs */}
      <div className="mobile-tabs" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        {['active', 'dropped', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              background: activeTab === tab ? 'var(--brand-blue-light)' : 'var(--bg-card)',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              fontWeight: 600
            }}
          >
            {tab === 'dropped' ? 'Left' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Mobile Search */}
      <div className="search-input" style={{ marginBottom: 20 }}>
        <FiSearch className="search-icon" />
        <input 
          style={{ width: '100%' }}
          placeholder="Student name or course..." 
          value={search} 
          onChange={e => onSearchChange(e.target.value)} 
        />
      </div>

      <StackList emptyMessage="No fee records found">
        {data.map((adm: any) => (
          <MobileCard 
            key={adm.id} 
            title={adm.student?.name} 
            subtitle={`${adm.course?.code} • ${adm.student?.enrollmentNo}`}
            badge={{ 
              text: adm.isFeeCompleted ? 'Completed' : (adm.nextDueAmount > 0 ? 'Due Pending' : 'Ongoing'), 
              type: adm.isFeeCompleted ? 'success' : (adm.nextDueAmount > 0 ? 'warning' : 'info')
            }}
            actions={
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: 12 }}>
                <button className="btn btn-outline btn-block btn-sm" onClick={() => onHistory(adm)}>
                  <FiFileText /> History
                </button>
                {!adm.isFeeCompleted && (
                  <button className="btn btn-primary btn-block btn-sm" onClick={() => onPay(adm)}>
                    <FiDollarSign /> Pay Now
                  </button>
                )}
              </div>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Payable</div>
                <div style={{ fontWeight: 700 }}>₹{adm.netFee.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining</div>
                <div style={{ fontWeight: 700, color: adm.remainingFee > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  ₹{adm.remainingFee.toLocaleString()}
                </div>
              </div>
            </div>
            {adm.nextDueAmount > 0 && (
              <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiClock /> Next Due: ₹{adm.nextDueAmount.toLocaleString()} ({new Date(adm.nextDueDate).toLocaleDateString()})
              </div>
            )}
            {adm.remainingFee === 0 && (
              <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiCheckCircle /> Fees Fully Paid
              </div>
            )}
          </MobileCard>
        ))}
      </StackList>
    </div>
  );
}
