'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import {
  LayoutDashboard,
  UserCircle,
  Factory,
  PackageSearch,
  ArrowLeftRight,
  Target,
  HeartHandshake,
  Users,
  PieChart,
  ScrollText,
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Swords,
  UsersRound,
  Award,
  Gift,
  Trophy,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  Leaf,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

const ICON_SIZE = 16;

const iconMap: Record<string, ReactNode> = {
  'Dashboard':              <LayoutDashboard size={ICON_SIZE} />,
  'User Profile':           <UserCircle size={ICON_SIZE} />,
  'Emission Factors':       <Factory size={ICON_SIZE} />,
  'Product ESG Profiles':   <PackageSearch size={ICON_SIZE} />,
  'Carbon Transactions':    <ArrowLeftRight size={ICON_SIZE} />,
  'Environmental Goals':    <Target size={ICON_SIZE} />,
  'CSR Activities':         <HeartHandshake size={ICON_SIZE} />,
  'Employee Participation': <Users size={ICON_SIZE} />,
  'Diversity Dashboard':    <PieChart size={ICON_SIZE} />,
  'Policies':               <ScrollText size={ICON_SIZE} />,
  'Policy Acknowledgements':<ClipboardCheck size={ICON_SIZE} />,
  'Audits':                 <ShieldCheck size={ICON_SIZE} />,
  'Compliance Issues':      <AlertTriangle size={ICON_SIZE} />,
  'Challenges':             <Swords size={ICON_SIZE} />,
  'Challenge Participation':<UsersRound size={ICON_SIZE} />,
  'Badges':                 <Award size={ICON_SIZE} />,
  'Rewards':                <Gift size={ICON_SIZE} />,
  'Leaderboard':            <Trophy size={ICON_SIZE} />,
  'Reports':                <BarChart3 size={ICON_SIZE} />,
  'Settings':               <Settings size={ICON_SIZE} />,
};

const sectionIconMap: Record<string, ReactNode> = {
  'Environmental': <Leaf size={14} />,
  'Social':        <HeartHandshake size={14} />,
  'Governance':    <ShieldCheck size={14} />,
  'Gamification':  <Trophy size={14} />,
  'Analytics':     <BarChart3 size={14} />,
  'System':        <Settings size={14} />,
};

const navSections = [
  {
    title: null,
    items: [
      { label: 'Dashboard', href: '/dashboard', module: 'dashboard' },
      { label: 'User Profile', href: '/dashboard/profile', module: 'profile' },
    ],
  },
  {
    title: 'Environmental',
    module: 'environmental',
    items: [
      { label: 'Emission Factors', href: '/dashboard/environmental/emission-factors', module: 'environmental' },
      { label: 'Product ESG Profiles', href: '/dashboard/environmental/product-profiles', module: 'environmental' },
      { label: 'Carbon Transactions', href: '/dashboard/environmental/carbon-transactions', module: 'environmental' },
      { label: 'Environmental Goals', href: '/dashboard/environmental/goals', module: 'environmental' },
    ],
  },
  {
    title: 'Social',
    module: 'social',
    items: [
      { label: 'CSR Activities', href: '/dashboard/social/csr-activities', module: 'social' },
      { label: 'Employee Participation', href: '/dashboard/social/participation', module: 'social' },
      { label: 'Diversity Dashboard', href: '/dashboard/social/diversity', module: 'social' },
    ],
  },
  {
    title: 'Governance',
    module: 'governance',
    items: [
      { label: 'Policies', href: '/dashboard/governance/policies', module: 'governance' },
      { label: 'Policy Acknowledgements', href: '/dashboard/governance/acknowledgements', module: 'governance' },
      { label: 'Audits', href: '/dashboard/governance/audits', module: 'governance' },
      { label: 'Compliance Issues', href: '/dashboard/governance/compliance', module: 'governance' },
    ],
  },
  {
    title: 'Gamification',
    module: 'gamification',
    items: [
      { label: 'Challenges', href: '/dashboard/gamification/challenges', module: 'gamification' },
      { label: 'Challenge Participation', href: '/dashboard/gamification/participation', module: 'gamification' },
      { label: 'Badges', href: '/dashboard/gamification/badges', module: 'gamification' },
      { label: 'Rewards', href: '/dashboard/gamification/rewards', module: 'gamification' },
      { label: 'Leaderboard', href: '/dashboard/gamification/leaderboard', module: 'gamification' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Reports', href: '/dashboard/reports', module: 'reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/dashboard/settings', module: 'settings' },
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
        <Leaf size={20} style={{ color: 'var(--accent-green)' }} />
        <span>EcoSphere</span>
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {sectionIconMap[section.title] || null}
                  {section.title}
                </span>
                {collapsed[section.title!]
                  ? <ChevronRight size={12} />
                  : <ChevronDown size={12} />
                }
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
                  <span style={{ display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                    {iconMap[item.label] || <LayoutDashboard size={ICON_SIZE} />}
                  </span>
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
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
