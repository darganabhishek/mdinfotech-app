'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiBriefcase, FiMapPin, FiExternalLink, FiTrash2 } from 'react-icons/fi';

interface MobileJobsPortalProps {
  jobs: any[];
  onDelete?: (id: string) => void;
  isFaculty?: boolean;
}

export default function MobileJobsPortal({
  jobs,
  onDelete,
  isFaculty
}: MobileJobsPortalProps) {
  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Jobs Portal</h2>
        <p className="screen-subtitle">Recent career opportunities for you</p>
      </div>

      <StackList emptyMessage="No job posts available right now">
        {jobs.map((job: any) => (
          <MobileCard 
            key={job.id} 
            title={job.title} 
            subtitle={job.company}
            actions={
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {job.link && (
                    <a href={job.link} target="_blank" className="btn btn-sm btn-primary">
                      <FiExternalLink /> Apply Now
                    </a>
                  )}
                </div>
                {isFaculty && (
                  <button 
                    onClick={() => onDelete?.(job.id)} 
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: 8 }}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-muted)', marginBottom: 12 }}>
              <FiMapPin /> {job.location}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{job.description}</p>
          </MobileCard>
        ))}
      </StackList>
    </div>
  );
}
