'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiBook, FiClock, FiFileText, FiCamera, FiCheckCircle } from 'react-icons/fi';

export default function RegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', fatherName: '', motherName: '',
    dob: '', gender: '', address: '', city: 'Noida', state: 'Uttar Pradesh',
    pincode: '', qualification: '', aadhaarNo: '', prevKnowledge: '',
    courseId: '', batchTiming: '', dateOfJoining: new Date().toISOString().split('T')[0], photo: ''
  });
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error('Failed to fetch courses', err));
  }, []);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Quality 0.6 to keep size very small (~50-100KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFileError('Only JPG/PNG images are allowed.');
      return;
    }
    
    setFileError('');
    setLoading(true);
    try {
      const compressedBase64 = await compressImage(file);
      setForm({ ...form, photo: compressedBase64 });
    } catch (err) {
      setFileError('Error processing photo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) {
      alert('Please upload a recent photograph (JPG/PNG < 5MB).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 5000);
      } else {
        alert('Registration failed. Please try again.');
      }
    } catch (err) {
      alert('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-success">
        <div className="success-content">
          <FiCheckCircle className="success-icon" />
          <h1>Registration Successful!</h1>
          <p>Your application has been submitted to <strong>M.D. INFOTECH</strong>.</p>
          <p>Our team will contact you shortly regarding the next steps.</p>
          <button className="btn btn-primary" onClick={() => router.push('/login')}>Go to Login</button>
        </div>
        <style jsx>{`
          .registration-success { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5; padding: 20px; }
          .success-content { background: white; padding: 48px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 100%; animate: slideUp 0.5s ease; }
          .success-icon { font-size: 80px; color: #4caf50; margin-bottom: 24px; }
          h1 { margin-bottom: 16px; color: #1a237e; font-weight: 800; }
          p { color: #666; margin-bottom: 12px; font-size: 1.1rem; }
          button { margin-top: 24px; }
          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <img src="/logo.png" alt="M.D. INFOTECH" className="reg-logo" />
          <h1>Admission Form</h1>
          <p>Join M.D. INFOTECH Computer Education</p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          {/* Personal Information */}
          <div className="form-section">
            <h3><FiUser /> Personal Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Name of the Candidate *</label>
                <div className="input-with-icon">
                  <FiUser className="icon" />
                  <input type="text" required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Father's Name *</label>
                <input type="text" required placeholder="Father's Name" value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Mother's Name *</label>
                <input type="text" required placeholder="Mother's Name" value={form.motherName} onChange={e => setForm({...form, motherName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <div className="input-with-icon">
                  <FiCalendar className="icon" />
                  <input type="date" required value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select required value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Recent Photograph (JPG/PNG, max 5MB) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="input-with-icon" style={{ flex: 1, position: 'relative' }}>
                    <FiCamera className="icon" style={{ position: 'absolute', left: '14px', top: '14px', color: '#1a237e', opacity: 0.6 }} />
                    <input type="file" accept=".jpg,.jpeg,.png" required={!form.photo} onChange={handleFileChange} style={{ width: '100%', padding: '12px 16px', paddingLeft: '44px', border: '2px solid #eef0f7', borderRadius: '12px' }} />
                  </div>
                  {form.photo && <img src={form.photo} alt="Preview" style={{ height: '50px', width: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />}
                </div>
                {fileError && <span style={{ color: '#ff5252', fontSize: '0.8rem', marginTop: '4px' }}>{fileError}</span>}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h3><FiPhone /> Contact & Identity</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number *</label>
                <div className="input-with-icon">
                  <FiPhone className="icon" />
                  <input type="tel" required placeholder="10-digit mobile" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-with-icon">
                  <FiMail className="icon" />
                  <input type="email" required placeholder="email@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Full Address *</label>
                <div className="input-with-icon">
                  <FiMapPin className="icon" />
                  <textarea required placeholder="House No, Area, Locality" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Aadhaar Card No. *</label>
                <input type="text" required placeholder="12-digit Aadhaar" value={form.aadhaarNo} onChange={e => setForm({...form, aadhaarNo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Qualification *</label>
                <select required value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})}>
                  <option value="">Select Qualification</option>
                  <option value="10th">10th</option>
                  <option value="12th">12th</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="form-section">
            <h3><FiBook /> Course & Admission</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Select Course *</label>
                <div className="input-with-icon">
                  <FiBook className="icon" />
                  <select required value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})}>
                    <option value="">Choose your course...</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name} ({course.code}) - ₹{course.fee}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Preferred Batch Timing *</label>
                <div className="input-with-icon">
                  <FiClock className="icon" />
                  <input type="text" required placeholder="e.g. 10:00 AM - 12:00 PM" value={form.batchTiming} onChange={e => setForm({...form, batchTiming: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Date of Joining *</label>
                <input type="date" required value={form.dateOfJoining} onChange={e => setForm({...form, dateOfJoining: e.target.value})} />
              </div>
              <div className="form-group full-width">
                <label>Previous Knowledge in Computers *</label>
                <div className="input-with-icon">
                  <FiFileText className="icon" />
                  <textarea required placeholder="Tell us about your computer background..." value={form.prevKnowledge} onChange={e => setForm({...form, prevKnowledge: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-footer">
            <p className="form-note">By submitting, you agree to the institute's terms and conditions.</p>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Submitting Application...' : 'Submit Admission Form'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .registration-page { background: #f8faff; min-height: 100vh; padding: 40px 20px; font-family: 'Inter', sans-serif; }
        .registration-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.05); overflow: hidden; }
        .registration-header { background: #1a237e; color: white; padding: 40px; text-align: center; }
        .reg-logo { height: 80px; background: white; padding: 12px 20px; border-radius: 16px; margin-bottom: 20px; }
        .registration-header h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        .registration-header p { opacity: 0.9; font-size: 1.1rem; }
        
        .registration-form { padding: 40px; }
        .form-section { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #f0f0f0; }
        .form-section h3 { display: flex; align-items: center; gap: 10px; font-size: 1.25rem; font-weight: 700; color: #1a237e; margin-bottom: 24px; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .full-width { grid-column: span 2; }
        
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.85rem; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .input-with-icon { position: relative; }
        .input-with-icon .icon { position: absolute; left: 14px; top: 14px; color: #1a237e; opacity: 0.6; }
        .input-with-icon input, .input-with-icon select, .input-with-icon textarea { padding-left: 44px; }
        
        input, select, textarea { 
          width: 100%; padding: 12px 16px; border: 2px solid #eef0f7; border-radius: 12px; 
          font-size: 1rem; color: #111; transition: all 0.2s; background: #fbfcfe;
        }
        input:focus, select:focus, textarea:focus { border-color: #3949ab; background: white; outline: none; box-shadow: 0 0 0 4px rgba(57, 73, 171, 0.1); }
        textarea { min-height: 100px; resize: vertical; }
        
        .form-footer { text-align: center; margin-top: 20px; }
        .form-note { font-size: 0.85rem; color: #888; margin-bottom: 24px; }
        
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
          .full-width { grid-column: auto; }
          .registration-header { padding: 30px 20px; }
          .registration-form { padding: 24px; }
        }
      `}</style>
    </div>
  );
}
