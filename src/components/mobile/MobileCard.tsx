'use client';

import React from 'react';

interface MobileCardProps {
  title?: string;
  subtitle?: string;
  badge?: {
    text: string;
    type: 'success' | 'danger' | 'warning' | 'info' | 'active' | 'completed';
  };
  children: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export default function MobileCard({
  title,
  subtitle,
  badge,
  children,
  actions,
  onClick
}: MobileCardProps) {
  return (
    <div 
      className={`mobile-card ${onClick ? 'clickable' : ''}`} 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {(title || badge) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {title && <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {badge && (
            <span className={`badge badge-${badge.type}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
              {badge.text}
            </span>
          )}
        </div>
      )}
      
      <div className="mobile-card-body" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        {children}
      </div>

      {actions && (
        <div className="mobile-card-actions" style={{ 
          display: 'flex', 
          gap: 8, 
          marginTop: 4, 
          paddingTop: 12, 
          borderTop: '1px solid var(--border-color)' 
        }} onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}

      <style jsx>{`
        .mobile-card {
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .mobile-card.clickable:active {
          transform: scale(0.98);
          background: var(--bg-card-hover);
        }
      `}</style>
    </div>
  );
}
