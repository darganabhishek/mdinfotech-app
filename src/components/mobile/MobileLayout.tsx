'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiBook, FiActivity, FiUser, FiBell, FiPlus, FiUserPlus, FiUsers } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

interface MobileLayoutProps {
  children: React.ReactNode;
  userRole: string;
  userPermissions: string[];
  pageTitle: string;
  userName?: string;
}

export default function MobileLayout({
  children,
  userRole,
  userPermissions,
  pageTitle,
  userName
}: MobileLayoutProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const hasPermission = (permissions: string[]) => {
    if (userRole === 'admin' || userRole === 'superadmin') return true;
    return permissions.some(p => userPermissions.includes(p));
  };

  // Define primary mobile sections based on role
  const navItems = [
    { href: '/dashboard', label: 'Home', icon: FiHome, permissions: [] },
    { 
      href: userRole === 'student' ? '/dashboard/student' : '/dashboard/admissions', 
      label: userRole === 'student' ? 'My Portal' : 'Admissions', 
      icon: userRole === 'student' ? FiActivity : FiUserPlus, 
      permissions: ['student_portal', 'manage_admissions'] 
    },
    { 
      href: '/dashboard/notices', 
      label: 'Notices', 
      icon: FiBell, 
      permissions: ['faculty_portal', 'manage_students', 'student_portal'] 
    },
    { 
      href: '/dashboard/users', 
      label: 'Users', 
      icon: FiUsers, 
      permissions: ['manage_users'] 
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.permissions.length === 0 || hasPermission(item.permissions)
  );

  return (
    <div className="mobile-layout">
      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <h1>{pageTitle}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            style={{ width: 32, height: 32, fontSize: '1rem' }}
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

      {/* Bottom Navigation */}
      <nav className="mobile-nav">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
              <item.icon className="mobile-nav-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* Profile/Menu item always present */}
        <Link 
          href="/dashboard/profile" 
          className={`mobile-nav-item ${pathname === '/dashboard/profile' ? 'active' : ''}`}
        >
          <FiUser className="mobile-nav-icon" />
          <span>Profile</span>
        </Link>
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
