'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiLock, FiArrowRight, FiAlertCircle } from 'react-icons/fi';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Dynamic Background Elements */}
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      <div className="bg-blob bg-blob-3"></div>
      
      <div className="login-container">
        <div className="login-glass-card">
          <div className="login-header">
            <div className="brand-logo-wrapper">
              <img src="/logo.png" alt="M.D. INFOTECH" className="brand-logo" />
            </div>
            <h1>Welcome Back</h1>
            <p className="subtitle">Institute Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error-alert">
                <FiAlertCircle className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="modern-input-group">
              <label>Username</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="modern-input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="premium-login-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-state">
                  <span className="spinner-dot"></span>
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="btn-arrow" />
                </>
              )}
            </button>
          </form>

          <footer className="login-footer">
            <p>Designed & Developed by Abhishek Dargan</p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .login-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Animated Blobs */
        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.6;
          animation: blob-float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bg-blob-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%);
          top: -10%;
          left: -10%;
        }

        .bg-blob-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          bottom: -5%;
          right: -5%;
          animation-delay: -5s;
        }

        .bg-blob-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);
          top: 30%;
          right: 20%;
          animation-delay: -10s;
        }

        @keyframes blob-float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
          100% { transform: translate(-20px, 60px) scale(0.9); }
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 24px;
          position: relative;
          z-index: 10;
        }

        .login-glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 48px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: card-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes card-appear {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .brand-logo-wrapper {
          background: white;
          width: 120px;
          height: 50px;
          margin: 0 auto 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .brand-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        h1 {
          color: white;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
        }

        .subtitle {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .login-error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: #f87171;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modern-input-group label {
          display: block;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          margin-left: 4px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #64748b;
          font-size: 18px;
          transition: color 0.3s ease;
        }

        input {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 14px 16px 14px 44px;
          color: white;
          font-size: 15px;
          transition: all 0.3s ease;
          outline: none;
        }

        input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background: rgba(15, 23, 42, 0.8);
        }

        input:focus + .input-icon {
          color: #3b82f6;
        }

        .premium-login-btn {
          margin-top: 8px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
        }

        .premium-login-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.5);
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        }

        .premium-login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .premium-login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: #475569;
          box-shadow: none;
        }

        .btn-arrow {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .premium-login-btn:hover .btn-arrow {
          transform: translateX(4px);
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .spinner-dot {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 40px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        @media (max-width: 480px) {
          .login-glass-card {
            padding: 40px 24px;
          }
        }
      `}</style>
    </div>
  );
}
