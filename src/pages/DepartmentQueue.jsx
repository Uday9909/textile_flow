// ============================================================
// TextileFlow MES — Department Queue Dashboard (Hero Screen)
// ============================================================

import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getStageById } from '../data/mockData';
import InProcessCard from '../components/Queue/InProcessCard';
import WaitingCard from '../components/Queue/WaitingCard';
import CompletedList from '../components/Queue/CompletedList';
import PriorityFilter from '../components/Queue/PriorityFilter';
import { Activity, Clock, CheckCircle2, Inbox } from 'lucide-react';

export default function DepartmentQueue() {
  const { department } = useParams();
  const { getInProcessLots, getWaitingLots, getCompletedTodayLots, getDepartmentCapacity } = useApp();
  const [priorityFilter, setPriorityFilter] = useState('all');

  const stageInfo = getStageById(department);
  const inProcessLots = getInProcessLots(department);
  const waitingLots = getWaitingLots(department);
  const completedToday = getCompletedTodayLots(department);
  const capacity = getDepartmentCapacity(department);
  const atCapacity = inProcessLots.length >= capacity;

  // Filter waiting lots by priority
  const filteredWaiting = useMemo(() => {
    if (priorityFilter === 'all') return waitingLots;
    return waitingLots.filter(lot => lot.priority === priorityFilter);
  }, [waitingLots, priorityFilter]);

  // Priority counts for filter tabs
  const priorityCounts = useMemo(() => ({
    all: waitingLots.length,
    urgent: waitingLots.filter(l => l.priority === 'urgent').length,
    normal: waitingLots.filter(l => l.priority === 'normal').length,
    low: waitingLots.filter(l => l.priority === 'low').length,
  }), [waitingLots]);

  return (
    <div className="page-container">
      {/* Department Title */}
      <div className="dept-queue-header">
        <div className="dept-queue-title-row">
          <div className="dept-queue-icon" style={{ background: stageInfo?.accent || 'var(--accent-primary)' }}>
            <Activity size={22} />
          </div>
          <div>
            <h1 className="dept-queue-title">
              {stageInfo?.name || department} Department
            </h1>
            <p className="dept-queue-subtitle">
              Capacity: {inProcessLots.length}/{capacity} active
              {atCapacity && <span className="capacity-full">At Capacity</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ── IN PROCESS Section ── */}
      <div className="queue-section">
        <div className="section-header">
          <div className="section-title">
            <Activity size={20} style={{ color: 'var(--status-inprocess)' }} />
            <span>In Process</span>
            <span className="section-count">{inProcessLots.length} of {capacity}</span>
          </div>
        </div>
        <div className="queue-cards">
          {inProcessLots.length > 0 ? (
            inProcessLots.map(lot => (
              <InProcessCard key={lot.id} lot={lot} department={department} />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Inbox size={48} /></div>
              <h4>No lots in process</h4>
              <p>Start a lot from the waiting queue below</p>
            </div>
          )}
        </div>
      </div>

      {/* ── WAITING QUEUE Section ── */}
      <div className="queue-section">
        <div className="section-header">
          <div className="section-title">
            <Clock size={20} style={{ color: 'var(--status-waiting)' }} />
            <span>Waiting Queue</span>
            <span className="section-count">{waitingLots.length} lots</span>
          </div>
        </div>
        <PriorityFilter
          active={priorityFilter}
          onChange={setPriorityFilter}
          counts={priorityCounts}
        />
        <div className="queue-cards" style={{ marginTop: 'var(--space-4)' }}>
          {filteredWaiting.length > 0 ? (
            filteredWaiting.map(lot => (
              <WaitingCard
                key={lot.id}
                lot={lot}
                department={department}
                disabled={atCapacity}
              />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckCircle2 size={48} /></div>
              <h4>No lots waiting</h4>
              <p>All lots have been processed in this department.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPLETED TODAY Section ── */}
      <CompletedList lots={completedToday} department={department} />
    </div>
  );
}
