// ============================================================
// TopBar — Department header with time and notification bell
// ============================================================

import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, LogOut } from 'lucide-react';

export default function TopBar() {
  const { state, getActiveNotifications } = useApp();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeNotifs = getActiveNotifications();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        {user?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <User size={16} />
            <span>{user.name}</span>
          </div>
        )}
      </div>
      <div className="top-bar-right">
        <button className="top-bar-btn" onClick={handleLogout} title="Sign out">
          <LogOut size={18} />
        </button>
        <span className="top-bar-time">
          {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          {' '}
          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>
        <button className="notification-bell">
          <Bell size={22} />
          {activeNotifs.length > 0 && (
            <span className="bell-badge">{activeNotifs.length > 9 ? '9+' : activeNotifs.length}</span>
          )}
        </button>
      </div>
    </div>
  );
}
