'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  FiHome, FiUsers, FiBook, FiLayers, FiUserPlus, FiDollarSign,
  FiFileText, FiMessageSquare, FiBarChart2, FiSettings, FiLogOut,
  FiMenu, FiX, FiAward, FiActivity, FiSun, FiMoon, FiShield
} from 'react-icons/fi';
import Providers from '@/components/Providers';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  { section: 'Main', items: [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  ]},
  { section: 'Management', items: [
    { href: '/dashboard/students', label: 'Students', icon: FiUsers },
    { href: '/dashboard/courses', label: 'Courses', icon: FiBook },
    { href: '/dashboard/batches', label: 'Batches', icon: FiLayers },
    { href: '/dashboard/admissions', label: 'Admissions', icon: FiUserPlus },
    { href: '/dashboard/faculty', label: 'Faculty Management', icon: FiUsers },
    { href: '/dashboard/attendance', label: 'Attendance Hub', icon: FiActivity },
    { href: '/dashboard/timetable', label: 'Timetable', icon: FiLayers },
    { href: '/dashboard/resources', label: 'Resources', icon: FiSettings },
  ]},
  { section: 'Secure Attendance', items: [
    { href: '/dashboard/attendance/session', label: 'Start QR Session', icon: FiActivity },
    { href: '/dashboard/attendance/scan', label: 'Scan QR Code', icon: FiActivity },
    { href: '/dashboard/attendance/clock', label: 'Faculty Clock', icon: FiActivity },
    { href: '/dashboard/security-alerts', label: 'Security Alerts', icon: FiShield },
  ]},
  { section: 'Finance', items: [
    { href: '/dashboard/fees', label: 'Fee Management', icon: FiDollarSign },
    { href: '/dashboard/payments', label: 'Payments', icon: FiDollarSign },
    { href: '/dashboard/receipts', label: 'Receipts', icon: FiFileText },
    { href: '/dashboard/payroll', label: 'Payroll', icon: FiDollarSign },
    { href: '/dashboard/analytics', label: 'Course Analytics', icon: FiBarChart2 },
    { href: '/dashboard/referrals', label: 'Referral Program', icon: FiUserPlus },
  ]},
  { section: 'Academics', items: [
    { href: '/dashboard/student', label: 'Student Portal', icon: FiBook },
    { href: '/dashboard/elearning', label: 'E-learning Hub', icon: FiFileText },
  ]},
  { section: 'Other', items: [
    { href: '/dashboard/enquiries', label: 'Enquiries', icon: FiMessageSquare },
    { href: '/dashboard/certificates', label: 'Certificates', icon: FiAward },
    { href: '/dashboard/reports', label: 'Reports', icon: FiBarChart2 },
    { href: '/dashboard/settings', label: 'Settings', icon: FiSettings },
    { href: '/dashboard/users', label: 'User Accounts', icon: FiUsers },
    { href: '/dashboard/settings/roles', label: 'Role Management', icon: FiShield },
    { href: '/dashboard/logs', label: 'Audit Logs', icon: FiActivity },
  ]},
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getPageTitle = () => {
    for (const section of navItems) {
      for (const item of section.items) {
        if (pathname === item.href) return item.label;
      }
    }
    if (pathname?.includes('/receipts/')) return 'Payment Receipt';
    return 'Dashboard';
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="M.D. INFOTECH" />
          <button
            className="mobile-toggle"
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: 'auto' }}
          >
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div className="sidebar-section" key={section.section}>
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="nav-icon" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}
          >
            <FiLogOut className="nav-icon" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
              <FiMenu />
            </button>
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="top-bar-right">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
            <div className="user-menu">
              <div className="user-avatar">
                {session?.user?.name?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <div className="user-name">{session?.user?.name || 'Admin'}</div>
                <div className="user-role">{(session?.user as any)?.role || 'admin'}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none'
          }}
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-overlay { display: block !important; }
          .dashboard-layout { position: relative; width: 100vw; overflow-x: hidden; }
          .main-content { min-width: 100vw; }
        }

        .theme-toggle {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all var(--transition-fast);
        }
        
        .theme-toggle:hover {
          background: var(--bg-card-hover);
          border-color: var(--brand-blue-light);
          color: var(--brand-blue-light);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  );
}
