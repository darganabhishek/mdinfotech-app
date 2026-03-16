'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit, FiLock, FiUnlock, FiLayers, FiX, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileAssignments from '@/components/academics/MobileAssignments';
import BottomSheet from '@/components/mobile/BottomSheet';

export default function AssignmentsManagementPage() {
  const [assignments, setAssignments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const toggleLock = async (id: string, isLocked: boolean) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked })
      });
      if (res.ok) {
        toast.success(isLocked ? 'Assignment locked' : 'Assignment unlocked');
        fetchData();
      }
    } catch { toast.error('Error updating status'); }
  };

  const [formData, setFormData] = useState({
    title: '', description: '', dueDate: '', 
    batchId: '', facultyId: '', topicId: '',
    isLocked: false
  });

  const [topicData, setTopicData] = useState({ name: '', courseId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assRes, topRes, batRes, couRes, facRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/topics'),
        fetch('/api/batches'),
        fetch('/api/courses'),
        fetch('/api/faculty')
      ]);
      if (assRes.ok) setAssignments(await assRes.json());
      if (topRes.ok) setTopics(await topRes.json());
      if (batRes.ok) setBatches(await batRes.json());
      if (couRes.ok) setCourses(await couRes.json());
      if (facRes.ok) setFaculty(await facRes.json());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Assignment created');
        setIsModalOpen(false);
        setFormData({ title: '', description: '', dueDate: '', batchId: '', facultyId: '', topicId: '', isLocked: false });
        fetchData();
      }
    } catch { toast.error('Error creating assignment'); }
    finally { setLoading(false); }
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
      });
      if (res.ok) {
        toast.success('Topic added');
        setIsTopicModalOpen(false);
        setTopicData({ name: '', courseId: '' });
        fetchData();
      }
    } catch { toast.error('Error adding topic'); }
    finally { setLoading(false); }
  };

  if (loading && assignments.length === 0) return <div className="page-loading"><div className="loading-spinner" /></div>;

  if (isMobile) {
    return (
      <div className="mobile-assignments">
        <MobileAssignments 
          assignments={assignments} 
          isFaculty={true} 
          onDelete={async (id) => {
            if (confirm('Delete this assignment?')) {
              await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
              fetchData();
            }
          }}
          onToggleLock={toggleLock}
        />
        
        <BottomSheet 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Create Assignment"
        >
          <form onSubmit={handleAssignmentSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Batch</label>
              <select className="form-control" required value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})}>
                <option value="">Select Batch...</option>
                {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.course?.code})</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" className="form-control" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Topic</label>
                <select className="form-control" value={formData.topicId} onChange={e => setFormData({...formData, topicId: e.target.value})}>
                  <option value="">General</option>
                  {topics.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.course?.code})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' }}>
              <input type="checkbox" id="mob-locked" checked={formData.isLocked} onChange={e => setFormData({...formData, isLocked: e.target.checked})} />
              <label htmlFor="mob-locked">Lock initially</label>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ height: 48 }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </form>
        </BottomSheet>

        <BottomSheet 
          isOpen={isTopicModalOpen} 
          onClose={() => setIsTopicModalOpen(false)}
          title="Add New Topic"
        >
          <form onSubmit={handleTopicSubmit}>
            <div className="form-group">
              <label>Topic Name</label>
              <input className="form-control" required value={topicData.name} onChange={e => setTopicData({...topicData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Course</label>
              <select className="form-control" required value={topicData.courseId} onChange={e => setTopicData({...topicData, courseId: e.target.value})}>
                <option value="">Select Course...</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20, height: 48 }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Topic'}
            </button>
          </form>
        </BottomSheet>

        <div style={{ position: 'fixed', right: 16, bottom: 'calc(var(--mobile-nav-height) + 16px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="mobile-fab" style={{ background: 'var(--bg-secondary)', color: 'var(--brand-blue-light)', width: 48, height: 48 }} onClick={() => setIsTopicModalOpen(true)}>
            <FiLayers />
          </button>
          <button className="mobile-fab" onClick={() => setIsModalOpen(true)}>
            <FiPlus />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-assignments">
      <div className="page-header">
        <div>
          <h2>Assignments & Curriculum</h2>
          <p>Organize coursework by topics and manage student submissions</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => setIsTopicModalOpen(true)}>
            <FiLayers /> New Topic
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <FiPlus /> New Assignment
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar for filtering or topic management */}
        <div style={{ width: 250 }}>
          <div className="data-card" style={{ padding: 16 }}>
            <h4 style={{ marginBottom: 16 }}>Courses & Topics</h4>
            {courses.map((course: any) => (
              <div key={course.id} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{course.code}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {topics.filter((t: any) => t.courseId === course.id).map((topic: any) => (
                    <div key={topic.id} style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {topic.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main List */}
        <div style={{ flex: 1 }}>
          <div className="data-card">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Topic / Course</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((ass: any) => (
                    <tr key={ass.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ass.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {ass.dueDate}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>{ass.topic?.name || 'Uncategorized'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ass.batch?.course?.code}</div>
                      </td>
                      <td>{ass.batch?.name}</td>
                      <td>
                        <span className={`badge ${ass.isLocked ? 'badge-danger' : 'badge-active'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          {ass.isLocked ? <><FiLock /> Locked</> : <><FiUnlock /> Active</>}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-icon btn-outline-primary" title="Edit"><FiEdit /></button>
                          <button className="btn btn-icon btn-outline-danger" title="Delete"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3>Create Assignment</h3>
              <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleAssignmentSubmit} style={{ padding: 20 }}>
              <div className="form-group">
                <label>Title</label>
                <input className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Batch</label>
                  <select className="form-control" required value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})}>
                    <option value="">Select Batch...</option>
                    {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.course?.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" className="form-control" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Faculty</label>
                  <select className="form-control" required value={formData.facultyId} onChange={e => setFormData({...formData, facultyId: e.target.value})}>
                    <option value="">Select Faculty...</option>
                    {faculty.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Topic (Optional)</label>
                  <select className="form-control" value={formData.topicId} onChange={e => setFormData({...formData, topicId: e.target.value})}>
                    <option value="">General</option>
                    {topics.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.course?.code})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                <input type="checkbox" id="isLocked" checked={formData.isLocked} onChange={e => setFormData({...formData, isLocked: e.target.checked})} />
                <label htmlFor="isLocked">Lock this assignment for students initially</label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={loading}>
                {loading ? 'Creating...' : 'Create Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {isTopicModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Add New Topic</h3>
              <button className="btn btn-icon" onClick={() => setIsTopicModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleTopicSubmit} style={{ padding: 20 }}>
              <div className="form-group">
                <label>Topic Name</label>
                <input className="form-control" required value={topicData.name} onChange={e => setTopicData({...topicData, name: e.target.value})} placeholder="e.g. Introduction to React" />
              </div>
              <div className="form-group">
                <label>For Course</label>
                <select className="form-control" required value={topicData.courseId} onChange={e => setTopicData({...topicData, courseId: e.target.value})}>
                  <option value="">Select Course...</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
                {loading ? 'Adding...' : 'Add Topic'}
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
