// ============================================================
// AI Delay Detection Panel — Supervisor View
// ============================================================

import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getStageById } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Brain, AlertTriangle, Clock, TrendingUp, CheckCircle,
  ArrowUpRight, Activity
} from 'lucide-react';

export default function AIPanel() {
  const { state } = useApp();

  // Active lots with delay analysis
  const lotAnalysis = useMemo(() => {
    return state.lots
      .filter(lot => lot.status !== 'complete')
      .map(lot => {
        const currentStage = lot.stages[lot.currentStageIndex];
        const stageInfo = getStageById(currentStage);
        const currentHistory = lot.stageHistory[lot.stageHistory.length - 1];

        let actualHours = 0;
        if (currentHistory?.startTime) {
          actualHours = (Date.now() - new Date(currentHistory.startTime).getTime()) / (1000 * 60 * 60);
        } else if (currentHistory?.waitingSince) {
          actualHours = (Date.now() - new Date(currentHistory.waitingSince).getTime()) / (1000 * 60 * 60);
        }

        const expectedHours = stageInfo?.expectedHours || 2;
        const progress = Math.min((actualHours / expectedHours) * 100, 200);
        const isDelayed = actualHours > expectedHours;
        const delayRatio = actualHours / expectedHours;

        return {
          ...lot,
          currentStage,
          stageInfo,
          actualHours: Math.round(actualHours * 10) / 10,
          expectedHours,
          progress,
          isDelayed,
          delayRatio,
        };
      })
      .sort((a, b) => b.delayRatio - a.delayRatio);
  }, [state.lots]);

  // Department performance data
  const deptPerformance = useMemo(() => {
    const deptStats = {};
    state.lots.forEach(lot => {
      lot.stageHistory.forEach(h => {
        if (h.status === 'complete' && h.startTime && h.endTime) {
          const stage = getStageById(h.stageId);
          if (!stage) return;
          const actualH = (new Date(h.endTime) - new Date(h.startTime)) / (1000 * 60 * 60);
          const wasDelayed = actualH > stage.expectedHours;

          if (!deptStats[h.stageId]) {
            deptStats[h.stageId] = { name: stage.name, accent: stage.accent, total: 0, delayed: 0, onTime: 0 };
          }
          deptStats[h.stageId].total++;
          if (wasDelayed) deptStats[h.stageId].delayed++;
          else deptStats[h.stageId].onTime++;
        }
      });
    });
    return Object.values(deptStats).filter(d => d.total > 0);
  }, [state.lots]);

  const totalDelays = lotAnalysis.filter(l => l.isDelayed).length;
  const totalActive = lotAnalysis.length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <Brain size={36} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
          Production Intelligence
        </h1>
        <p>AI-powered delay detection and department performance analysis</p>
      </div>

      {/* Summary Stats */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <span className="stat-card-label">Active Lots</span>
          <span className="stat-card-value">{totalActive}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: `3px solid ${totalDelays > 0 ? 'var(--priority-urgent)' : 'var(--status-complete)'}` }}>
          <span className="stat-card-label">Delays Detected</span>
          <span className="stat-card-value" style={{ color: totalDelays > 0 ? 'var(--priority-urgent)' : 'var(--status-complete)' }}>
            {totalDelays}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">On Track</span>
          <span className="stat-card-value" style={{ color: 'var(--status-complete)' }}>
            {totalActive - totalDelays}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Total Lots</span>
          <span className="stat-card-value">{state.lots.length}</span>
        </div>
      </div>

      {/* Active Lot Analysis */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <div className="section-title">
            <Activity size={20} />
            <span>Active Lot Analysis</span>
          </div>
        </div>
        <div className="queue-cards">
          {lotAnalysis.map(lot => (
            <div
              key={lot.id}
              className="card"
              style={{
                borderLeft: `4px solid ${lot.isDelayed ? 'var(--priority-urgent)' : 'var(--status-complete)'}`,
                ...(lot.isDelayed && lot.delayRatio > 2 ? { background: 'var(--priority-urgent-bg)' } : {}),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)' }}>#{lot.lotNumber}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{lot.partyName}</span>
                  <span className={`priority-badge ${lot.priority}`}>{lot.priority}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {lot.isDelayed ? (
                    <span className="status-badge delayed">
                      <AlertTriangle size={14} />
                      Delay Detected
                    </span>
                  ) : (
                    <span className="status-badge complete">
                      <CheckCircle size={14} />
                      On Track
                    </span>
                  )}
                </div>
              </div>

              {/* Current Stage */}
              <div style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>Current Stage:</span>
                <span style={{
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '12px',
                  background: `${lot.stageInfo?.accent}20`,
                  color: lot.stageInfo?.accent,
                  fontSize: 'var(--font-size-sm)',
                }}>
                  {lot.stageInfo?.icon} {lot.stageInfo?.name}
                </span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  ({lot.status === 'waiting' ? 'Waiting' : 'In Process'})
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Expected: {lot.expectedHours}h
                  </span>
                  <span style={{ fontWeight: 700, color: lot.isDelayed ? 'var(--priority-urgent)' : 'var(--status-complete)' }}>
                    Actual: {lot.actualHours}h
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${lot.isDelayed ? (lot.delayRatio > 2 ? 'delayed' : 'warning') : 'on-track'}`}
                    style={{ width: `${Math.min(lot.progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Escalation */}
              {lot.delayRatio > 3 && (
                <button className="btn btn-danger btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                  <ArrowUpRight size={16} />
                  Escalate to Supervisor
                </button>
              )}
            </div>
          ))}
          {lotAnalysis.length === 0 && (
            <div className="empty-state">
              <h4>No active lots</h4>
              <p>Create a lot to see delay analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Department Performance Chart */}
      {deptPerformance.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-5)' }}>
            <TrendingUp size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Department Performance
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerformance} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#5a6178" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#5a6178" fontSize={12} width={75} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1d27',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f0f2f5',
                  }}
                />
                <Bar dataKey="onTime" name="On Time" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
