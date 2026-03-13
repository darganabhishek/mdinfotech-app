'use client';

import { useState, useRef } from 'react';
import { FiUpload, FiDownload, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface BulkActionsProps {
  type: 'users' | 'students' | 'faculty';
  onComplete: () => void;
}

export default function BulkActions({ type, onComplete }: BulkActionsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = {
    users: 'name,username,password,role\nAdmin User,admin123,pass123,staff',
    students: 'name,enrollmentNo,fatherName,motherName,phone,email,address,dob,gender,qualification,aadhaarNo\nJohn Doe,MD-2024-001,Father Name,Mother Name,9876543210,john@example.com,123 Street City,2000-01-01,male,Graduate,123456789012',
    faculty: 'name,email,phone,qualification,specialization,salary\nSarah Smith,sarah@example.com,9998887776,M.Tech,Python & AI,50000'
  };

  const handleDownloadTemplate = () => {
    const csv = templates[type];
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data);
      },
      error: (error) => {
        toast.error('Error parsing CSV: ' + error.message);
      }
    });
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);

    try {
      const res = await fetch('/api/bulk/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: preview })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Successfully imported ${result.count} ${type}`);
        setFile(null);
        setPreview([]);
        onComplete();
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch (error) {
      toast.error('Connection error during import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bulk-actions-container" style={{ 
      padding: '20px', 
      background: 'var(--bg-card)', 
      border: '1px solid var(--border-color)', 
      borderRadius: 'var(--radius-lg)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Bulk Actions</h3>
        <button className="btn btn-outline btn-sm" onClick={handleDownloadTemplate}>
          <FiDownload /> Template
        </button>
      </div>

      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand-blue-light)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <FiUpload style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Click to upload CSV file for {type}</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
        </div>
      ) : (
        <div className="preview-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '12px', background: 'rgba(57, 73, 171, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <FiCheck style={{ color: 'var(--success)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{preview.length} rows detected</div>
            </div>
            <button className="btn btn-icon btn-sm btn-outline" onClick={() => { setFile(null); setPreview([]); }}>
              <FiX />
            </button>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
             <table className="data-table" style={{ fontSize: '0.8rem' }}>
               <thead>
                 <tr>
                   {preview.length > 0 && Object.keys(preview[0]).map(key => (
                     <th key={key}>{key}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {preview.slice(0, 5).map((row, i) => (
                   <tr key={i}>
                     {Object.values(row).map((val: any, j) => (
                       <td key={j}>{val}</td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
             {preview.length > 5 && (
               <div style={{ padding: '8px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                 + {preview.length - 5} more rows...
               </div>
             )}
          </div>

          <div className="page-actions" style={{ justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleImport} 
              disabled={importing}
              style={{ width: '100%' }}
            >
              {importing ? 'Importing...' : `Import ${preview.length} ${type}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
