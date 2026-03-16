'use client';

import React from 'react';

interface StackListProps {
  children: React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
}

export default function StackList({
  children,
  emptyMessage = "No items found",
  loading
}: StackListProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ 
            height: 100, 
            background: 'var(--bg-card)', 
            borderRadius: 16,
            opacity: 0.5,
            animation: 'pulse 1.5s infinite'
          }} />
        ))}
        <style jsx>{`
          @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 0.2; }
            100% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (React.Children.count(children) === 0) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center', 
        color: 'var(--text-muted)',
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px dashed var(--border-color)'
      }}>
        <div style={{ fontSize: '32px', marginBottom: 12 }}>🔍</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="stack-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  );
}
