// ============================================================
// Supervisor Dashboard — Management overview
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getStageById, calculateCharges } from '../data/mockData';
import {
  LayoutDashboard, Factory, Search,
  Truck, ArrowRight, Activity
} from 'lucide-react';

const QUEUE_DEPARTMENTS = ['grey', 'batching', 'scouring', 'bleaching', 'dyeing', 'hydro', 'drying', 'printing', 'brushing', 'compacting', 'finishing', 'packing'];

export default function SupervisorDashboard() {
  const { state, getInProcessLots, getWaitingLots } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Factory floor status
  const floorStatus = useMemo(() => {
    return QUEUE_DEPARTMENTS.map(deptId => {
      const stage = getStageById(deptId);
      const inProcess = getInProcessLots(deptId);
      const waiting = getWaitingLots(deptId);
      return {
        id: deptId,
        name: stage?.name || deptId,
        accent: stage?.accent || '#6366f1',
        active: inProcess.length,
        waiting: waiting.length,
        total: inProcess.length + waiting.length,
      };
    }).filter(d => d.total > 0 || ['grey', 'dyeing', 'hydro', 'finishing', 'packing'].includes(d.id));
  }, [state.lots]);

  // Today's dispatchable lots
  const dispatchable = useMemo(() => {
    return state.lots.filter(lot => {
      const completedCount = lot.stageHistory.filter(h => h.status === 'complete').length;
      return completedCount >= lot.stages.length;
    });
  }, [state.lots]);

  // Revenue calculation
  const revenue = useMemo(() => {
    let total = 0;
    state.lots.forEach(lot => {
      const completedStages = lot.stageHistory.filter(h => h.status === 'complete');
      if (completedStages.length > 0) {
        const { total: lotTotal } = calculateCharges(lot);
        total += lotTotal * (completedStages.length / lot.stages.length);
      }
    });
    return Math.round(total);
  }, [state.lots]);

  // Search handler
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();
    const lot = state.lots.find(l =>
      l.lotNumber.toLowerCase().includes(query) ||
      l.partyName.toLowerCase().includes(query)
    );
    setSearchResult(lot || 'not_found');
  };

  // Delays count
  const totalDelays = useMemo(() => {
    return state.lots.filter(lot => {
      if (lot.status === 'complete') return false;
      const currentStage = lot.stages[lot.currentStageIndex];
      const stageInfo = getStageById(currentStage);
      const lastH = lot.stageHistory[lot.stageHistory.length - 1];
      if (!stageInfo || !lastH) return false;
      const startRef = lastH.startTime || lastH.waitingSince;
      if (!startRef) return false;
      const hours = (Date.now() - new Date(startRef).getTime()) / (1000 * 60 * 60);
      return hours > stageInfo.expectedHours;
    }).length;
  }, [state.lots]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <LayoutDashboard size={36} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
          Management Dashboard
        </h1>
        <p>Factory floor overview and production intelligence</p>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <span className="stat-card-label">Active Lots</span>
          <span className="stat-card-value">{state.lots.filter(l => l.status !== 'complete').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Revenue (Est.)</span>
          <span className="stat-card-value" style={{ color: 'var(--status-complete)' }}>
            ₹{revenue.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Dispatchable</span>
          <span className="stat-card-value">{dispatchable.length}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: `3px solid ${totalDelays > 0 ? 'var(--priority-urgent)' : 'var(--status-complete)'}` }}>
          <span className="stat-card-label">Delays</span>
          <span className="stat-card-value" style={{ color: totalDelays > 0 ? 'var(--priority-urgent)' : 'var(--status-complete)' }}>
            {totalDelays}
          </span>
        </div>
      </div>

      {/* Voice Query / Search */}
      <div className="card" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Search size={20} />
          Where is my lot?
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={18} className="search-bar-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: '44px' }}
              placeholder='Try "Satya lot 21112" or "21113"'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>
            Search
          </button>
        </div>
        {searchResult && searchResult !== 'not_found' && (
          <div className="card" style={{ marginTop: 'var(--space-4)', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', marginRight: 'var(--space-3)' }}>
                  #{searchResult.lotNumber}
                </span>
                <span>{searchResult.partyName}</span>
              </div>
              <span className={`priority-badge ${searchResult.priority}`}>{searchResult.priority}</span>
            </div>
            <div className="lot-details" style={{ marginTop: 'var(--space-3)' }}>
              <div className="lot-detail-item">
                <span className="lot-detail-label">Department</span>
                <span className="lot-detail-value">
                  {getStageById(searchResult.stages[searchResult.currentStageIndex])?.icon}{' '}
                  {getStageById(searchResult.stages[searchResult.currentStageIndex])?.name}
                </span>
              </div>
              <div className="lot-detail-item">
                <span className="lot-detail-label">Status</span>
                <span className={`status-badge ${searchResult.status === 'complete' ? 'complete' : searchResult.status}`}>
                  {searchResult.status}
                </span>
              </div>
              <div className="lot-detail-item">
                <span className="lot-detail-label">Quantity</span>
                <span className="lot-detail-value">{searchResult.quantity} kg</span>
              </div>
              <div className="lot-detail-item">
                <span className="lot-detail-label">Progress</span>
                <span className="lot-detail-value">
                  {searchResult.stageHistory.filter(h => h.status === 'complete').length}/{searchResult.stages.length} stages
                </span>
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/queue/${searchResult.stages[searchResult.currentStageIndex]}`)}
              style={{ marginTop: 'var(--space-3)' }}
            >
              View in Queue <ArrowRight size={14} />
            </button>
          </div>
        )}
        {searchResult === 'not_found' && (
          <div style={{ marginTop: 'var(--space-4)', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            No lot found matching "{searchQuery}". Try a lot number or party name.
          </div>
        )}
      </div>

      {/* Factory Floor Live */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <div className="section-title">
            <Factory size={20} />
            <span>Factory Floor Live</span>
          </div>
        </div>
        <div className="grid-3">
          {floorStatus.map(dept => (
            <div
              key={dept.id}
              className="card"
              style={{ cursor: 'pointer', borderTop: `3px solid ${dept.accent}` }}
              onClick={() => navigate(`/queue/${dept.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Activity size={18} style={{ color: dept.accent }} />
                  {dept.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--status-inprocess)' }}>
                    {dept.active}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Active</span>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--status-waiting)' }}>
                    {dept.waiting}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Waiting</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Dispatchable Lots */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <div className="section-title">
            <Truck size={20} />
            <span>Ready for Dispatch</span>
            <span className="section-count">{dispatchable.length} lots</span>
          </div>
        </div>
        {dispatchable.length > 0 ? (
          <div className="queue-cards">
            {dispatchable.map(lot => (
              <div
                key={lot.id}
                className="card"
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--status-complete)' }}
                onClick={() => navigate('/dispatch')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginRight: 'var(--space-3)' }}>
                      #{lot.lotNumber}
                    </span>
                    <span>{lot.partyName}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {lot.quantity} kg — {lot.fabricType} — {lot.colour}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
            <p>No lots ready for dispatch yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
