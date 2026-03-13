'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

export default function TimetablePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    day: 'Monday', startTime: '09:00', endTime: '10:30', subject: '', room: '', facultyId: '', batchId: ''
  });

  useEffect(() => { fetchInitial(); }, []);

  const fetchInitial = async () => {
    try {
      const [batchRes, facRes] = await Promise.all([fetch('/api/batches'), fetch('/api/faculty')]);
      setBatches(await batchRes.json());
      setFaculty(await facRes.json());
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const fetchSlots = async (batchId: string) => {
    setSelectedBatchId(batchId);
    if (!batchId) { setSlots([]); return; }
    try {
      const res = await fetch(`/api/timetable?batchId=${batchId}`);
      setSlots(await res.json());
    } catch { toast.error('Failed to load timetable'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, batchId: selectedBatchId }),
      });
      if (res.ok) {
        toast.success('Slot added!');
        setModalOpen(false);
        fetchSlots(selectedBatchId);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this slot?')) return;
    try {
      const res = await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Slot removed'); fetchSlots(selectedBatchId); }
    } catch { toast.error('Error'); }
  };

  const getSlotForDayTime = (day: string, time: string) => {
    return slots.find((s: any) => s.day === day && s.startTime === time);
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="timetable-page">
      <div className="page-header">
        <div>
          <h2>Timetable Generator</h2>
          <p>Manage schedules by batch with conflict detection.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="form-control" style={{ width: 'auto' }} value={selectedBatchId} onChange={e => fetchSlots(e.target.value)}>
            <option value="">Select Batch</option>
            {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name} - {b.course?.name}</option>)}
          </select>
          {selectedBatchId && (
            <button className="btn btn-primary" onClick={() => { setFormData({ ...formData, batchId: selectedBatchId }); setModalOpen(true); }}>
              <FiPlus /> Add Slot
            </button>
          )}
        </div>
      </div>

      {selectedBatchId ? (
        <div className="data-card" style={{ overflow: 'auto' }}>
          <table className="data-table" style={{ minWidth: '800px', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Time</th>
                {DAYS.map(d => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {TIMES.map(time => (
                <tr key={time}>
                  <td style={{ fontWeight: 600, color: 'var(--text-accent)', whiteSpace: 'nowrap' }}>{time}</td>
                  {DAYS.map(day => {
                    const slot = getSlotForDayTime(day, time);
                    return (
                      <td key={day} style={{ padding: '4px' }}>
                        {slot ? (
                          <div style={{
                            background: 'rgba(57, 73, 171, 0.15)', borderRadius: 'var(--radius-sm)',
                            padding: '6px 8px', position: 'relative', borderLeft: '3px solid var(--brand-blue-light)'
                          }}>
                            <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{slot.subject}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {slot.faculty?.name} {slot.room && `• ${slot.room}`}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{slot.startTime}–{slot.endTime}</div>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.7rem' }}
                            ><FiTrash2 size={10} /></button>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>Select a Batch</h3>
          <p>Choose a batch to view or create its timetable.</p>
        </div>
      )}

      {/* Add Slot Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header"><h3>Add Time Slot</h3><button className="modal-close" onClick={() => setModalOpen(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Day *</label>
                    <select className="form-control" value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Faculty *</label>
                    <select className="form-control" required value={formData.facultyId} onChange={e => setFormData({ ...formData, facultyId: e.target.value })}>
                      <option value="">Select...</option>
                      {faculty.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input type="time" className="form-control" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input type="time" className="form-control" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <input className="form-control" required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g. Python Basics" />
                </div>
                <div className="form-group">
                  <label>Room / Lab</label>
                  <input className="form-control" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="e.g. Lab 1, Room 201" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
