// ============================================================
// OperatorPrompt — First-launch operator name & role selection
// ============================================================

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { STAGE_POOL } from '../../data/mockData';
import { Factory, User, Shield, ArrowRight } from 'lucide-react';

export default function OperatorPrompt() {
  const { dispatch } = useApp();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('admin');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      dispatch({ type: 'SET_OPERATOR', payload: { name: name.trim(), department } });
    }
  };

  return (
    <div className="operator-prompt-overlay">
      <div className="operator-prompt-card">
        <div className="sidebar-logo-icon" style={{ margin: '0 auto var(--space-5)', width: '56px', height: '56px' }}>
          <Factory size={28} />
        </div>
        <h2 style={{ color: 'var(--accent-primary)', marginBottom: 'var(--space-2)' }}>
          TextileFlow MES
        </h2>
        <p>Who is operating this station?</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
            <label className="form-label">
              <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Operator Name
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., Ramesh"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{ textAlign: 'center', fontSize: 'var(--font-size-xl)' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-5)', textAlign: 'left' }}>
            <label className="form-label">
              <Shield size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Station Role
            </label>
            <select
              className="form-select"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              style={{ textAlign: 'center' }}
            >
              <option value="admin">Admin — Full Access</option>
              <optgroup label="Departments">
                {STAGE_POOL.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} Department
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <button
            className="btn btn-primary btn-xl btn-full"
            type="submit"
            disabled={!name.trim()}
          >
            {department === 'admin' ? 'Enter Admin Panel' : 'Enter ' + (STAGE_POOL.find(s => s.id === department)?.name || '') + ' Floor'}
            <ArrowRight size={22} />
          </button>
        </form>
      </div>
    </div>
  );
}
