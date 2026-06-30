import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Globe, KanbanSquare,
  Calendar, TrendingUp, FileText, MessageSquare,
  ChevronLeft, ChevronRight, Brain, LogOut,
  BrainCircuit,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  NAV GROUPS                                                         */
/* ------------------------------------------------------------------ */

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'CORE',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/brain', icon: Brain, label: 'Brain' },
      { to: '/agenten', icon: BrainCircuit, label: 'Agenten-Schwarm' },
    ],
  },
  {
    label: 'STUDIO',
    items: [
      { to: '/kunden', icon: Users, label: 'Kunden' },
      { to: '/websites', icon: Globe, label: 'Websites' },
      { to: '/projekte', icon: KanbanSquare, label: 'Projekte' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/kalender', icon: Calendar, label: 'Kalender' },
      { to: '/verdienst', icon: TrendingUp, label: 'Verdienst' },
      { to: '/rechnungen', icon: FileText, label: 'Rechnungen' },
    ],
  },
  {
    label: 'AI',
    items: [
      { to: '/chat', icon: MessageSquare, label: 'Chat' },
    ],
  },
];

const sidebarVariants = {
  open: { width: 260, transition: { duration: 0.3 } },
  collapsed: { width: 72, transition: { duration: 0.3 } },
};

/* ------------------------------------------------------------------ */
/*  SIDEBAR COMPONENT                                                  */
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // User info
  const userEmail = user?.email || '';
  const fullName = (user?.user_metadata?.full_name as string) || userEmail.split('@')[0];
  const initials = fullName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="open"
      animate={collapsed ? 'collapsed' : 'open'}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r overflow-hidden"
      style={{
        backgroundColor: '#0C0D0F',
        borderColor: 'rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center px-4 border-b shrink-0"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="loopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8C5A" />
              <stop offset="100%" stopColor="#B98BFF" />
            </linearGradient>
          </defs>
          <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c4.418 0 8.235-2.388 10.303-5.94" stroke="url(#loopGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="16" cy="16" r="4" fill="#FF8C5A" />
        </svg>
        {!collapsed && (
          <span className="ml-3 font-bold text-lg text-white whitespace-nowrap" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            Loop Studio
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            {/* Group Header */}
            {!collapsed && (
              <div
                className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.15em]"
                style={{ color: '#5E626A' }}
              >
                {group.label}
              </div>
            )}
            {/* Group Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="relative flex items-center h-9 rounded-lg px-3 transition-all duration-200 no-underline"
                    style={{
                      backgroundColor: isActive ? 'rgba(255, 140, 90, 0.08)' : 'transparent',
                      color: isActive ? '#FF8C5A' : '#A1A4AA',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#141518';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#A1A4AA';
                      }
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                        style={{
                          width: '3px',
                          height: '20px',
                          backgroundColor: '#FF8C5A',
                        }}
                      />
                    )}
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <span className="ml-3 text-sm whitespace-nowrap">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section + Collapse Toggle */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        {/* User Info */}
        <div className="px-3 py-3">
          {collapsed ? (
            <div className="flex justify-center">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #FF8C5A, #B98BFF)',
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
                onClick={handleLogout}
                title="Abmelden"
              >
                {initials}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FF8C5A, #B98BFF)',
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#FFFFFF' }}>
                  {fullName}
                </p>
                <p className="text-[11px] truncate" style={{ color: '#5E626A' }}>
                  {userEmail}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
                style={{ color: '#5E626A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#141518';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#5E626A';
                }}
                title="Abmelden"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="px-3 pb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center h-10 rounded-lg transition-all duration-200"
            style={{ color: '#A1A4AA' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#141518';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#A1A4AA';
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
