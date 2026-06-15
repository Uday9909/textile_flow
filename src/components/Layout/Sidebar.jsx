// ============================================================
// Sidebar — Factory navigation
// ============================================================

import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { STAGE_POOL } from '../../data/mockData';
import {
  Plus, LayoutDashboard, Brain, Truck, History,
  Factory, Menu, X, RotateCcw, LogOut
} from 'lucide-react';
import { useState } from 'react';

// Department stages that appear in the queue nav
const QUEUE_DEPARTMENTS = ['grey', 'batching', 'scouring', 'bleaching', 'dyeing', 'hydro', 'drying', 'printing', 'brushing', 'compacting', 'anti_pilling', 'finishing', 'packing'];

export default function Sidebar() {
  const { state, dispatch, getWaitingLots, getInProcessLots, resetData } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = state.department === 'admin';
  const userDept = state.department;

  // Count lots per department for badges
  const getDeptCount = (deptId) => {
    return getWaitingLots(deptId).length + getInProcessLots(deptId).length;
  };

  // Only show departments that have lots or are commonly used
  const activeDepartments = QUEUE_DEPARTMENTS.filter(deptId => {
    const count = getDeptCount(deptId);
    return count > 0 || ['grey', 'batching', 'dyeing', 'hydro', 'drying', 'finishing', 'packing'].includes(deptId);
  });

  const handleSwitchUser = () => {
    dispatch({ type: 'CLEAR_OPERATOR' });
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          top: 'var(--space-3)',
          left: 'var(--space-3)',
          zIndex: 300,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-2)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'none',
        }}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Factory size={20} />
          </div>
          <h2>TextileFlow</h2>
        </div>

        {isAdmin ? (
          /* ── Admin Sidebar ── */
          <>
            {/* Main Nav */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Main</div>
              <nav className="sidebar-nav">
                <NavLink
                  to="/create"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Plus size={18} />
                  <span>Create Lot</span>
                </NavLink>
                <NavLink
                  to="/supervisor"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink
                  to="/ai-panel"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Brain size={18} />
                  <span>AI Supervisor</span>
                </NavLink>
              </nav>
            </div>

            {/* Department Queues */}
            <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="sidebar-section-title">Department Queues</div>
              <nav className="sidebar-nav">
                {activeDepartments.map(deptId => {
                  const stage = STAGE_POOL.find(s => s.id === deptId);
                  const count = getDeptCount(deptId);
                  return (
                    <NavLink
                      key={deptId}
                      to={`/queue/${deptId}`}
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="dept-dot" style={{ background: stage?.accent || 'var(--accent-primary)' }} />
                      <span>{stage?.name || deptId}</span>
                      {count > 0 && <span className="badge">{count}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Nav */}
            <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <nav className="sidebar-nav">
                <NavLink
                  to="/dispatch"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Truck size={18} />
                  <span>Dispatch</span>
                </NavLink>
                <NavLink
                  to="/history"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <History size={18} />
                  <span>Production History</span>
                </NavLink>
                <button
                  className="sidebar-nav-item"
                  onClick={() => { handleSwitchUser(); setMobileOpen(false); }}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <LogOut size={16} />
                  <span>Switch User</span>
                </button>
                <button
                  className="sidebar-nav-item"
                  onClick={() => { resetData(); setMobileOpen(false); }}
                  style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}
                >
                  <RotateCcw size={14} />
                  <span>Reset Demo Data</span>
                </button>
              </nav>
            </div>
          </>
        ) : (
          /* ── Department User Sidebar ── */
          <>
            <div className="sidebar-section" style={{ flex: 1 }}>
              <div className="sidebar-section-title">My Department</div>
              <nav className="sidebar-nav">
                {STAGE_POOL.filter(s => s.id === userDept).map(stage => (
                  <NavLink
                    key={stage.id}
                    to={`/queue/${stage.id}`}
                    className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="dept-dot" style={{ background: stage.accent }} />
                    <span style={{ fontWeight: 700 }}>{stage.name}</span>
                    <span className="badge">{getDeptCount(stage.id)}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="sidebar-section-title" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', padding: '0 var(--space-3)', marginBottom: 'var(--space-2)' }}>
                Signed in as <strong style={{ color: 'var(--text-secondary)' }}>{state.operatorName}</strong>
              </div>
              <nav className="sidebar-nav">
                <button
                  className="sidebar-nav-item"
                  onClick={() => { handleSwitchUser(); setMobileOpen(false); }}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <LogOut size={16} />
                  <span>Switch User</span>
                </button>
              </nav>
            </div>
          </>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 150,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
