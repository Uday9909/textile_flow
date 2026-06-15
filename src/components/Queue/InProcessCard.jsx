// ============================================================
// InProcessCard — Live timer + Complete button
// ============================================================

import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getStageById } from '../../data/mockData';
import ConfirmModal from '../common/ConfirmModal';
import { Clock, User, Palette, CheckCircle, AlertTriangle } from 'lucide-react';

function formatElapsed(startTime) {
  if (!startTime) return '0m';
  const diff = Date.now() - new Date(startTime).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function InProcessCard({ lot, department }) {
  const { state, dispatch } = useApp();
  const [elapsed, setElapsed] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const stageInfo = getStageById(department);
  const currentHistory = lot.stageHistory[lot.stageHistory.length - 1];
  const startTime = currentHistory?.startTime;

  // Check if delayed
  const elapsedHours = startTime
    ? (Date.now() - new Date(startTime).getTime()) / (1000 * 60 * 60)
    : 0;
  const isDelayed = stageInfo && elapsedHours > stageInfo.expectedHours;

  // Live timer
  useEffect(() => {
    const update = () => setElapsed(formatElapsed(startTime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleComplete = () => {
    dispatch({
      type: 'COMPLETE_STAGE',
      payload: { lotId: lot.id, operatorName: state.operatorName },
    });
    setShowConfirm(false);
  };

  return (
    <>
      <div className="card card-inprocess">
        <div className="lot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="lot-number">#{lot.lotNumber}</span>
            <span className={`priority-badge ${lot.priority}`}>
              <span className={`priority-dot ${lot.priority}`} />
              {lot.priority}
            </span>
          </div>
          <span className="status-badge inprocess">In Process</span>
        </div>

        <div className="lot-party">{lot.partyName}</div>

        <div className="lot-details">
          <div className="lot-detail-item">
            <span className="lot-detail-label">Quantity</span>
            <span className="lot-detail-value">{lot.quantity} kg</span>
          </div>
          <div className="lot-detail-item">
            <span className="lot-detail-label">Fabric</span>
            <span className="lot-detail-value">{lot.fabricType}</span>
          </div>
          <div className="lot-detail-item">
            <span className="lot-detail-label">Colour</span>
            <span className="lot-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={14} /> {lot.colour}
            </span>
          </div>
          <div className="lot-detail-item">
            <span className="lot-detail-label">Started</span>
            <span className="lot-detail-value">{formatTime(startTime)}</span>
          </div>
          {currentHistory?.operator && (
            <div className="lot-detail-item">
              <span className="lot-detail-label">Operator</span>
              <span className="lot-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> {currentHistory.operator}
              </span>
            </div>
          )}
        </div>

        {/* Live Timer */}
        <div className={`lot-timer ${isDelayed ? 'delayed' : ''}`}>
          <Clock size={28} className="lot-timer-icon" />
          <span>{elapsed}</span>
          {isDelayed && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-size-sm)',
              background: 'var(--priority-urgent-bg)',
              color: 'var(--priority-urgent)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: 600,
              marginLeft: 'var(--space-2)',
            }}>
              <AlertTriangle size={14} />
              Delayed ({stageInfo.expectedHours}h expected)
            </span>
          )}
        </div>

        {/* Complete Button */}
        <button
          className="btn btn-success btn-xl btn-full"
          onClick={() => setShowConfirm(true)}
          style={{ marginTop: 'var(--space-5)' }}
        >
          <CheckCircle size={24} />
          COMPLETE {stageInfo?.name?.toUpperCase() || department?.toUpperCase()}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmModal
          title="Complete Stage"
          message={`Mark Lot ${lot.lotNumber} (${lot.partyName}) as complete in ${stageInfo?.name || department}?`}
          confirmText="Yes, Complete"
          confirmVariant="success"
          onConfirm={handleComplete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
