'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navSections = [
  {
    title: null,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '📊', module: 'dashboard' },
      { label: 'User Profile', href: '/dashboard/profile', icon: '👤', module: 'profile' },
    ],
  },
  {
    title: 'Environmental',
    module: 'environmental',
    items: [
      { label: 'Emission Factors', href: '/dashboard/environmental/emission-factors', icon: '⚡', module: 'environmental' },
      { label: 'Product ESG Profiles', href: '/dashboard/environmental/product-profiles', icon: '📦', module: 'environmental' },
      { label: 'Carbon Transactions', href: '/dashboard/environmental/carbon-transactions', icon: '🏭', module: 'environmental' },
      { label: 'Environmental Goals', href: '/dashboard/environmental/goals', icon: '🎯', module: 'environmental' },
    ],
  },
  {
    title: 'Social',
    module: 'social',
    items: [
      { label: 'CSR Activities', href: '/dashboard/social/csr-activities', icon: '🤝', module: 'social' },
      { label: 'Employee Participation', href: '/dashboard/social/participation', icon: '👥', module: 'social' },
      { label: 'Diversity Dashboard', href: '/dashboard/social/diversity', icon: '🌍', module: 'social' },
    ],
  },
  {
    title: 'Governance',
    module: 'governance',
    items: [
      { label: 'Policies', href: '/dashboard/governance/policies', icon: '📋', module: 'governance' },
      { label: 'Policy Acknowledgements', href: '/dashboard/governance/acknowledgements', icon: '✅', module: 'governance' },
      { label: 'Audits', href: '/dashboard/governance/audits', icon: '🔍', module: 'governance' },
      { label: 'Compliance Issues', href: '/dashboard/governance/compliance', icon: '⚠️', module: 'governance' },
    ],
  },
  {
    title: 'Gamification',
    module: 'gamification',
    items: [
      { label: 'Challenges', href: '/dashboard/gamification/challenges', icon: '🏆', module: 'gamification' },
      { label: 'Challenge Participation', href: '/dashboard/gamification/participation', icon: '🎮', module: 'gamification' },
      { label: 'Badges', href: '/dashboard/gamification/badges', icon: '🎖️', module: 'gamification' },
      { label: 'Rewards', href: '/dashboard/gamification/rewards', icon: '🎁', module: 'gamification' },
      { label: 'Leaderboard', href: '/dashboard/gamification/leaderboard', icon: '📈', module: 'gamification' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Reports', href: '/dashboard/reports', icon: '📑', module: 'reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: '⚙️', module: 'settings' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
    }).catch(() => {});

    // Check saved theme
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const toggleSection = (title: string) => {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span>🌍 EcoSphere</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '8px' }}>
        {navSections.map((section, si) => (
          <div key={si} className="sidebar-section">
            {section.title && (
              <div
                className="sidebar-section-title"
                onClick={() => toggleSection(section.title!)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                {section.title}
                <span style={{ fontSize: '10px' }}>{collapsed[section.title!] ? '▸' : '▾'}</span>
              </div>
            )}
            {!collapsed[section.title || ''] && section.items.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${section.title ? 'sidebar-sub' : ''} ${isActive ? 'active' : ''}`}
                  data-module={item.module}
                >
                  <span style={{ fontSize: '15px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <Link href="/dashboard/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
            color: '#000',
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Loading...'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role || ''}</div>
          </div>
        </Link>
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
          }}
          title="Sign out"
        >
          ↪
        </button>
      </div>
    </nav>
  );
}
