// ============================================================
// CompletedList — Collapsible list of today's completed lots
// ============================================================

import { useState } from 'react';
import { getStageById } from '../../data/mockData';
import { ChevronDown, CheckCircle2, Clock, User } from 'lucide-react';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(start, end) {
  if (!start || !end) return '—';
  const diff = new Date(end) - new Date(start);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function CompletedList({ lots, department }) {
  const [isOpen, setIsOpen] = useState(true);
  const stageInfo = getStageById(department);

  return (
    <div className="queue-section">
      <div className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="section-title">
          <CheckCircle2 size={20} style={{ color: 'var(--status-complete)' }} />
          <span>Completed Today</span>
          <span className="section-count">{lots.length} lots</span>
        </div>
        <ChevronDown size={20} className={`collapsible-icon ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="queue-cards">
          {lots.length > 0 ? (
            lots.map(lot => {
              const stageHistory = lot.stageHistory.find(h => h.stageId === department && h.status === 'complete');
              return (
                <div key={lot.id} className="card" style={{ borderLeft: `4px solid var(--status-complete)`, padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)' }}>#{lot.lotNumber}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{lot.partyName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {formatTime(stageHistory?.startTime)} → {formatTime(stageHistory?.endTime)}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--status-complete)' }}>
                        {formatDuration(stageHistory?.startTime, stageHistory?.endTime)}
                      </span>
                      {stageHistory?.operator && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={14} />
                          {stageHistory.operator}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>No lots completed in {stageInfo?.name || department} today</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
