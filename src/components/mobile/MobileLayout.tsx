'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/context/ThemeContext';
import { 
  FiHome, FiUsers, FiBook, FiLayers, FiUserPlus, FiDollarSign,
  FiFileText, FiMessageSquare, FiBarChart2, FiSettings, FiLogOut,
  FiAward, FiActivity, FiShield, FiSun, FiMoon, FiUser, FiPlus
} from 'react-icons/fi';

interface MobileLayoutProps {
  children: React.ReactNode;
  userRole: string;
  userPermissions: string[];
  pageTitle: string;
  userName?: string;
}

const navItems = [
  { section: 'Main', class: 'cat-main', items: [
    { href: '/dashboard', label: 'Home', icon: FiHome, permissions: [] },
  ]},
  { section: 'Management', class: 'cat-management', items: [
    { href: '/dashboard/students', label: 'Students', icon: FiUsers, permissions: ['manage_students'] },
    { href: '/dashboard/courses', label: 'Courses', icon: FiBook, permissions: ['manage_courses'] },
    { href: '/dashboard/batches', label: 'Batches', icon: FiLayers, permissions: ['manage_batches'] },
    { href: '/dashboard/admissions', label: 'Admissions', icon: FiUserPlus, permissions: ['manage_admissions'] },
    { href: '/dashboard/faculty', label: 'Faculty', icon: FiUsers, permissions: ['manage_users'], isAdminOnly: true },
    { href: '/dashboard/attendance', label: 'Attendance', icon: FiActivity, permissions: ['manage_students', 'faculty_portal'] },
  ]},
  { section: 'Secure', class: 'cat-secure', items: [
    { href: '/dashboard/attendance/clock', label: 'Clock', icon: FiActivity, permissions: ['faculty_portal'] },
    { href: '/dashboard/security-alerts', label: 'Alerts', icon: FiShield, permissions: ['manage_settings'] },
  ]},
  { section: 'Finance', class: 'cat-finance', items: [
    { href: '/dashboard/fees', label: 'Fees', icon: FiDollarSign, permissions: ['manage_payments'] },
    { href: '/dashboard/payments', label: 'Pay', icon: FiDollarSign, permissions: ['manage_payments'] },
    { href: '/dashboard/referrals', label: 'Referral', icon: FiUserPlus, permissions: ['manage_admissions'] },
  ]},
  { section: 'Academics', class: 'cat-academics', items: [
    { href: '/dashboard/notices', label: 'Notices', icon: FiMessageSquare, permissions: ['faculty_portal', 'manage_students'] },
    { href: '/dashboard/assignments', label: 'Assigns', icon: FiFileText, permissions: ['faculty_portal', 'manage_students'] },
    { href: '/dashboard/student', label: 'Portal', icon: FiBook, permissions: ['student_portal'] },
    { href: '/dashboard/elearning', label: 'E-Hub', icon: FiFileText, permissions: ['faculty_portal', 'student_portal', 'manage_courses'] },
  ]},
  { section: 'Other', class: 'cat-other', items: [
    { href: '/dashboard/certificates', label: 'Certs', icon: FiAward, permissions: ['manage_students'] },
    { href: '/dashboard/users', label: 'Users', icon: FiUsers, permissions: ['manage_users'], isAdminOnly: true },
    { href: '/dashboard/settings', label: 'Settings', icon: FiSettings, permissions: ['manage_settings'], isAdminOnly: true },
  ]},
];

export default function MobileLayout({
  children,
  userRole,
  userPermissions,
  pageTitle,
  userName
}: MobileLayoutProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const hasPermission = (permissions: string[], isAdminOnly?: boolean) => {
    if (userRole === 'admin' || userRole === 'superadmin') return true;
    if (isAdminOnly) return false;
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(p => userPermissions.includes(p));
  };

  const filteredNavGroups = navItems.map(group => ({
    ...group,
    items: group.items.filter(item => hasPermission(item.permissions, (item as any).isAdminOnly))
  })).filter(group => group.items.length > 0);

  return (
    <div className="mobile-layout">
      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <h1>{pageTitle}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            style={{ width: 32, height: 32, fontSize: '1rem', border: 'none', background: 'none' }}
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
            {userName?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mobile-content">
        {children}
        <div style={{ 
          padding: '24px 16px 40px', 
          textAlign: 'center', 
          fontSize: '11px', 
          color: 'var(--text-muted)',
          fontWeight: 500,
          opacity: 0.6
        }}>
          Designed & Developed by Abhishek Dargan
        </div>
      </main>

      {/* Grouped & Scrollable Bottom Navigation */}
      <nav className="mobile-nav">
        <div className="mobile-nav-container">
          {filteredNavGroups.map((group) => (
            <div key={group.section} className={`mobile-nav-category ${group.class}`}>
              <div className="category-title">{group.section}</div>
              <div className="mobile-nav-items">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <item.icon className="mobile-nav-icon" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Always show Profile in a separate category at the end */}
          <div className="mobile-nav-category cat-main">
            <div className="category-title">Account</div>
            <div className="mobile-nav-items">
              <Link 
                href="/dashboard/profile" 
                className={`mobile-nav-item ${pathname === '/dashboard/profile' ? 'active' : ''}`}
              >
                <FiUser className="mobile-nav-icon" />
                <span>Profile</span>
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="mobile-nav-item"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }}
              >
                <FiLogOut className="mobile-nav-icon" style={{ color: 'var(--danger)' }} />
                <span style={{ color: 'var(--danger)' }}>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Context-aware Floating Action Button */}
      {userRole !== 'student' && (pathname === '/dashboard/attendance' || pathname === '/dashboard/students') && (
        <button className="mobile-fab" onClick={() => {/* Open relevant modal */}}>
          <FiPlus />
        </button>
      )}
    </div>
  );
}
