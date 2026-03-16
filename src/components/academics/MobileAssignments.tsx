'use client';

import React from 'react';
import MobileCard from '../mobile/MobileCard';
import StackList from '../mobile/StackList';
import { FiLock, FiUnlock, FiEdit, FiTrash2, FiClock, FiLayers } from 'react-icons/fi';

interface MobileAssignmentsProps {
  assignments: any[];
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string, isLocked: boolean) => void;
  isFaculty?: boolean;
}

export default function MobileAssignments({
  assignments,
  onDelete,
  onToggleLock,
  isFaculty
}: MobileAssignmentsProps) {
  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Assignments</h2>
        <p className="screen-subtitle">Manage coursework and curriculum</p>
      </div>

      <StackList emptyMessage="No assignments found">
        {assignments.map((ass: any) => (
          <MobileCard 
            key={ass.id} 
            title={ass.title} 
            subtitle={`${ass.batch?.name || 'No Batch'} • ${ass.batch?.course?.code || ''}`}
            badge={{ 
              text: ass.isLocked ? 'Locked' : 'Active', 
              type: ass.isLocked ? 'danger' : 'success' 
            }}
            actions={
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {isFaculty && (
                    <button 
                      className={`btn btn-sm ${ass.isLocked ? 'btn-success' : 'btn-outline'}`}
                      onClick={() => onToggleLock?.(ass.id, !ass.isLocked)}
                    >
                      {ass.isLocked ? <><FiUnlock /> Unlock</> : <><FiLock /> Lock</>}
                    </button>
                  )}
                </div>
                {isFaculty && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-icon btn-sm"><FiEdit /></button>
                    <button 
                      onClick={() => onDelete?.(ass.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: 8 }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-muted)', marginBottom: 8 }}>
              <FiLayers /> {ass.topic?.name || 'General Topic'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-muted)' }}>
              <FiClock /> Due: {ass.dueDate}
            </div>
          </MobileCard>
        ))}
      </StackList>
    </div>
  );
}
