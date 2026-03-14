'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  FiHome, FiUsers, FiBook, FiLayers, FiUserPlus, FiDollarSign,
  FiFileText, FiMessageSquare, FiBarChart2, FiSettings, FiLogOut,
  FiMenu, FiX, FiAward, FiActivity, FiSun, FiMoon, FiShield
} from 'react-icons/fi';
import Providers from '@/components/Providers';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  { section: 'Main', items: [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome, permissions: ['student_portal', 'teacher_portal', 'manage_settings', 'view_reports', 'manage_students'] }, // Basically everyone should see this, but data varies
  ]},
  { section: 'Management', items: [
    { href: '/dashboard/students', label: 'Students', icon: FiUsers, permissions: ['manage_students'] },
    { href: '/dashboard/courses', label: 'Courses', icon: FiBook, permissions: ['manage_courses'] },
    { href: '/dashboard/batches', label: 'Batches', icon: FiLayers, permissions: ['manage_batches'] },
    { href: '/dashboard/admissions', label: 'Admissions', icon: FiUserPlus, permissions: ['manage_admissions'] },
    { href: '/dashboard/faculty', label: 'Faculty Management', icon: FiUsers, permissions: ['manage_users'] },
    { href: '/dashboard/attendance', label: 'Attendance Hub', icon: FiActivity, permissions: ['manage_students', 'teacher_portal'] },
    { href: '/dashboard/timetable', label: 'Timetable', icon: FiLayers, permissions: ['manage_batches', 'teacher_portal'] },
    { href: '/dashboard/resources', label: 'Resources', icon: FiSettings, permissions: ['manage_settings'] },
  ]},
  { section: 'Secure Attendance', items: [
    { href: '/dashboard/attendance/session', label: 'Start QR Session', icon: FiActivity, permissions: ['teacher_portal', 'manage_students'] },
    { href: '/dashboard/attendance/scan', label: 'Scan QR Code', icon: FiActivity, permissions: ['teacher_portal', 'manage_students'] },
    { href: '/dashboard/attendance/clock', label: 'Faculty Clock', icon: FiActivity, permissions: ['teacher_portal'] },
    { href: '/dashboard/security-alerts', label: 'Security Alerts', icon: FiShield, permissions: ['manage_settings'] },
  ]},
  { section: 'Finance', items: [
    { href: '/dashboard/fees', label: 'Fee Management', icon: FiDollarSign, permissions: ['manage_payments'] },
    { href: '/dashboard/payments', label: 'Payments', icon: FiDollarSign, permissions: ['manage_payments'] },
    { href: '/dashboard/receipts', label: 'Receipts', icon: FiFileText, permissions: ['manage_payments'] },
    { href: '/dashboard/payroll', label: 'Payroll', icon: FiDollarSign, permissions: ['manage_payments', 'manage_users'] },
    { href: '/dashboard/analytics', label: 'Course Analytics', icon: FiBarChart2, permissions: ['view_reports'] },
    { href: '/dashboard/referrals', label: 'Referral Program', icon: FiUserPlus, permissions: ['manage_admissions'] },
  ]},
  { section: 'Academics', items: [
    { href: '/dashboard/student', label: 'Student Portal', icon: FiBook, permissions: ['student_portal'] },
    { href: '/dashboard/elearning', label: 'E-learning Hub', icon: FiFileText, permissions: ['teacher_portal', 'student_portal', 'manage_courses'] },
  ]},
  { section: 'Other', items: [
    { href: '/dashboard/enquiries', label: 'Enquiries', icon: FiMessageSquare, permissions: ['manage_admissions'] },
    { href: '/dashboard/certificates', label: 'Certificates', icon: FiAward, permissions: ['manage_students'] },
    { href: '/dashboard/reports', label: 'Reports', icon: FiBarChart2, permissions: ['view_reports'] },
    { href: '/dashboard/settings', label: 'Settings', icon: FiSettings, permissions: ['manage_settings'] },
    { href: '/dashboard/users', label: 'User Accounts', icon: FiUsers, permissions: ['manage_users'] },
    { href: '/dashboard/settings/roles', label: 'Role Management', icon: FiShield, permissions: ['manage_settings'] },
    { href: '/dashboard/logs', label: 'Audit Logs', icon: FiActivity, permissions: ['manage_settings'] },
  ]},
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [dbRole, setDbRole] = useState<string | null>(null);
  const [dbPermissions, setDbPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/users/me/permissions')
        .then(res => res.json())
        .then(data => {
          if (data.role) setDbRole(data.role);
          if (data.permissions) setDbPermissions(data.permissions);
        })
        .catch(console.error);
    }
  }, [session]);

  const userRole = dbRole || (session?.user as any)?.role || 'staff';
  const userPermissions = dbPermissions || (session?.user as any)?.permissions || [];

  const hasPermission = (permissions?: string[]) => {
    if (userRole === 'admin' || userRole === 'superadmin') return true;
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(p => userPermissions.includes(p));
  };

  const filteredNavItems = navItems.map(section => ({
    ...section,
    items: section.items.filter(item => item.href === '/dashboard' || hasPermission(item.permissions))
  })).filter(section => section.items.length > 0);

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
          {filteredNavItems.map((section) => (
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
