'use client';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiClock, FiBook } from 'react-icons/fi';

export default function BatchesPage() {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [form, setForm] = useState({ name: '', courseId: 0, timeSlotId: 0, timing: '', instructor: '', capacity: 20, status: 'active' });

  const fetch_data = async () => {
    setLoading(true);
    const [tsRes, cRes] = await Promise.all([
      fetch('/api/timeslots?includeBatches=true'), 
      fetch('/api/courses')
    ]);
    setTimeSlots(await tsRes.json());
    setCourses(await cRes.json());
    setLoading(false);
  };
  
  useEffect(() => { fetch_data(); }, []);

  const showToast = (type: string, msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editBatch ? `/api/batches/${editBatch.id}` : '/api/batches';
    const method = editBatch ? 'PUT' : 'POST';
    
    // Auto fill name and timing based on selection
    const selectedCourse = courses.find(c => c.id === Number(form.courseId));
    const selectedTimeSlot = timeSlots.find(ts => ts.id === Number(form.timeSlotId));
    
    const payload = { 
      ...form, 
      courseId: Number(form.courseId), 
      timeSlotId: Number(form.timeSlotId),
      capacity: Number(form.capacity),
      name: form.name || `${selectedCourse?.name || 'Course'} Batch`,
      timing: selectedTimeSlot?.label || form.timing
    };

    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    
    if (res.ok) { 
      showToast('success', editBatch ? 'Batch updated!' : 'Batch created!'); 
      setShowModal(false); 
      setEditBatch(null);
      fetch_data(); 
    }
    else {
      const data = await res.json();
      showToast('error', data.error || 'Failed to save batch');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this batch? All associated data might be affected.')) return;
    const res = await fetch(`/api/batches/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Batch deleted'); fetch_data(); }
    else {
      const data = await res.json();
      showToast('error', data.error || 'Failed to delete');
    }
  };

  const openEdit = (b: any, tsId: number) => {
    setForm({ 
      name: b.name, 
      courseId: b.courseId, 
      timeSlotId: tsId,
      timing: b.timing || '', 
      instructor: b.instructor || '', 
      capacity: b.capacity, 
      status: b.status 
    });
    setEditBatch(b);
    setShowModal(true);
  };

  const openNew = () => {
    setForm({ name: '', courseId: courses[0]?.id || 0, timeSlotId: timeSlots[0]?.id || 0, timing: '', instructor: '', capacity: 20, status: 'active' }); 
    setEditBatch(null); 
    setShowModal(true);
  }

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
      <div className="page-header">
        <div>
          <h2>Time Slots & Batches</h2>
          <p>Manage hourly time slots and course batches running within them</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><FiPlus /> Add Course Batch</button>
      </div>

      {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {timeSlots.map((ts: any) => (
            <div key={ts.id} className="data-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ 
                background: 'var(--bg-card-header)', 
                padding: '16px 24px', 
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    background: 'var(--primary-color)', 
                    color: 'white', 
                    padding: '8px 12px', 
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FiClock /> {ts.label}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {ts.batches?.length || 0} active course batches
                  </span>
                </div>
              </div>
              
              <div style={{ padding: '16px 24px' }}>
                {!ts.batches || ts.batches.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No courses scheduled for this time slot.
                  </div>
                ) : (
                  <div className="data-table-wrap">
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Instructor</th>
                          <th>Enrolled Students</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ts.batches.map((b: any) => {
                          const enrolled = b._count?.admissions || 0;
                          const isFull = enrolled >= b.capacity;
                          return (
                            <tr key={b.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ 
                                    width: '32px', height: '32px', 
                                    background: 'var(--bg-input)', 
                                    borderRadius: '6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--primary-color)'
                                  }}>
                                    <FiBook />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.course?.name || b.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.course?.code}</div>
                                  </div>
                                </div>
                              </td>
                              <td>{b.instructor || <span style={{ color: 'var(--text-muted)' }}>TBD</span>}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ 
                                    flex: 1, 
                                    height: '6px', 
                                    background: 'var(--border-color)', 
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{ 
                                      height: '100%', 
                                      width: `${Math.min(100, (enrolled / b.capacity) * 100)}%`,
                                      background: isFull ? 'var(--danger)' : 'var(--primary-color)'
                                    }} />
                                  </div>
                                  <span style={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.9rem',
                                    color: isFull ? 'var(--danger)' : 'var(--text-primary)' 
                                  }}>
                                    {enrolled} / {b.capacity}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge badge-${b.status === 'active' ? 'active' : 'completed'}`}>
                                  {b.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(b, ts.id)} title="Edit Batch">
                                    <FiEdit2 />
                                  </button>
                                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => handleDelete(b.id)} style={{ color: 'var(--danger)' }} title="Delete Batch">
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editBatch ? 'Edit Course Batch' : 'Add Course Batch to Time Slot'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Time Slot *</label>
                    <select className="form-control" required value={form.timeSlotId} onChange={e => setForm({ ...form, timeSlotId: Number(e.target.value) })}>
                      <option value="">Select Time Slot</option>
                      {timeSlots.map((ts: any) => <option key={ts.id} value={ts.id}>{ts.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Course *</label>
                    <select className="form-control" required value={form.courseId} onChange={e => setForm({ ...form, courseId: Number(e.target.value) })}>
                      <option value="">Select Course</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Custom Batch Name (Optional)</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Leave blank to auto-generate" />
                  <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>If blank, it will be named "[Course Name] Batch"</small>
                </div>

                <div className="form-row">
                  <div className="form-group"><label>Instructor (Optional)</label><input className="form-control" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} placeholder="e.g. Sanil Dargan" /></div>
                  <div className="form-group"><label>Capacity *</label><input className="form-control" type="number" required min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editBatch ? 'Update Batch' : 'Create Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
