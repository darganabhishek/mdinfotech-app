'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiBookOpen, FiX, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import BulkActions from '@/components/dashboard/BulkActions';

interface Faculty {
  id: number;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  joiningDate: string;
  salary: number;
  active: boolean;
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: 0,
    active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/faculty');
      const data = await res.json();
      setFaculty(data);
    } catch (error) {
      toast.error('Failed to fetch faculty data');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = 'Name,Email,Phone,Qualification,Specialization,Salary,Status\n';
    const rows = faculty.map(f => 
      `"${f.name}","${f.email}","${f.phone}","${f.qualification}","${f.specialization}",${f.salary},"${f.active ? 'Active' : 'Inactive'}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faculty_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleOpenModal = (f: Faculty | null = null) => {
    if (f) {
      setEditingFaculty(f);
      setFormData({
        name: f.name,
        email: f.email,
        phone: f.phone,
        qualification: f.qualification,
        specialization: f.specialization,
        joiningDate: f.joiningDate || '',
        salary: f.salary,
        active: f.active,
      });
    } else {
      setEditingFaculty(null);
      setFormData({
        name: '', email: '', phone: '', qualification: '',
        specialization: '', joiningDate: new Date().toISOString().split('T')[0],
        salary: 0, active: true
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingFaculty ? 'PUT' : 'POST';
    const url = editingFaculty ? `/api/faculty/${editingFaculty.id}` : '/api/faculty';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Faculty ${editingFaculty ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save faculty');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="faculty-page">
      <div className="page-header">
        <div>
          <h2>Faculty Management</h2>
          <p>Manage teacher profiles, qualifications, and schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowBulk(!showBulk)}>
            {showBulk ? 'Hide Bulk' : 'Bulk Import'}
          </button>
          <button className="btn btn-outline" onClick={exportCSV}>
             <FiDownload /> Export
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus /> Add Faculty
          </button>
        </div>
      </div>

      {showBulk && (
        <BulkActions type="faculty" onComplete={fetchData} />
      )}

      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-header">
            <div className="kpi-icon green"><FiUsers /></div>
          </div>
          <div className="kpi-value">{faculty.length}</div>
          <div className="kpi-label">Active Teachers</div>
        </div>
      </div>

      <div className="data-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Instructor Name</th>
                <th>Specialization</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.qualification}</div>
                  </td>
                  <td>{f.specialization}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        <FiMail size={12} /> {f.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        <FiPhone size={12} /> {f.phone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${f.active ? 'badge-success' : 'badge-danger'}`}>
                      {f.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="page-actions">
                      <button className="btn btn-sm btn-outline btn-icon" onClick={() => handleOpenModal(f)}>
                        <FiEdit2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="data-card-header">
              <h3>{editingFaculty ? 'Edit Faculty Profile' : 'New Faculty Member'}</h3>
              <button className="btn btn-icon btn-outline" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="page-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Specialization (Subjects)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. MS Office, Tally, Python"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Highest Qualification</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Salary (INR)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active Faculty Member
                </label>
              </div>

              <div className="page-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingFaculty ? 'Update Profile' : 'Save Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
