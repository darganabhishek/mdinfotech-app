'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSend, FiFileText, FiLink, FiUser, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NoticeManagementPage() {
  const [notices, setNotices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    target: 'all',
    courseId: '',
    studentId: '',
    fileUrl: '',
    link: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [nRes, cRes, sRes] = await Promise.all([
        fetch('/api/notices'),
        fetch('/api/courses'),
        fetch('/api/students')
      ]);
      if (nRes.ok) setNotices(await nRes.json());
      if (cRes.ok) setCourses(await cRes.json());
      if (sRes.ok) setStudents(await sRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Notice posted successfully');
        setIsModalOpen(false);
        setFormData({ title: '', content: '', type: 'text', target: 'all', courseId: '', studentId: '', fileUrl: '', link: '' });
        fetchData();
      } else {
        toast.error('Failed to post notice');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && notices.length === 0) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="admin-notices">
      <div className="page-header">
        <div>
          <h2>Notice Board Management</h2>
          <p>Broadcast messages, files, and links to students</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus /> New Notice
        </button>
      </div>

      <div className="data-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Target</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice: any) => (
                <tr key={notice.id}>
                  <td>{new Date(notice.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{notice.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notice.content?.substring(0, 50)}...</div>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {notice.target === 'all' ? 'Everyone' : 
                       notice.target === 'course' ? `Course: ${notice.course?.code}` : 
                       `Student: ${notice.student?.name}`}
                    </span>
                  </td>
                  <td>
                    {notice.type === 'file' ? <FiFileText /> : notice.type === 'link' ? <FiLink /> : <FiInfo />}
                  </td>
                  <td>
                    <button className="btn btn-icon btn-outline-danger" title="Delete"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Create New Notice</h3>
              <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20 }}>
              <div className="form-group">
                <label>Title</label>
                <input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea className="form-control" rows={3} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="text">Just Message</option>
                    <option value="file">File/Document</option>
                    <option value="link">URL Link</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Audience</label>
                  <select className="form-control" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})}>
                    <option value="all">All Students</option>
                    <option value="course">Specific Course</option>
                    <option value="student">Specific Student</option>
                  </select>
                </div>
              </div>

              {formData.target === 'course' && (
                <div className="form-group">
                  <label>Select Course</label>
                  <select className="form-control" value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} required>
                    <option value="">Choose Course...</option>
                    {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
              )}

              {formData.target === 'student' && (
                <div className="form-group">
                  <label>Select Student</label>
                  <select className="form-control" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} required>
                    <option value="">Choose Student...</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNo})</option>)}
                  </select>
                </div>
              )}

              {formData.type === 'file' && (
                <div className="form-group">
                  <label>File URL</label>
                  <input className="form-control" placeholder="Link to document/PDF" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} />
                </div>
              )}

              {formData.type === 'link' && (
                <div className="form-group">
                  <label>External Link</label>
                  <input className="form-control" placeholder="https://example.com" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
                <FiSend /> {loading ? 'Posting...' : 'Post Notice'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: var(--bg-card); border-radius: 16px; width: 95%; max-height: 90vh; overflow-y: auto; }
        .modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
      `}</style>
    </div>
  );
}

import { FiX } from 'react-icons/fi';
