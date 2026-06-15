// ============================================================
// WaitingCard — Priority-sorted waiting lot with START button
// ============================================================

import { useApp } from '../../context/AppContext';
import { getStageById } from '../../data/mockData';
import { Clock, Play, AlertTriangle, Palette, ArrowUpCircle } from 'lucide-react';

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m ago`;
  return `${mins}m ago`;
}

export default function WaitingCard({ lot, department, disabled }) {
  const { state, dispatch } = useApp();
  const stageInfo = getStageById(department);
  const lastHistory = lot.stageHistory[lot.stageHistory.length - 1];
  const waitingSince = lastHistory?.waitingSince || lot.createdAt;

  // Check for escalation
  const waitingHours = (Date.now() - new Date(waitingSince).getTime()) / (1000 * 60 * 60);
  const needsEscalation = stageInfo && waitingHours > stageInfo.expectedHours * 4;

  const handleStart = () => {
    dispatch({
      type: 'START_STAGE',
      payload: { lotId: lot.id, operatorName: state.operatorName },
    });
  };

  return (
    <div className={`card card-waiting priority-${lot.priority}`}>
      <div className="lot-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className={`priority-dot ${lot.priority}`} />
          <span className="lot-number" style={{ fontSize: 'var(--font-size-xl)' }}>#{lot.lotNumber}</span>
          <span className={`priority-badge ${lot.priority}`}>
            {lot.priority}
            {lot.autoEscalated && ' ↑'}
          </span>
        </div>
        {needsEscalation && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'var(--priority-urgent)',
            background: 'var(--priority-urgent-bg)',
            padding: '4px 10px',
            borderRadius: '20px',
          }}>
            <ArrowUpCircle size={14} />
            Escalate
          </span>
        )}
      </div>

      <div className="lot-party" style={{ fontSize: 'var(--font-size-base)' }}>{lot.partyName}</div>

      <div className="lot-details" style={{ marginTop: 'var(--space-2)' }}>
        <div className="lot-detail-item">
          <span className="lot-detail-label">Qty</span>
          <span className="lot-detail-value">{lot.quantity} kg</span>
        </div>
        <div className="lot-detail-item">
          <span className="lot-detail-label">Fabric</span>
          <span className="lot-detail-value">{lot.fabricType}</span>
        </div>
        <div className="lot-detail-item">
          <span className="lot-detail-label">Colour</span>
          <span className="lot-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Palette size={12} /> {lot.colour}
          </span>
        </div>
        <div className="lot-detail-item">
          <span className="lot-detail-label">Waiting Since</span>
          <span className="lot-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {timeAgo(waitingSince)}
          </span>
        </div>
      </div>

      <button
        className={`btn ${disabled ? 'btn-ghost' : 'btn-primary'} btn-lg btn-full`}
        onClick={handleStart}
        disabled={disabled}
        style={{ marginTop: 'var(--space-4)' }}
        title={disabled ? 'Department at capacity' : ''}
      >
        <Play size={20} />
        {disabled ? 'AT CAPACITY' : `START ${stageInfo?.name?.toUpperCase() || department?.toUpperCase()}`}
      </button>
    </div>
  );
}
