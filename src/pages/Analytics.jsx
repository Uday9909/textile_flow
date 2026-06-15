// ============================================================
// TextileFlow MES — Analytics Dashboard
// ============================================================

import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { STAGE_POOL } from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Package, CheckCircle2, Clock, DollarSign, Activity,
} from 'lucide-react';
import { calculateCharges } from '../data/mockData';

const DEPT_COLORS = {
  grey: '#9ca3af', batching: '#f59e0b', scouring: '#14b8a6',
  bleaching: '#e2e8f0', dyeing: '#d97706', hydro: '#06b6d4',
  drying: '#f97316', printing: '#ec4899', brushing: '#0891b2',
  compacting: '#64748b', anti_pilling: '#84cc16', finishing: '#0d9488',
  packing: '#10b981',
};

export default function Analytics() {
  const { state, getWaitingLots, getInProcessLots, getCompletedTodayLots } = useApp();
  const allLots = state.lots || [];

  // ── Stats cards ──
  const totalLots = allLots.length;
  const completedLots = allLots.filter(l => l.status === 'complete').length;
  const inProcessLots = allLots.filter(l => l.status === 'inprocess').length;
  const waitingLots = allLots.filter(l => l.status === 'waiting').length;
  const pendingLots = totalLots - completedLots;
  const completionRate = totalLots ? Math.round((completedLots / totalLots) * 100) : 0;

  // ── Revenue estimation ──
  const estimatedRevenue = useMemo(() => {
    return allLots.reduce((sum, lot) => sum + (calculateCharges(lot) || 0), 0);
  }, [allLots]);

  // ── Lots by department (in process) ──
  const deptDistribution = useMemo(() => {
    return STAGE_POOL.filter(s => s.id !== 'dispatch').map(stage => {
      const inQueue = getInProcessLots(stage.id).length + getWaitingLots(stage.id).length;
      return { name: stage.name, lots: inQueue, color: stage.accent };
    }).filter(d => d.lots > 0);
  }, [allLots]);

  // ── Lots by status (pie chart) ──
  const statusData = [
    { name: 'In Process', value: inProcessLots, color: '#3b82f6' },
    { name: 'Waiting', value: waitingLots, color: '#f59e0b' },
    { name: 'Completed', value: completedLots, color: '#10b981' },
  ].filter(d => d.value > 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <TrendingUp size={36} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
          Analytics
        </h1>
        <p>Factory production overview and performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <Package size={24} className="stat-icon blue" />
          <div className="stat-value">{totalLots}</div>
          <div className="stat-label">Total Lots</div>
        </div>
        <div className="stat-card">
          <Activity size={24} className="stat-icon yellow" />
          <div className="stat-value">{inProcessLots}</div>
          <div className="stat-label">In Process</div>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={24} className="stat-icon green" />
          <div className="stat-value">{completedLots}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <DollarSign size={24} className="stat-icon teal" />
          <div className="stat-value">₹{estimatedRevenue.toLocaleString()}</div>
          <div className="stat-label">Est. Revenue</div>
        </div>
        <div className="stat-card">
          <TrendingUp size={24} className="stat-icon purple" />
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        <div className="stat-card">
          <Clock size={24} className="stat-icon orange" />
          <div className="stat-value">{pendingLots}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="charts-row">
        {/* Lots by Department */}
        <div className="chart-card">
          <h3 className="chart-title">Lots by Department</h3>
          {deptDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Bar dataKey="lots" radius={[4, 4, 0, 0]}>
                  {deptDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No active lots</p></div>
          )}
        </div>

        {/* Lots by Status */}
        <div className="chart-card">
          <h3 className="chart-title">Lot Status Breakdown</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No lots yet</p></div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="chart-card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="chart-title">Recent Lots</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lot #</th>
                <th>Party</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {[...allLots].reverse().slice(0, 10).map(lot => (
                <tr key={lot.id}>
                  <td>{lot.lotNumber}</td>
                  <td>{lot.partyName}</td>
                  <td>{lot.quantity} kg</td>
                  <td>
                    <span className={`status-badge status-${lot.status}`}>
                      {lot.status === 'complete' ? 'Done' : lot.status === 'inprocess' ? 'Running' : 'Waiting'}
                    </span>
                  </td>
                  <td>{lot.createdAt ? new Date(lot.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
