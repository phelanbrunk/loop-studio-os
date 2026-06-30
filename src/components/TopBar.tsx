import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './CommandPalette';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/kunden': 'Kunden',
  '/websites': 'Websites',
  '/projekte': 'Projekte',
  '/kalender': 'Kalender',
  '/verdienst': 'Verdienst',
  '/rechnungen': 'Rechnungen',
  '/chat': 'Chat',
  '/brain': 'Brain',
  '/agenten': 'Agenten-Schwarm',
  '/agenten/registry': 'Agent Registry',
};

interface TopBarProps {
  currentPath: string;
}

export default function TopBar({ currentPath }: TopBarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const today = new Date();
  const germanDate = format(today, "EEEE, d. MMMM yyyy", { locale: de });
  const pageTitle = routeTitles[currentPath] || 'Dashboard';

  // Get display info from user metadata
  const userEmail = user?.email || '';
  const fullName = (user?.user_metadata?.full_name as string) || userEmail.split('@')[0];
  const initials = fullName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className="h-16 fixed top-0 right-0 z-50 flex items-center justify-between px-6 lg:px-8"
      style={{
        left: '260px',
        backgroundColor: 'rgba(12, 13, 15, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Left: Title + Date */}
      <div className="flex items-center gap-4">
        <div>
          <h1
            className="font-bold text-xl leading-tight"
            style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}
          >
            {pageTitle}
          </h1>
          <p className="text-xs mt-0.5 capitalize" style={{ color: '#A1A4AA' }}>
            {germanDate}
          </p>
        </div>
      </div>

      {/* Right: Command Palette, Notifications, User */}
      <div className="flex items-center gap-4">
        {/* Command Palette */}
        <CommandPalette />

        {/* Notification Bell */}
        <button
          className="relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#A1A4AA' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#141518'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#FF8C5A' }}
          />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 h-9 pl-1.5 pr-3 rounded-lg transition-colors"
            style={{ color: '#A1A4AA' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#141518'; }}
            onMouseLeave={(e) => {
              if (!dropdownOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Avatar */}
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FF8C5A, #B98BFF)',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              {initials}
            </div>
            <span className="text-sm max-w-[140px] truncate hidden sm:inline" style={{ color: '#FFFFFF' }}>
              {fullName}
            </span>
            <ChevronDown size={14} style={{ color: '#5E626A' }} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                {/* Backdrop to close on outside click */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />

                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 z-50 w-56 rounded-xl py-2 overflow-hidden"
                  style={{
                    backgroundColor: '#1B1D20',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* User info section */}
                  <div className="px-3 py-2.5 mb-1 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                    <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>
                      {fullName}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#5E626A' }}>
                      {userEmail}
                    </p>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                    style={{ color: '#EF4444' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <LogOut size={16} />
                    Abmelden
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
