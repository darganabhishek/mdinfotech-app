'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiFileText, FiVideo, FiLink, FiX, FiDownload, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ElearningPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'link', url: '', courseId: '', facultyId: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [resRes, courseRes, facRes] = await Promise.all([
        fetch('/api/resources'), fetch('/api/courses'), fetch('/api/faculty')
      ]);
      setResources(await resRes.json());
      setCourses(await courseRes.json());
      setFaculty(await facRes.json());
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Resource added!');
        setModalOpen(false);
        setFormData({ title: '', description: '', type: 'link', url: '', courseId: '', facultyId: '' });
        fetchData();
      } else { toast.error('Failed to add resource'); }
    } catch { toast.error('Network error'); }
  };

  const typeIcons: Record<string, any> = {
    video: <FiVideo />, pdf: <FiFileText />, link: <FiLink />, doc: <FiFileText />
  };

  const typeColors: Record<string, string> = {
    video: '#e74c3c', pdf: '#3498db', link: '#2ecc71', doc: '#f39c12'
  };

  const filteredResources = filterCourse
    ? resources.filter(r => r.courseId === parseInt(filterCourse))
    : resources;

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="elearning-page">
      <div className="page-header">
        <div>
          <h2>E-learning Hub</h2>
          <p>Browse study materials, videos, and resources ({resources.length} total)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="form-control" style={{ width: 'auto' }} value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <FiPlus /> Add Resource
          </button>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No Resources Yet</h3>
          <p>Add study materials for students to access.</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><FiPlus /> Add First Resource</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredResources.map((r: any) => (
            <div key={r.id} className="data-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                  background: `${typeColors[r.type]}22`, color: typeColors[r.type],
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                }}>
                  {typeIcons[r.type] || <FiFileText />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{r.type}</div>
                </div>
              </div>
              {r.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{r.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{r.course?.name || 'General'}</span>
                <a href={r.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                  <FiDownload /> Open
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Add New Resource</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input className="form-control" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Python Basics Tutorial" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <select className="form-control" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                      <option value="link">Link</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="doc">Document</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Course</label>
                    <select className="form-control" value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })}>
                      <option value="">General (No Course)</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>URL / Link *</label>
                  <input className="form-control" required value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
