'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiCheck, FiX, FiClock, FiSave, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, { status: string; notes: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      toast.error('Failed to load batches');
    }
  };

  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId);
    if (!batchId) {
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      // Get batch students
      const batchRes = await fetch(`/api/batches/${batchId}`);
      const batchData = await batchRes.json();
      const studentList = batchData.admissions?.map((a: any) => a.student) || [];
      setStudents(studentList);

      // Fetch existing attendance for this date/batch
      const attRes = await fetch(`/api/attendance?batchId=${batchId}&date=${date}`);
      const attData = await attRes.json();
      
      const attMap: Record<number, { status: string; notes: string }> = {};
      studentList.forEach((s: any) => {
        const existing = attData.find((a: any) => a.studentId === s.id);
        attMap[s.id] = existing 
          ? { status: existing.status, notes: existing.notes || '' }
          : { status: 'present', notes: '' }; // Default to present
      });
      setAttendance(attMap);

    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (studentId: number, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleSave = async () => {
    if (!selectedBatchId || !date) return;
    setSaving(true);

    try {
      const attendanceData = students.map(s => ({
        studentId: s.id,
        status: attendance[s.id]?.status || 'present',
        notes: attendance[s.id]?.notes || ''
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: parseInt(selectedBatchId),
          date,
          attendanceData
        })
      });

      if (res.ok) {
        toast.success('Attendance saved successfully');
      } else {
        toast.error('Failed to save attendance');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h2>Attendance Management</h2>
          <p>Mark and track student attendance by batch.</p>
        </div>
      </div>

      <div className="data-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Select Batch</label>
            <select 
              className="form-control" 
              value={selectedBatchId} 
              onChange={(e) => handleBatchChange(e.target.value)}
            >
              <option value="">Choose Batch...</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} - {b.course?.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
            <label>Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={date} 
              onChange={(e) => {
                setDate(e.target.value);
                if (selectedBatchId) handleBatchChange(selectedBatchId);
              }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
             <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={saving || !selectedBatchId || students.length === 0}
             >
               <FiSave /> {saving ? 'Saving...' : 'Save Attendance'}
             </button>
          </div>
        </div>
      </div>

      {selectedBatchId && (
        <div className="data-card">
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Loading students...</div>
          ) : students.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>No students found in this batch.</div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Enrollment</th>
                    <th>Student Name</th>
                    <th>Attendance Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-accent)' }}>{student.enrollmentNo}</td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            className={`btn btn-sm ${attendance[student.id]?.status === 'present' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => updateStatus(student.id, 'present')}
                            title="Present"
                          >
                            <FiCheck /> Present
                          </button>
                          <button 
                            className={`btn btn-sm ${attendance[student.id]?.status === 'absent' ? 'btn-danger' : 'btn-outline'}`}
                            onClick={() => updateStatus(student.id, 'absent')}
                            style={attendance[student.id]?.status === 'absent' ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
                            title="Absent"
                          >
                            <FiX /> Absent
                          </button>
                          <button 
                            className={`btn btn-sm ${attendance[student.id]?.status === 'late' ? 'btn-warning' : 'btn-outline'}`}
                            onClick={() => updateStatus(student.id, 'late')}
                            style={attendance[student.id]?.status === 'late' ? { background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000' } : {}}
                            title="Late"
                          >
                            <FiClock /> Late
                          </button>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          placeholder="Optional notes"
                          value={attendance[student.id]?.notes || ''}
                          onChange={(e) => setAttendance(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id], notes: e.target.value }
                          }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
