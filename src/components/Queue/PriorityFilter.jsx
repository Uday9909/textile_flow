// ============================================================
// PriorityFilter — Tab bar for filtering by priority
// ============================================================

export default function PriorityFilter({ active, onChange, counts }) {
  const tabs = [
    { key: 'all', label: 'All', color: null },
    { key: 'urgent', label: 'Urgent', color: 'var(--priority-urgent)' },
    { key: 'normal', label: 'Normal', color: 'var(--priority-normal)' },
    { key: 'low', label: 'Low', color: 'var(--priority-low)' },
  ];

  return (
    <div className="filter-tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`filter-tab ${active === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          <span className="tab-count">{counts[tab.key] || 0}</span>
        </button>
      ))}
    </div>
  );
}
