// ============================================================
// NotificationOverlay — Slide-down banner + bell
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getStageById } from '../../data/mockData';
import { Bell, X, ArrowRight } from 'lucide-react';

export default function NotificationOverlay() {
  const { state, dispatch, getActiveNotifications } = useApp();
  const navigate = useNavigate();
  const [visibleNotification, setVisibleNotification] = useState(null);
  const [lastSeenId, setLastSeenId] = useState(null);

  const activeNotifs = getActiveNotifications();

  // Show the latest undismissed notification as a banner
  useEffect(() => {
    if (activeNotifs.length > 0) {
      const latest = activeNotifs[0];
      if (latest.id !== lastSeenId) {
        setVisibleNotification(latest);
        setLastSeenId(latest.id);

        // Auto-dismiss after 8 seconds
        const timer = setTimeout(() => {
          setVisibleNotification(null);
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeNotifs, lastSeenId]);

  const handleDismiss = () => {
    if (visibleNotification) {
      dispatch({ type: 'DISMISS_NOTIFICATION', payload: { notificationId: visibleNotification.id } });
      setVisibleNotification(null);
    }
  };

  const handleViewInQueue = () => {
    if (visibleNotification) {
      navigate(`/queue/${visibleNotification.targetDepartment}`);
      handleDismiss();
    }
  };

  if (!visibleNotification) return null;

  const targetStage = getStageById(visibleNotification.targetDepartment);

  return (
    <div className="notification-banner">
      <div className="notification-banner-inner">
        <div className="notification-banner-content">
          <div className="notification-bell-icon">
            <Bell size={22} />
          </div>
          <div className="notification-banner-text">
            <h4>
              {visibleNotification.type === 'new_lot' ? 'New Lot Created' : 'Lot Ready'}
            </h4>
            <p>
              Lot {visibleNotification.lotNumber} | {visibleNotification.partyName} | {visibleNotification.quantity} kg
              {targetStage && ` — Ready for ${targetStage.name}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={handleViewInQueue}>
            View in Queue <ArrowRight size={16} />
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 'var(--space-2)',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
