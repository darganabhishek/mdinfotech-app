'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiFileText, FiLink, FiInfo, FiTrash2, FiClock } from 'react-icons/fi';

interface MobileNoticeBoardProps {
  notices: any[];
  onDelete?: (id: string) => void;
  isFaculty?: boolean;
}

export default function MobileNoticeBoard({
  notices,
  onDelete,
  isFaculty
}: MobileNoticeBoardProps) {
  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Notice Board</h2>
        <p className="screen-subtitle">Stay updated with latest announcements</p>
      </div>

      <StackList emptyMessage="No notices posted yet">
        {notices.map((notice: any) => (
          <MobileCard 
            key={notice.id} 
            title={notice.title} 
            subtitle={new Date(notice.createdAt).toLocaleDateString()}
            badge={{ 
              text: notice.target === 'all' ? 'Everyone' : 'Targeted', 
              type: notice.target === 'all' ? 'info' : 'warning' 
            }}
            actions={
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {notice.type === 'file' && <a href={notice.fileUrl} target="_blank" className="btn btn-sm btn-outline"><FiFileText /> View PDF</a>}
                  {notice.type === 'link' && <a href={notice.link} target="_blank" className="btn btn-sm btn-outline"><FiLink /> Open Link</a>}
                </div>
                {isFaculty && (
                  <button 
                    onClick={() => onDelete?.(notice.id)} 
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: 8 }}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            }
          >
            <p style={{ margin: '8px 0' }}>{notice.content}</p>
            <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <FiClock /> {new Date(notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </MobileCard>
        ))}
      </StackList>
    </div>
  );
}
