'use client';

import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <div className={`bottom-sheet-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className={`bottom-sheet ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <h3>{title}</h3>
          <button className="bottom-sheet-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>

      <style jsx>{`
        .bottom-sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(2px);
        }
        .bottom-sheet-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .bottom-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border-radius: 20px 20px 0 0;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        .bottom-sheet.open {
          transform: translateY(0);
        }
        .bottom-sheet-handle {
          width: 40px;
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          margin: 12px auto;
        }
        .bottom-sheet-header {
          padding: 0 20px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
        }
        .bottom-sheet-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .bottom-sheet-close {
          background: var(--bg-secondary);
          border: none;
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .bottom-sheet-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
      `}</style>
    </div>
  );
}
