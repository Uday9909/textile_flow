// ============================================================
// Production History — Lot traceability & timeline
// ============================================================

import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getStageById } from '../data/mockData';
import { Search, History, Download, Clock, User, CheckCircle, AlertTriangle, Package } from 'lucide-react';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(start, end) {
  if (!start || !end) return '—';
  const diff = new Date(end) - new Date(start);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function ProductionHistory() {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLotId, setSelectedLotId] = useState(null);

  // Filter lots by search
  const filteredLots = useMemo(() => {
    if (!searchQuery.trim()) return state.lots;
    const query = searchQuery.toLowerCase();
    return state.lots.filter(l =>
      l.lotNumber.toLowerCase().includes(query) ||
      l.partyName.toLowerCase().includes(query) ||
      l.colour.toLowerCase().includes(query)
    );
  }, [state.lots, searchQuery]);

  const selectedLot = state.lots.find(l => l.id === selectedLotId);

  // Export CSV
  const exportCSV = () => {
    if (!selectedLot) return;
    const rows = [
      ['Stage', 'Status', 'Start Time', 'End Time', 'Duration', 'Operator'],
      ...selectedLot.stageHistory.map(h => [
        getStageById(h.stageId)?.name || h.stageId,
        h.status,
        h.startTime || '',
        h.endTime || '',
        h.startTime && h.endTime ? formatDuration(h.startTime, h.endTime) : '',
        h.operator || '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lot_${selectedLot.lotNumber}_history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <History size={36} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
          Production History
        </h1>
        <p>Full lot traceability and audit trail</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar" style={{ marginBottom: 'var(--space-6)' }}>
        <Search size={18} className="search-bar-icon" />
        <input
          className="form-input"
          style={{ paddingLeft: '44px' }}
          placeholder="Search by Lot Number, Party Name, or Colour..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedLot ? '1fr 2fr' : '1fr', gap: 'var(--space-6)' }}>
        {/* Lot List */}
        <div>
          <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>
            {filteredLots.length} lot{filteredLots.length !== 1 ? 's' : ''} found
          </h4>
          <div className="queue-cards">
            {filteredLots.map(lot => {
              const completedCount = lot.stageHistory.filter(h => h.status === 'complete').length;
              const isSelected = lot.id === selectedLotId;
              return (
                <div
                  key={lot.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'var(--accent-primary-glow)' : undefined,
                  }}
                  onClick={() => setSelectedLotId(lot.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginRight: 'var(--space-2)' }}>
                        #{lot.lotNumber}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{lot.partyName}</span>
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      {completedCount}/{lot.stages.length}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {lot.quantity} kg · {lot.fabricType} · {lot.colour}
                  </div>
                </div>
              );
            })}
            {filteredLots.length === 0 && (
              <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                <p>No lots found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline View */}
        {selectedLot && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <div>
                <h3>Lot #{selectedLot.lotNumber} — Timeline</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  {selectedLot.partyName} · {selectedLot.quantity} kg · {selectedLot.colour}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
                <Download size={16} />
                Export CSV
              </button>
            </div>

            <div className="v-timeline">
              {selectedLot.stageHistory.map((h, idx) => {
                const stage = getStageById(h.stageId);
                const isComplete = h.status === 'complete';
                const isCurrent = h.status === 'inprocess';
                const isWaiting = h.status === 'waiting';

                // Check if delayed
                let isDelayed = false;
                if (isComplete && h.startTime && h.endTime && stage) {
                  const actualH = (new Date(h.endTime) - new Date(h.startTime)) / (1000 * 60 * 60);
                  isDelayed = actualH > stage.expectedHours;
                }

                const dotClass = isComplete
                  ? (isDelayed ? 'delayed' : 'complete')
                  : isCurrent ? 'current' : 'pending';

                return (
                  <div key={idx} className="v-timeline-item">
                    <div className={`v-timeline-dot ${dotClass}`} />
                    <div className="v-timeline-content">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
                          {stage?.icon} {stage?.name || h.stageId}
                        </span>
                        {isComplete && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 600,
                            color: isDelayed ? 'var(--status-delayed)' : 'var(--status-complete)',
                          }}>
                            {isDelayed ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                            {isDelayed ? 'Delayed' : 'On Time'}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="status-badge inprocess">In Process</span>
                        )}
                        {isWaiting && (
                          <span className="status-badge waiting">Waiting</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        {h.startTime && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {formatTime(h.startTime)} — {h.endTime ? formatTime(h.endTime) : 'ongoing'}
                          </span>
                        )}
                        {h.startTime && h.endTime && (
                          <span style={{ fontWeight: 600, color: isDelayed ? 'var(--status-delayed)' : 'var(--status-complete)' }}>
                            {formatDuration(h.startTime, h.endTime)}
                          </span>
                        )}
                        {h.operator && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} />
                            {h.operator}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Remaining stages */}
              {selectedLot.stages
                .slice(selectedLot.stageHistory.length)
                .map((stageId, idx) => {
                  const stage = getStageById(stageId);
                  return (
                    <div key={`pending-${idx}`} className="v-timeline-item">
                      <div className="v-timeline-dot pending" />
                      <div className="v-timeline-content" style={{ opacity: 0.4 }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                          {stage?.icon} {stage?.name || stageId}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block', marginTop: '2px' }}>
                          Pending
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
