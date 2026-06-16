// ============================================================
// Dispatch — Final dispatch screen with charges table
// ============================================================

import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getStageById, calculateCharges } from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import {
  Truck, CheckCircle, FileText, Receipt, History,
  Package, Printer
} from 'lucide-react';

export default function Dispatch() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [selectedLotId, setSelectedLotId] = useState(null);

  // Get lots ready for dispatch
  const dispatchableLots = useMemo(() => {
    return (state.lots || []).filter(lot => {
      const completedStages = lot.stageHistory.filter(h => h.status === 'complete').length;
      return completedStages >= lot.stages.length - 1 || lot.status === 'complete';
    });
  }, [state.lots]);

  const selectedLot = (state.lots || []).find(l => l.id === selectedLotId);
  const charges = selectedLot ? calculateCharges(selectedLot) : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <Truck size={36} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
          Dispatch
        </h1>
        <p>Final inspection and challan generation before lots leave the factory</p>
      </div>

      {/* Lot Selection */}
      {!selectedLot ? (
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Select a Lot for Dispatch</h3>
          {dispatchableLots.length > 0 ? (
            <div className="queue-cards">
              {dispatchableLots.map(lot => (
                <div
                  key={lot.id}
                  className="card"
                  style={{ cursor: 'pointer', borderLeft: '4px solid var(--status-complete)' }}
                  onClick={() => setSelectedLotId(lot.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', marginRight: 'var(--space-3)' }}>
                        #{lot.lotNumber}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{lot.partyName}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      <span>{lot.quantity} kg</span>
                      <span>{lot.fabricType}</span>
                      <span>{lot.colour}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={48} /></div>
              <h4>No lots ready for dispatch</h4>
              <p>Complete all stages for a lot to see it here</p>
            </div>
          )}

          {/* Also show all lots for demo purposes */}
          <div style={{ marginTop: 'var(--space-8)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>All Lots (Demo View)</h3>
            <div className="queue-cards">
              {(state.lots || []).map(lot => {
                const completedCount = lot.stageHistory.filter(h => h.status === 'complete').length;
                return (
                  <div
                    key={lot.id}
                    className="card"
                    style={{ cursor: 'pointer', opacity: completedCount < lot.stages.length ? 0.6 : 1 }}
                    onClick={() => setSelectedLotId(lot.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginRight: 'var(--space-3)' }}>
                          #{lot.lotNumber}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{lot.partyName}</span>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {completedCount}/{lot.stages.length} stages complete
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLotId(null)} style={{ marginBottom: 'var(--space-5)' }}>
            ← Back to Lot Selection
          </button>

          {/* Lot Summary Card */}
          <div className="card" style={{ marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <h2 style={{ marginBottom: 'var(--space-2)' }}>Lot #{selectedLot.lotNumber}</h2>
                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{selectedLot.partyName}</p>
              </div>
              <div className={`priority-badge ${selectedLot.priority}`}>
                {selectedLot.priority}
              </div>
            </div>
            <div className="lot-details" style={{ marginTop: 'var(--space-4)' }}>
              <div className="lot-detail-item">
                <span className="lot-detail-label">Quantity</span>
                <span className="lot-detail-value">{selectedLot.quantity} kg</span>
              </div>
              <div className="lot-detail-item">
                <span className="lot-detail-label">Fabric</span>
                <span className="lot-detail-value">{selectedLot.fabricType}</span>
              </div>
              <div className="lot-detail-item">
                <span className="lot-detail-label">Colour</span>
                <span className="lot-detail-value">{selectedLot.colour}</span>
              </div>
            </div>
          </div>

          {/* Process Completion Checklist */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Process Completion Checklist</h3>
            {selectedLot.stages.map((stageId, idx) => {
              const stage = getStageById(stageId);
              const history = selectedLot.stageHistory.find(h => h.stageId === stageId);
              const isComplete = history?.status === 'complete';
              return (
                <div key={idx} className="checklist-item">
                  <div className={`checklist-icon ${isComplete ? 'done' : 'pending'}`}>
                    {isComplete ? <CheckCircle size={14} /> : <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{idx + 1}</span>}
                  </div>
                  <span style={{ fontWeight: isComplete ? 600 : 400, color: isComplete ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {stage?.name || stageId}
                  </span>
                  {isComplete && history?.operator && (
                    <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      by {history.operator}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Job Charges Table */}
          {charges && (
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>
                <Receipt size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Auto-Generated Job Charges
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>Rate (₹/kg)</th>
                      <th>Rate Source</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.charges.map((charge, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{charge.stageName}</td>
                        <td>₹{charge.rate}/kg</td>
                        <td>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: charge.source === 'Contract Rate' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-input)',
                            color: charge.source === 'Contract Rate' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                            fontWeight: 600,
                          }}>
                            {charge.source}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{charge.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="table-total">
                      <td colSpan={2}><strong>Total</strong></td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                          ₹{(charges.total / selectedLot.quantity).toFixed(2)}/kg
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>
                        ₹{charges.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => window.print()}>
              <FileText size={20} />
              Generate Outgoing Challan
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => window.print()}>
              <Printer size={20} />
              Generate Invoice Draft
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/history')}>
              <History size={20} />
              View Production History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
