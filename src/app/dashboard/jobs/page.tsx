'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiBriefcase, FiMapPin, FiExternalLink, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileJobsPortal from '@/components/academics/MobileJobsPortal';
import BottomSheet from '@/components/mobile/BottomSheet';

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    link: ''
  });
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) setJobs(await res.json());
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Job posted successfully');
        setIsModalOpen(false);
        setFormData({ title: '', company: '', description: '', location: '', link: '' });
        fetchJobs();
      } else {
        toast.error('Failed to post job');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && jobs.length === 0) return <div className="page-loading"><div className="loading-spinner" /></div>;

  if (isMobile) {
    return (
      <div className="mobile-jobs">
        <MobileJobsPortal 
          jobs={jobs} 
          isFaculty={true} 
          onDelete={async (id) => {
            if (confirm('Delete this job post?')) {
              await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
              fetchJobs();
            }
          }} 
        />
        
        <BottomSheet 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Post Job Opportunity"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Job Title</label>
              <input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Web Developer" required />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input className="form-control" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Company Name" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Remote" />
              </div>
              <div className="form-group">
                <label>Link</label>
                <input className="form-control" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Job description..." required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20, height: 48 }} disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </form>
        </BottomSheet>

        {!isModalOpen && (
          <button className="mobile-fab" onClick={() => setIsModalOpen(true)}>
            <FiPlus />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="admin-jobs">
      <div className="page-header">
        <div>
          <h2>Jobs Portal Management</h2>
          <p>Post recent job opportunities for students</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus /> Post New Job
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {jobs.map((job: any) => (
          <div key={job.id} className="data-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="kpi-icon blue" style={{ width: 40, height: 40, fontSize: '1.2rem' }}><FiBriefcase /></div>
              <button 
                className="btn btn-icon btn-outline-danger btn-sm" 
                title="Delete"
                onClick={async () => {
                  if (confirm('Delete this job post?')) {
                    try {
                      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        toast.success('Job deleted');
                        fetchJobs();
                      } else {
                        toast.error('Failed to delete');
                      }
                    } catch {
                      toast.error('Connection error');
                    }
                  }
                }}
              >
                <FiTrash2 />
              </button>
            </div>
            <h4 style={{ margin: '0 0 4px' }}>{job.title}</h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>{job.company}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              <FiMapPin /> {job.location}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, minHeight: 60 }}>{job.description}</p>
            {job.link && (
              <a href={job.link} target="_blank" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                <FiExternalLink /> Review Post & Apply
              </a>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Post Job Opportunity</h3>
              <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20 }}>
              <div className="form-group">
                <label>Job Title</label>
                <input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Junior Web Developer" required />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input className="form-control" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="e.g. Tech Solutions Inc." required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Remote / Delhi" />
                </div>
                <div className="form-group">
                  <label>Apply Link</label>
                  <input className="form-control" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://linkedin.com/jobs/..." />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Briefly describe the job role and requirements..." required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
                {loading ? 'Posting...' : 'Post Job'}
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
