'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiCheck, FiX, FiClock, FiSave, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, { status: string; notes: string; batchId: number }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTimeSlots();
    fetchAdmissions(''); // Initial load: Show All
  }, []);

  const fetchTimeSlots = async () => {
    try {
      const res = await fetch('/api/timeslots');
      const data = await res.json();
      setTimeSlots(data);
    } catch (error) {
      toast.error('Failed to load time slots');
    }
  };

  const fetchAdmissions = async (timeSlotId: string) => {
    setLoading(true);
    try {
      // Fetch admissions (active students)
      const url = timeSlotId 
        ? `/api/admissions?limit=100&status=active&timeSlotId=${timeSlotId}`
        : `/api/admissions?limit=500&status=active`; // Increased limit for "All"
        
      const res = await fetch(url);
      const data = await res.json();
      const admissionList = data.admissions || [];
      setAdmissions(admissionList);

      // Fetch existing attendance for this date
      const attUrl = timeSlotId 
        ? `/api/attendance?date=${date}&timeSlotId=${timeSlotId}`
        : `/api/attendance?date=${date}`;
        
      const attRes = await fetch(attUrl);
      const attData = await attRes.json();
      
      const attMap: Record<number, { status: string; notes: string; batchId: number }> = {};
      admissionList.forEach((adm: any) => {
        const student = adm.student;
        const existing = attData.find((a: any) => a.studentId === student.id && a.batchId === adm.batchId);
        attMap[student.id] = {
          status: existing ? existing.status : 'present',
          notes: existing ? (existing.notes || '') : '',
          batchId: adm.batchId
        };
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

  const markAllPresent = () => {
    const newAttendance = { ...attendance };
    filteredAdmissions.forEach(adm => {
      newAttendance[adm.student.id] = {
        ...newAttendance[adm.student.id],
        status: 'present'
      };
    });
    setAttendance(newAttendance);
    toast.success(`Marked ${filteredAdmissions.length} students as present`);
  };

  const filteredAdmissions = admissions.filter(adm => 
    adm.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adm.student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!date) return;
    setSaving(true);

    try {
      const attendanceData = admissions.map(adm => ({
        studentId: adm.student.id,
        batchId: adm.batchId,
        status: attendance[adm.student.id]?.status || 'present',
        notes: attendance[adm.student.id]?.notes || ''
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

  // Helper to check if slot is currently active
  const isSlotActiveNow = (slot: any) => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = (slot.startTime || '00:00').split(':').map(Number);
    const [eH, eM] = (slot.endTime || '00:00').split(':').map(Number);
    return currentMins >= (sH * 60 + sM - 15) && currentMins <= (eH * 60 + eM + 15);
  };

  const activeSlots = timeSlots.filter(isSlotActiveNow);
  

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2>Attendance Hub</h2>
            <p>Mark and track student attendance by batch time-slots.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline" 
              onClick={markAllPresent}
              disabled={filteredAdmissions.length === 0}
            >
              <FiCheck /> Mark All Present
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={saving || admissions.length === 0}
            >
              <FiSave /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      <div className="data-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
            <label>Filter by Time Slot</label>
            <select 
              className="form-control" 
              value={selectedTimeSlotId} 
              onChange={(e) => {
                setSelectedTimeSlotId(e.target.value);
                fetchAdmissions(e.target.value);
              }}
            >
              <option value="">All Students (Active Admissions)</option>
              {activeSlots.length > 0 && (
                <optgroup label="🔥 Ongoing Right Now">
                  {activeSlots.map(ts => (
                    <option key={`active-${ts.id}`} value={ts.id}>🟢 {ts.label} ({ts.startTime} - {ts.endTime})</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="All Time Slots">
                {timeSlots.map(ts => (
                  <option key={ts.id} value={ts.id}>
                    {isSlotActiveNow(ts) ? '🟢' : '⚪'} {ts.label} ({ts.startTime} - {ts.endTime})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
            <label>Search Student</label>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by name or enrollment..." 
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
            <label>Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={date} 
              onChange={(e) => {
                setDate(e.target.value);
                fetchAdmissions(selectedTimeSlotId);
              }} 
            />
          </div>
        </div>
      </div>

      <div className="data-card">
        {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading students...</div>
        ) : filteredAdmissions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>No students found.</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enrollment</th>
                  <th>Student Name</th>
                  <th>Course & Batch</th>
                  <th>Attendance Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.map(adm => {
                  const student = adm.student;
                  return (
                    <tr key={`${adm.id}-${student.id}`}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-accent)' }}>{student.enrollmentNo}</td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{adm.course?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{adm.batch?.name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            className={`btn btn-sm ${attendance[student.id]?.status === 'present' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => updateStatus(student.id, 'present')}
                            title="Present"
                          >
                            <FiCheck /> P
                          </button>
                          <button 
                            className={`btn btn-sm ${attendance[student.id]?.status === 'absent' ? 'btn-danger' : 'btn-outline'}`}
                            onClick={() => updateStatus(student.id, 'absent')}
                            style={attendance[student.id]?.status === 'absent' ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
                            title="Absent"
                          >
                            <FiX /> A
                          </button>
                          <button 
                            className={`btn btn-sm ${attendance[student.id]?.status === 'late' ? 'btn-warning' : 'btn-outline'}`}
                            onClick={() => updateStatus(student.id, 'late')}
                            style={attendance[student.id]?.status === 'late' ? { background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000' } : {}}
                            title="Late"
                          >
                            <FiClock /> L
                          </button>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          placeholder="Notes"
                          value={attendance[student.id]?.notes || ''}
                          onChange={(e) => setAttendance(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id], notes: e.target.value }
                          }))}
                        />
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
  );
}
